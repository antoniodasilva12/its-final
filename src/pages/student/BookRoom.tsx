import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuthCheck } from '../../components/AuthCheck';
import { useRoomAllocation } from '../../hooks/useRoomAllocation';

interface Room {
  id: string;
  room_number: string;
  floor: number;
  capacity: number;
  price_per_month: number;
  type?: string;
  is_occupied: boolean;
}

const BookRoom: React.FC = () => {
  useAuthCheck();
  const { loading: allocationLoading, error: allocationError, roomAllocation, hasPendingBooking, refreshAllocation } = useRoomAllocation();
  
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  useEffect(() => {
    fetchAvailableRooms();
  }, []);

  const fetchAvailableRooms = async () => {
    try {
      setLoading(true);
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_occupied', false)
        .order('room_number');

      if (roomsError) throw roomsError;
      setAvailableRooms(rooms || []);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Failed to fetch available rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleBookRoom = async (roomId: string) => {
    try {
      setBookingInProgress(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create a booking request
      const { error: bookingError } = await supabase
        .from('booking_requests')
        .insert({
          student_id: user.id,
          room_id: roomId,
          request_date: new Date().toISOString(),
          status: 'pending'
        });

      if (bookingError) throw bookingError;

      // Refresh the allocation status
      await refreshAllocation();
      
    } catch (err) {
      console.error('Error booking room:', err);
      setError('Failed to book room. Please try again.');
    } finally {
      setBookingInProgress(false);
    }
  };

  if (loading || allocationLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || allocationError) {
    return (
      <div className="p-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error || allocationError}
        </div>
      </div>
    );
  }

  if (roomAllocation) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Book a Room</h2>
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              You already have an active room allocation.
            </p>
            <p className="text-sm text-gray-500">
              Room Number: {roomAllocation.room.room_number}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              You cannot book another room while you have an active allocation.
              Please contact the hostel administration if you need to change rooms.
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

  if (hasPendingBooking) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Book a Room</h2>
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              You have a pending room booking request.
            </p>
            <p className="text-sm text-gray-500">
              Your booking request is awaiting approval from the hostel administration.
              You will be notified once your request has been processed.
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

  return (
    <div className="p-4">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Available Rooms</h2>
          
          {availableRooms.length === 0 ? (
            <div className="text-center text-gray-600">
              <p className="mb-2">No rooms are available for booking at the moment.</p>
              <p className="text-sm text-gray-500">Please check back later or contact the administration.</p>
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableRooms.map((room) => (
                <div key={room.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-900">Room {room.room_number}</h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">Floor: {room.floor}</p>
                    <p className="text-sm text-gray-600">Capacity: {room.capacity} persons</p>
                    <p className="text-sm text-gray-600">Type: {room.type || 'Standard'}</p>
                    <p className="text-sm font-medium text-green-600">
                      KSh {room.price_per_month.toLocaleString()}/month
                    </p>
                  </div>
                  <button
                    onClick={() => handleBookRoom(room.id)}
                    disabled={bookingInProgress}
                    className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bookingInProgress ? 'Booking...' : 'Book Now'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookRoom; 