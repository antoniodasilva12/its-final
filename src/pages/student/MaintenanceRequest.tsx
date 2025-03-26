import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { FiAlertCircle, FiTool } from 'react-icons/fi';
import { analyzeMaintenanceIssue } from '../../services/maintenanceAI';
import { useAuthCheck } from '../../components/AuthCheck';

interface Room {
  id: string;
  room_number: string;
  floor: number;
  capacity: number;
  price_per_month: number;
  type: string;
}

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  room_number: string;
}

interface QuickFix {
  title: string;
  steps: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  tools_needed: string[];
}

const MaintenanceRequest: React.FC = () => {
  useAuthCheck();
  
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const [hasPendingBooking, setHasPendingBooking] = useState(false);
  const [quickFixes, setQuickFixes] = useState<QuickFix[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'low' as MaintenanceRequest['priority']
  });

  useEffect(() => {
    fetchRequests();
    fetchStudentRoom();
  }, []);

  const fetchStudentRoom = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('Fetching for user:', user.id);

      // Fetch room allocation with room details in a single query
      const { data: allocationData, error: allocationError } = await supabase
        .from('room_allocations')
        .select(`
          id,
          start_date,
          end_date,
          rooms!inner (
            id,
            room_number,
            floor,
            capacity,
            price_per_month
          )
        `)
        .eq('student_id', user.id)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (allocationError && allocationError.code !== 'PGRST116') {
        console.error('Error fetching allocation:', allocationError);
        throw allocationError;
      }

      console.log('Allocation data:', allocationData);

      if (allocationData) {
        setRoomNumber(allocationData.rooms.room_number);
        setHasPendingBooking(false);
        return;
      }

      // If no allocation, check for pending booking requests
      const { data: pendingData, error: pendingError } = await supabase
        .from('booking_requests')
        .select(`
          id,
          request_date,
          rooms!inner (
            id,
            room_number,
            floor,
            capacity,
            price_per_month
          )
        `)
        .eq('student_id', user.id)
        .eq('status', 'pending')
        .order('request_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pendingError && pendingError.code !== 'PGRST116') {
        console.error('Error fetching pending booking:', pendingError);
        throw pendingError;
      }

      console.log('Pending booking data:', pendingData);

      if (pendingData) {
        setRoomNumber(null);
        setHasPendingBooking(true);
      } else {
        setRoomNumber(null);
        setHasPendingBooking(false);
      }
      
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to fetch room details');
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = () => {
    setLoading(true);
    fetchStudentRoom();
  };

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to fetch maintenance requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber) {
      setError('You must have an allocated room to submit maintenance requests');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get AI suggestions for quick fixes before submission
      const suggestions = await analyzeMaintenanceIssue(formData.title, formData.description);
      setQuickFixes(suggestions); // Set quick fixes before database insertion

      const { error: submitError } = await supabase
        .from('maintenance_requests')
        .insert({
          student_id: user.id,
          room_number: roomNumber,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          status: 'pending'
        });

      if (submitError) throw submitError;
      
      // Reset form and refresh requests
      setFormData({
        title: '',
        description: '',
        priority: 'low'
      });
      setError(null); // Clear any previous errors
      setQuickFixes(suggestions); // Set quick fixes after successful submission
      await fetchRequests();

    } catch (err) {
      console.error('Error submitting request:', err);
      setError('Failed to submit maintenance request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submit Request Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Submit Maintenance Request</h2>
          
          {!roomNumber && (
            <div className="mb-6">
              <div className="flex items-start space-x-2 text-yellow-700 bg-yellow-50 p-4 rounded-lg mb-2">
                <FiAlertCircle className="w-5 h-5 mt-0.5" />
                {hasPendingBooking ? (
                  <p className="text-sm">You have a pending room booking request. Maintenance requests can be submitted after your booking is approved.</p>
                ) : (
                  <p className="text-sm">You need to have an allocated room to submit maintenance requests.</p>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="issue_title" className="block text-sm font-medium text-gray-700 mb-1">
                Issue Title
              </label>
              <input
                id="issue_title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Broken Light Fixture"
              />
            </div>

            <div>
              <label htmlFor="issue_description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="issue_description"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Please provide detailed description of the issue..."
              />
            </div>

            <div>
              <label htmlFor="priority_level" className="block text-sm font-medium text-gray-700 mb-1">
                Priority Level
              </label>
              <select
                id="priority_level"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting || !roomNumber}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* Quick Fix Suggestions - Single Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <FiTool className="w-6 h-6 mr-2 text-blue-600" />
            Quick Fix Suggestions
          </h2>
          
          {submitting ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Analyzing your issue...</span>
            </div>
          ) : quickFixes.length > 0 ? (
            <div className="space-y-6">
              {quickFixes.map((fix, index) => (
                <div 
                  key={index} 
                  className={`rounded-lg border ${
                    fix.difficulty === 'easy' 
                      ? 'border-green-200 bg-green-50' 
                      : fix.difficulty === 'medium'
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-red-200 bg-red-50'
                  } p-4`}
                >
                  <h3 className="font-semibold text-lg mb-3">{fix.title}</h3>
                  
                  <div className="mb-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      fix.difficulty === 'easy'
                        ? 'bg-green-100 text-green-800'
                        : fix.difficulty === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {fix.difficulty.charAt(0).toUpperCase() + fix.difficulty.slice(1)} Difficulty
                    </span>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Required Tools:</h4>
                    <div className="flex flex-wrap gap-2">
                      {fix.tools_needed.map((tool, toolIndex) => (
                        <span 
                          key={toolIndex} 
                          className="inline-flex items-center px-2 py-1 rounded-md bg-white text-gray-700 text-sm border border-gray-200"
                        >
                          <FiTool className="w-3 h-3 mr-1" />
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Steps to Try:</h4>
                    <ol className="list-decimal list-inside space-y-2">
                      {fix.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="text-gray-700 text-sm pl-1">{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>Submit a maintenance request to get quick fix suggestions.</p>
            </div>
          )}
        </div>

        {/* Maintenance Requests History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Request History</h2>
            
            {requests.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>No maintenance requests found.</p>
                <p className="text-sm mt-1">Submit a new request using the form above.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{request.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(request.status)}`}>
                        {request.status.replace('_', ' ').charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{request.description}</p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Room: {request.room_number}</span>
                      <span>Submitted: {new Date(request.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceRequest;