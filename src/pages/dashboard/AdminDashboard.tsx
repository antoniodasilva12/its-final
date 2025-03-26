import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
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

const AdminDashboard = () => {
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
    <div className="min-h-screen bg-gray-100">
      <Sidebar role="admin" />
      <div className="pl-64">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDashboard;