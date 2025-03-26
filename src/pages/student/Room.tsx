import React from 'react';
import { useAuthCheck } from '../../components/AuthCheck';
import { useRoomAllocation } from '../../hooks/useRoomAllocation';

const Room: React.FC = () => {
  useAuthCheck();
  const { loading, error, roomAllocation, hasPendingBooking, refreshAllocation } = useRoomAllocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!roomAllocation && !hasPendingBooking) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Room Status</h2>
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              You don't have a room allocated yet.
            </p>
            <p className="text-sm text-gray-500">
              Please book a room to view your room details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (hasPendingBooking) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Room Status</h2>
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              Your room booking request is pending approval.
            </p>
            <p className="text-sm text-gray-500">
              An administrator will review your request soon.
            </p>
            <button
              onClick={refreshAllocation}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  // At this point, we know roomAllocation is not null
  const allocation = roomAllocation!;

  return (
    <div className="p-4">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Your Room Details</h2>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Active Allocation
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-gray-600">Room Number</span>
              <span className="font-medium text-gray-900">{allocation.room.room_number}</span>
            </div>
            
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-gray-600">Floor</span>
              <span className="font-medium text-gray-900">{allocation.room.floor}</span>
            </div>
            
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-gray-600">Room Type</span>
              <span className="font-medium text-gray-900">{allocation.room.type || 'Standard'}</span>
            </div>
            
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-gray-600">Capacity</span>
              <span className="font-medium text-gray-900">{allocation.room.capacity} persons</span>
            </div>
            
            <div className="flex justify-between items-center pb-4">
              <span className="text-gray-600">Monthly Rent</span>
              <span className="font-medium text-gray-900">KSh {allocation.room.price_per_month.toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Allocation Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-gray-600">Start Date</span>
                <span className="font-medium text-gray-900">{new Date(allocation.start_date).toLocaleDateString()}</span>
              </div>
              
              {allocation.end_date && (
                <div className="flex justify-between items-center pb-4">
                  <span className="text-gray-600">End Date</span>
                  <span className="font-medium text-gray-900">{new Date(allocation.end_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={refreshAllocation}
            className="mt-6 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default Room; 