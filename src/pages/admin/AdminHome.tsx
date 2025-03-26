import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { FiUsers, FiHome, FiTool, FiDollarSign, FiPieChart, FiBox, FiCalendar, FiBell } from 'react-icons/fi';
import { GiWashingMachine } from 'react-icons/gi';

interface DashboardStats {
  totalStudents: number;
  totalRooms: number;
  occupiedRooms: number;
  pendingBookings: number;
  pendingMaintenance: number;
  totalRevenue: number;
  unreadNotifications: number;
}

const AdminHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    pendingBookings: 0,
    pendingMaintenance: 0,
    totalRevenue: 0,
    unreadNotifications: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch total students
      const { count: studentCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'student');

      // Fetch rooms data
      const { data: roomsData } = await supabase
        .from('rooms')
        .select('*');

      const totalRooms = roomsData?.length || 0;
      const occupiedRooms = roomsData?.filter(room => room.is_occupied)?.length || 0;

      // Fetch pending bookings
      const { count: bookingCount } = await supabase
        .from('room_bookings')
        .select('*', { count: 'exact' })
        .eq('status', 'pending');

      // Fetch pending maintenance requests
      const { count: maintenanceCount } = await supabase
        .from('maintenance_requests')
        .select('*', { count: 'exact' })
        .eq('status', 'pending');

      // Fetch total revenue (completed payments)
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed');

      const totalRevenue = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

      // Fetch unread notifications
      const { count: notificationCount } = await supabase
        .from('admin_notifications')
        .select('*', { count: 'exact' })
        .eq('read', false);

      // Update stats
      setStats({
        totalStudents: studentCount || 0,
        totalRooms,
        occupiedRooms,
        pendingBookings: bookingCount || 0,
        pendingMaintenance: maintenanceCount || 0,
        totalRevenue,
        unreadNotifications: notificationCount || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const QuickAccessCard = ({ icon: Icon, title, value, subtitle, link, bgColor }: any) => (
    <div 
      onClick={() => navigate(link)}
      className={`${bgColor} rounded-lg p-6 cursor-pointer transform transition-transform hover:scale-105 hover:shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-sm font-medium mb-1">{title}</p>
          <p className="text-white text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-white text-xs mt-1 opacity-80">{subtitle}</p>}
        </div>
        <Icon className="text-white h-8 w-8 opacity-80" />
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Quick Access Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <QuickAccessCard
          icon={FiUsers}
          title="Total Students"
          value={stats.totalStudents}
          subtitle={`${stats.occupiedRooms} rooms occupied`}
          link="/admin/students"
          bgColor="bg-blue-600"
        />
        <QuickAccessCard
          icon={FiHome}
          title="Available Rooms"
          value={stats.totalRooms - stats.occupiedRooms}
          subtitle={`${stats.pendingBookings} pending bookings`}
          link="/admin/rooms"
          bgColor="bg-green-600"
        />
        <QuickAccessCard
          icon={FiDollarSign}
          title="Total Revenue"
          value={`KSh ${stats.totalRevenue.toLocaleString()}`}
          link="/admin/payments"
          bgColor="bg-purple-600"
        />
        <QuickAccessCard
          icon={FiBell}
          title="Notifications"
          value={stats.unreadNotifications}
          subtitle="Unread messages"
          link="/admin/notifications"
          bgColor="bg-orange-600"
        />
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <button
          onClick={() => navigate('/admin/allocations')}
          className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <FiHome className="h-6 w-6 text-blue-600 mb-2" />
          <span className="text-sm font-medium text-gray-700">Room Allocation</span>
        </button>
        <button
          onClick={() => navigate('/admin/maintenance')}
          className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <FiTool className="h-6 w-6 text-blue-600 mb-2" />
          <span className="text-sm font-medium text-gray-700">Maintenance</span>
        </button>
        <button
          onClick={() => navigate('/admin/laundry')}
          className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <GiWashingMachine className="h-6 w-6 text-blue-600 mb-2" />
          <span className="text-sm font-medium text-gray-700">Laundry</span>
        </button>
        <button
          onClick={() => navigate('/admin/resources')}
          className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <FiBox className="h-6 w-6 text-blue-600 mb-2" />
          <span className="text-sm font-medium text-gray-700">Resources</span>
        </button>
        <button
          onClick={() => navigate('/admin/reports')}
          className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <FiPieChart className="h-6 w-6 text-blue-600 mb-2" />
          <span className="text-sm font-medium text-gray-700">Reports</span>
        </button>
      </div>

      {/* Recent Activity */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">System Overview</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div className="flex items-center text-sm">
            <FiHome className="h-5 w-5 text-gray-400 mr-3" />
            <span>Room Occupancy: <strong>{Math.round((stats.occupiedRooms / stats.totalRooms) * 100)}%</strong> ({stats.occupiedRooms} of {stats.totalRooms} rooms)</span>
          </div>
          {stats.pendingBookings > 0 && (
            <div className="flex items-center text-sm">
              <FiCalendar className="h-5 w-5 text-gray-400 mr-3" />
              <span><strong>{stats.pendingBookings}</strong> pending room {stats.pendingBookings === 1 ? 'booking' : 'bookings'}</span>
            </div>
          )}
          {stats.pendingMaintenance > 0 && (
            <div className="flex items-center text-sm">
              <FiTool className="h-5 w-5 text-gray-400 mr-3" />
              <span><strong>{stats.pendingMaintenance}</strong> maintenance {stats.pendingMaintenance === 1 ? 'request' : 'requests'} to review</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
