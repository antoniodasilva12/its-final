import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TimeSlot {
  suggested_time: string;
  load_level: string;
  expected_wait_time: number;
}

interface LaundryTimePredictionProps {
  onTimeSelected: (time: string) => void;
}

const LaundryTimePrediction: React.FC<LaundryTimePredictionProps> = ({ onTimeSelected }) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestedTimes = async () => {
    try {
      setLoading(true);
      setError(null);

      const targetDate = new Date();
      const { data, error } = await supabase
        .rpc('suggest_laundry_time', {
          target_date: targetDate.toISOString(),
          window_hours: 24
        });

      if (error) throw error;
      setTimeSlots(data || []);
    } catch (err) {
      console.error('Error fetching suggested times:', err);
      setError('Failed to fetch time suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestedTimes();
  }, []);

  const getLoadLevelColor = (loadLevel: string) => {
    switch (loadLevel.toLowerCase()) {
      case 'peak': return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'off-peak': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const chartData = {
    labels: timeSlots.map(slot => formatTime(slot.suggested_time)),
    datasets: [
      {
        label: 'Expected Wait Time',
        data: timeSlots.map(slot => slot.expected_wait_time),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Laundry Wait Times Throughout the Day'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Wait Time (minutes)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time of Day'
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Suggested Time Slots</h3>
        <button
          onClick={fetchSuggestedTimes}
          className="flex items-center space-x-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-4 rounded-lg mb-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>Suggestions unavailable. You can still select any time that works for you.</p>
        </div>
      )}

      {!loading && timeSlots.length === 0 && !error && (
        <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg mb-4 flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No suggestions available at the moment. Feel free to choose any convenient time.</p>
        </div>
      )}

      {timeSlots.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {timeSlots.map((slot, index) => (
          <button
            key={index}
            onClick={() => onTimeSelected(slot.suggested_time)}
            className={`p-4 rounded-xl border shadow-sm hover:shadow-md transition-all ${getLoadLevelColor(slot.load_level)} relative overflow-hidden group`}
          >
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-lg font-medium">{formatTime(slot.suggested_time)}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize
                  ${slot.load_level === 'peak' ? 'bg-red-200 text-red-800' :
                    slot.load_level === 'moderate' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-green-200 text-green-800'}
                `}>
                  {slot.load_level}
                </span>
              </div>
              <div className="text-sm opacity-75">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>~{Math.round(slot.expected_wait_time)} min wait</span>
                </div>
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 w-full h-1 opacity-50
              ${slot.load_level === 'peak' ? 'bg-red-400' :
                slot.load_level === 'moderate' ? 'bg-yellow-400' :
                'bg-green-400'}
            `}></div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-100 border border-green-200 mr-1"></div>
          Off-peak
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-200 mr-1"></div>
          Moderate
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-100 border border-red-200 mr-1"></div>
          Peak
        </div>
      </div>
    </div>
  );
};

export default LaundryTimePrediction;