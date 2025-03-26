import { supabase } from './supabase';

export interface OccupancyStats {
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  availableRooms: number;
  reservedRooms: number;
}

export interface MaintenanceStats {
  totalRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  averageResolutionTime: number;
  commonIssues: Array<{
    issue: string;
    count: number;
  }>;
}

export interface RoomUtilizationStats {
  roomTypeDistribution: Array<{
    type: string;
    count: number;
    occupancyRate: number;
  }>;
  floorUtilization: Array<{
    floor: string;
    occupancyRate: number;
  }>;
  averageStayDuration: number;
}

interface RoomStats {
  total: number;
  occupied: number;
}

export const getOccupancyStats = async (): Promise<OccupancyStats> => {
  try {
    // Get total rooms
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*');

    if (roomsError) throw roomsError;

    const totalRooms = rooms?.length || 0;
    const occupiedRooms = rooms?.filter(room => room.is_occupied).length || 0;
    const availableRooms = totalRooms - occupiedRooms;

    // Get reserved rooms from allocations that have a start_date but no end_date
    const { data: allocations, error: allocationsError } = await supabase
      .from('room_allocations')
      .select('*')
      .is('end_date', null)
      .not('start_date', 'is', null);

    if (allocationsError) throw allocationsError;

    const reservedRooms = allocations?.length || 0;

    return {
      totalRooms,
      occupiedRooms,
      occupancyRate: totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0,
      availableRooms,
      reservedRooms
    };
  } catch (error) {
    console.error('Error fetching occupancy stats:', error);
    throw error;
  }
};

export const getMaintenanceStats = async (): Promise<MaintenanceStats> => {
  try {
    const { data: requests, error: requestsError } = await supabase
      .from('maintenance_requests')
      .select('*');

    if (requestsError) throw requestsError;

    const totalRequests = requests?.length || 0;
    const pendingRequests = requests?.filter(req => req.status === 'pending').length || 0;
    const inProgressRequests = requests?.filter(req => req.status === 'in_progress').length || 0;
    const completedRequests = requests?.filter(req => req.status === 'completed').length || 0;

    // Calculate average resolution time for completed requests
    const completedRequestsData = requests?.filter(req => 
      req.status === 'completed' && req.completed_at && req.created_at
    ) || [];

    const totalResolutionTime = completedRequestsData.reduce((total, req) => {
      const completedAt = new Date(req.completed_at);
      const createdAt = new Date(req.created_at);
      const resolutionTime = (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60); // Convert to hours
      return total + resolutionTime;
    }, 0);

    const averageResolutionTime = completedRequestsData.length > 0
      ? totalResolutionTime / completedRequestsData.length
      : 0;

    // Get common issues
    const issueCount: Record<string, number> = (requests || []).reduce((acc, req) => {
      const issue = (req.issue_type as string) || 'Other';
      acc[issue] = (acc[issue] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commonIssues = Object.entries(issueCount)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Get top 5 issues

    return {
      totalRequests,
      pendingRequests,
      inProgressRequests,
      completedRequests,
      averageResolutionTime,
      commonIssues
    };
  } catch (error) {
    console.error('Error fetching maintenance stats:', error);
    throw error;
  }
};

export const getRoomUtilizationStats = async (): Promise<RoomUtilizationStats> => {
  try {
    // Get all rooms
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*');

    if (roomsError) throw roomsError;

    // Calculate room type distribution
    const roomTypes = rooms?.reduce((acc, room) => {
      const type = room.type || 'Standard'; // Default to 'Standard' if type is not set
      if (!acc[type]) {
        acc[type] = { total: 0, occupied: 0 };
      }
      acc[type].total++;
      if (room.is_occupied) {
        acc[type].occupied++;
      }
      return acc;
    }, {} as Record<string, RoomStats>);

    const roomTypeDistribution = Object.entries(roomTypes || {}).map(([type, stats]) => ({
      type,
      count: (stats as RoomStats).total,
      occupancyRate: ((stats as RoomStats).occupied / (stats as RoomStats).total) * 100
    }));

    // Calculate floor utilization
    const floors = rooms?.reduce((acc, room) => {
      const floor = room.floor?.toString() || '1'; // Default to '1' if floor is not set
      if (!acc[floor]) {
        acc[floor] = { total: 0, occupied: 0 };
      }
      acc[floor].total++;
      if (room.is_occupied) {
        acc[floor].occupied++;
      }
      return acc;
    }, {} as Record<string, RoomStats>);

    const floorUtilization = Object.entries(floors || {}).map(([floor, stats]) => ({
      floor,
      occupancyRate: ((stats as RoomStats).occupied / (stats as RoomStats).total) * 100
    }));

    // Calculate average stay duration from completed allocations
    const { data: completedAllocations, error: completedError } = await supabase
      .from('room_allocations')
      .select('*')
      .not('end_date', 'is', null)
      .not('start_date', 'is', null);

    if (completedError) throw completedError;

    const stayDurations = completedAllocations
      ?.filter(allocation => allocation.end_date && allocation.start_date)
      .map(allocation => {
        const duration = new Date(allocation.end_date).getTime() - new Date(allocation.start_date).getTime();
        return duration / (1000 * 60 * 60 * 24); // Convert to days
      });

    const averageStayDuration = stayDurations?.length
      ? stayDurations.reduce((a, b) => a + b) / stayDurations.length
      : 0;

    return {
      roomTypeDistribution,
      floorUtilization,
      averageStayDuration
    };
  } catch (error) {
    console.error('Error fetching room utilization stats:', error);
    throw error;
  }
};
