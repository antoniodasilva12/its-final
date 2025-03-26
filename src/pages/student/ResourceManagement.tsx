import React, { useState, useEffect } from 'react';
import { supabase, testConnection } from '../../services/supabase';
import { getResourceRecommendations } from '../../services/recommendations';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { RiLeafLine } from 'react-icons/ri';
import { FiAlertCircle } from 'react-icons/fi';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ResourceUsage {
  id?: string;
  electricity_kwh: number;
  water_liters: number;
  date: string;
  student_id: string;
  room_number: string;
}

interface Room {
  id: string;
  room_number: string;
  floor: number;
  capacity: number;
  price_per_month: number;
}

interface RoomAllocationResponse {
  id: string;
  start_date: string;
  end_date: string | null;
  rooms: Room;
}

const ResourceManagement = () => {
  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const [usageHistory, setUsageHistory] = useState<ResourceUsage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<boolean>(false);
  const [hasPendingBooking, setHasPendingBooking] = useState(false);
  const [formData, setFormData] = useState({
    electricity_kwh: '',
    water_liters: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const isConnected = await testConnection();
    setConnectionStatus(isConnected);
    if (isConnected) {
      await fetchStudentRoom();
      await fetchUsageHistory();
    }
  };

  const fetchStudentRoom = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch room details from booking_requests
      const { data: bookingRequest, error: bookingError } = await supabase
        .from('booking_requests')
        .select('*, room:rooms!inner(id, room_number)')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (bookingError) {
        console.error('Error fetching booking:', bookingError);
        throw bookingError;
      }

      if (bookingRequest?.status === 'approved' && bookingRequest.room?.room_number) {
        setRoomNumber(bookingRequest.room.room_number);
        setHasPendingBooking(false);
      } else {
        setRoomNumber(null);
        setHasPendingBooking(bookingRequest?.status === 'pending');
      }
    } catch (error) {
      console.error('Error fetching room status:', error);
      setError('Failed to fetch room status');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('resource_usage')
        .select('*')
        .eq('student_id', user.id)
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;
      setUsageHistory(data || []);
    } catch (err) {
      console.error('Error fetching usage history:', err);
      setError('Failed to fetch usage history');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!roomNumber) {
      setError('Room allocation not found');
      setSubmitting(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First check if an entry already exists for today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingEntry } = await supabase
        .from('resource_usage')
        .select('*')
        .eq('student_id', user.id)
        .eq('room_number', roomNumber)
        .gte('date', today)
        .lt('date', new Date(new Date().setDate(new Date().getDate() + 1)).toISOString())
        .maybeSingle();

      if (existingEntry) {
        // Update existing entry
        const { data: updatedData, error: updateError } = await supabase
          .from('resource_usage')
          .update({
            electricity_kwh: parseFloat(formData.electricity_kwh),
            water_liters: parseFloat(formData.water_liters),
          })
          .eq('id', existingEntry.id)
          .select()
          .single();

        if (updateError) throw updateError;
        if (updatedData) {
          setUsageHistory(prev => prev.map(item => 
            item.id === updatedData.id ? updatedData : item
          ));
        }
      } else {
        // Insert new entry
        const newUsage: ResourceUsage = {
          electricity_kwh: parseFloat(formData.electricity_kwh),
          water_liters: parseFloat(formData.water_liters),
          date: new Date().toISOString(),
          student_id: user.id,
          room_number: roomNumber
        };

        const { data: insertedData, error: insertError } = await supabase
          .from('resource_usage')
          .insert([newUsage])
          .select()
          .single();

        if (insertError) throw insertError;
        if (insertedData) {
          setUsageHistory(prev => [...prev, insertedData]);
        }
      }

      // Generate recommendations based on the new usage
      const newRecommendations = getResourceRecommendations({
        electricity_kwh: parseFloat(formData.electricity_kwh),
        water_liters: parseFloat(formData.water_liters)
      });
      setRecommendations(newRecommendations);

      setFormData({ electricity_kwh: '', water_liters: '' });
      setError(null);

    } catch (err) {
      console.error('Error submitting usage:', err);
      setError('Failed to submit resource usage');
    } finally {
      setSubmitting(false);
    }
  };

  const renderUsageChart = () => {
    if (usageHistory.length === 0) return null;

    const data = {
      labels: usageHistory.map(usage => new Date(usage.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Electricity (kWh)',
          data: usageHistory.map(usage => usage.electricity_kwh),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: 'Water (Liters)',
          data: usageHistory.map(usage => usage.water_liters),
          borderColor: 'rgb(54, 162, 235)',
          tension: 0.1
        }
      ]
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: 'Resource Usage History'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };

    return <Line options={options} data={data} />;
  };

  const refreshStatus = () => {
    setLoading(true);
    fetchStudentRoom();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Resource Management</h1>
        {!connectionStatus ? (
          <div className="text-red-500">
            <FiAlertCircle className="inline-block mr-2" />
            Database connection failed. Please try again later.
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Electricity Usage (kWh)
                </label>
                <input
                  type="number"
                  value={formData.electricity_kwh}
                  onChange={e => setFormData(prev => ({ ...prev, electricity_kwh: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Water Usage (Liters)
                </label>
                <input
                  type="number"
                  value={formData.water_liters}
                  onChange={e => setFormData(prev => ({ ...prev, water_liters: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {submitting ? 'Submitting...' : 'Submit Usage'}
              </button>
            </form>

            {error && (
              <div className="mt-4 text-red-500">
                <FiAlertCircle className="inline-block mr-2" />
                {error}
              </div>
            )}
          </>
        )}
      </div>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <RiLeafLine className="mr-2 text-green-500" />
            Resource Usage Recommendations
          </h2>
          <div className="space-y-4">
            {recommendations.map((recommendation, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg ${
                  recommendation.includes("very high") 
                    ? "bg-red-50 text-red-700"
                    : recommendation.includes("high") 
                    ? "bg-yellow-50 text-yellow-700"
                    : recommendation.includes("moderate") 
                    ? "bg-blue-50 text-blue-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {recommendation.startsWith("•") ? (
                  <p className="ml-4">{recommendation}</p>
                ) : (
                  <p className="font-medium">{recommendation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage History Chart */}
      {usageHistory.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Usage History</h2>
          {renderUsageChart()}
        </div>
      )}

      {!roomNumber && (
        <div className="mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-2">
            {hasPendingBooking ? (
              <p className="text-yellow-700">You have a pending room booking request. Resource management will be available after your booking is approved.</p>
            ) : (
              <p className="text-yellow-700">Room allocation not found. Please contact administration.</p>
            )}
          </div>
          <button 
            type="button"
            onClick={refreshStatus}
            className="w-full mt-2 text-sm text-blue-600 hover:text-blue-800 flex justify-center items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh booking status
          </button>
        </div>
      )}
    </div>
  );
};

export default ResourceManagement;