import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { FiCheck, FiX, FiRefreshCw, FiFilter } from 'react-icons/fi';

interface BookingRequest {
  id: string;
  student_id: string;
  room_id: string;
  request_date: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  profiles: {
    full_name: string;
    registration_number: string;
    email: string;
  };
  rooms: {
    room_number: string;
    type: string;
    floor_number: number | null;
  };
}

const BookingRequests: React.FC = () => {
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<string[]>([]);
  const [filterChangeNotice, setFilterChangeNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchBookingRequests();
  }, [filter]);

  const fetchBookingRequests = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('booking_requests')
        .select(`
          *,
          profiles (full_name, registration_number, email),
          rooms (room_number, type, floor_number)
        `)
        .order('request_date', { ascending: false });
      
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setBookingRequests(data || []);
    } catch (err: any) {
      console.error('Error fetching booking requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      // Mark this request as processing
      setProcessingRequests(prev => [...prev, id]);
      
      console.log('Approving booking request:', id);
      
      // Get the booking request details
      const { data: requestData, error: requestError } = await supabase
        .from('booking_requests')
        .select('student_id, room_id, status')
        .eq('id', id)
        .single();
      
      if (requestError) {
        console.error('Error fetching booking request details:', requestError);
        throw requestError;
      }
      
      if (!requestData) {
        console.error('Booking request not found');
        throw new Error('Booking request not found');
      }
      
      // Directly update the status in the database first - CRITICAL STEP
      const { error: updateError } = await supabase
        .from('booking_requests')
        .update({ 
          status: 'approved',
          // Add a timestamp to force a change
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (updateError) {
        console.error('Error updating booking status:', updateError);
        throw updateError;
      }
      
      console.log('Booking status updated successfully');
      
      // Create the room allocation in a separate step
      const { error: allocationError } = await supabase
        .from('room_allocations')
        .insert([{
          student_id: requestData.student_id,
          room_id: requestData.room_id,
          start_date: new Date().toISOString()
        }]);
      
      if (allocationError) {
        console.error('Error creating room allocation:', allocationError);
        // Don't throw here, still consider it a success if the status update worked
      }
      
      // Update the room status
      await supabase
        .from('rooms')
        .update({ is_occupied: true })
        .eq('id', requestData.room_id);
        
      console.log('Request fully processed');
      
      // Update the UI
      setBookingRequests(prev => 
        prev.map(request => 
          request.id === id 
            ? { ...request, status: 'approved' }
            : request
        )
      );
      
      // Force a complete refresh to ensure everything is in sync
      fetchBookingRequests();
      
    } catch (err: any) {
      console.error('Error in approval process:', err);
      alert('Error approving booking: ' + (err.message || 'Unknown error'));
      // Try to refresh data to get back to consistent state
      fetchBookingRequests();
    } finally {
      // Remove from processing list
      setProcessingRequests(prev => prev.filter(reqId => reqId !== id));
    }
  };

  const handleReject = async (id: string) => {
    try {
      // Mark this request as processing
      setProcessingRequests(prev => [...prev, id]);
      
      console.log('Rejecting booking request:', id);
      
      // Get the booking request details
      const { data: requestData, error: requestError } = await supabase
        .from('booking_requests')
        .select('status')
        .eq('id', id)
        .single();
      
      if (requestError) {
        console.error('Error fetching booking request details:', requestError);
        throw requestError;
      }
      
      // Directly update the status in the database
      const { error: updateError } = await supabase
        .from('booking_requests')
        .update({ 
          status: 'rejected',
          // Add a timestamp to force a change
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (updateError) {
        console.error('Error updating booking status:', updateError);
        throw updateError;
      }
      
      console.log('Booking rejected successfully');
      
      // Update the UI
      setBookingRequests(prev => 
        prev.map(request => 
          request.id === id 
            ? { ...request, status: 'rejected' }
            : request
        )
      );
      
      // Force a complete refresh to ensure everything is in sync
      fetchBookingRequests();
      
    } catch (err: any) {
      console.error('Error in rejection process:', err);
      alert('Error rejecting booking: ' + (err.message || 'Unknown error'));
      // Try to refresh data to get back to consistent state
      fetchBookingRequests();
    } finally {
      // Remove from processing list
      setProcessingRequests(prev => prev.filter(reqId => reqId !== id));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  // Helper function to set filter with notification
  const setFilterWithNotice = (newFilter: 'all' | 'pending' | 'approved' | 'rejected', message?: string) => {
    setFilter(newFilter);
    if (message) {
      setFilterChangeNotice(message);
      setTimeout(() => setFilterChangeNotice(null), 3000); // Clear after 3 seconds
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Booking Requests</h1>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterWithNotice('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                filter === 'all' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterWithNotice('pending')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                filter === 'pending' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterWithNotice('approved')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                filter === 'approved' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilterWithNotice('rejected')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                filter === 'rejected' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              Rejected
            </button>
          </div>
          <button
            onClick={fetchBookingRequests}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <FiRefreshCw className="mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {filterChangeNotice && (
        <div className="mb-6 p-4 text-sm text-blue-700 bg-blue-100 rounded-lg animate-pulse">
          {filterChangeNotice}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {bookingRequests.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No booking requests found
            </li>
          ) : (
            bookingRequests.map((request) => (
              <li key={request.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">{request.profiles?.full_name}</h3>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Student ID</p>
                        <p className="text-sm font-medium">{request.profiles?.registration_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-sm font-medium">{request.profiles?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Room</p>
                        <p className="text-sm font-medium">
                          {request.rooms?.room_number} ({request.rooms?.type}) - Floor {request.rooms?.floor_number || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Request Date</p>
                        <p className="text-sm font-medium">
                          {new Date(request.request_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {request.notes && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">Notes</p>
                        <p className="text-sm">{request.notes}</p>
                      </div>
                    )}
                  </div>
                  {request.status === 'pending' && (
                    <div className="ml-4 flex items-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (confirm('Are you sure you want to approve this booking request?')) {
                            handleApprove(request.id);
                          }
                        }}
                        disabled={processingRequests.includes(request.id)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                        aria-label="Approve booking request"
                      >
                        {processingRequests.includes(request.id) ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <FiCheck className="mr-2 h-5 w-5" />
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (confirm('Are you sure you want to reject this booking request?')) {
                            handleReject(request.id);
                          }
                        }}
                        disabled={processingRequests.includes(request.id)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                        aria-label="Reject booking request"
                      >
                        {processingRequests.includes(request.id) ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <FiX className="mr-2 h-5 w-5" />
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default BookingRequests; 