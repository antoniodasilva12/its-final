import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';

interface MaintenanceRequest {
  id: string;
  student_id: string;
  room_number: string;
  issue_description: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  student_name: string;
}

const MaintenanceRequest = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMaintenanceRequests();
  }, []);

  const fetchMaintenanceRequests = async () => {
    try {
      // Verify admin session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session found');
      }

      // Verify admin role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile || profile.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      // Fetch maintenance requests
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (maintenanceError) {
        throw maintenanceError;
      }

      // Fetch student profiles
      const studentIds = [...new Set(maintenanceData?.map(request => request.student_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds);

      if (profilesError) {
        throw profilesError;
      }

      // Create student names map
      const studentNames = new Map(
        profilesData?.map(profile => [profile.id, profile.full_name]) || []
      );

      // Combine the data
      const transformedData: MaintenanceRequest[] = (maintenanceData || []).map(request => ({
        ...request,
        student_name: studentNames.get(request.student_id) || 'Unknown'
      }));

      setRequests(transformedData);
    } catch (err) {
      console.error('Error fetching maintenance requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch maintenance requests');
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: MaintenanceRequest['status']) => {
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      // Refresh the requests list
      await fetchMaintenanceRequests();
    } catch (err) {
      console.error('Error updating request status:', err);
      setError('Failed to update request status');
    }
  };

  const getNextStatus = (currentStatus: MaintenanceRequest['status']): MaintenanceRequest['status'] | null => {
    const statusFlow: Record<MaintenanceRequest['status'], MaintenanceRequest['status'] | null> = {
      'pending': 'in_progress',
      'in_progress': 'completed',
      'completed': null
    };
    return statusFlow[currentStatus];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Maintenance Requests</h1>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{request.student_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{request.room_number}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{request.issue_description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : ''}
                    ${request.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                  `}>
                    {request.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(request.created_at).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {getNextStatus(request.status) && (
                    <button
                      onClick={() => updateRequestStatus(request.id, getNextStatus(request.status)!)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Mark as {getNextStatus(request.status)}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaintenanceRequest;
