import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { FiBook, FiBell, FiDollarSign, FiTool, FiClock, FiCalendar, FiBox } from 'react-icons/fi';
import { GiWashingMachine } from 'react-icons/gi';
import { IoBedOutline } from 'react-icons/io5';
import { RiLeafLine } from 'react-icons/ri';
import ChatBot from '../../components/ChatBot';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [recentPayment, setRecentPayment] = React.useState<any>(null);
  const [notifications, setNotifications] = React.useState<number>(0);
  const [maintenanceRequests, setMaintenanceRequests] = React.useState<number>(0);
  const [roomDetails, setRoomDetails] = React.useState<any>(null);

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch recent payment
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', user.id)
        .order('payment_date', { ascending: false })
        .limit(1)
        .single();

      setRecentPayment(payments);

      // Fetch maintenance requests count
      const { count: requestCount } = await supabase
        .from('maintenance_requests')
        .select('*', { count: 'exact' })
        .eq('student_id', user.id)
        .eq('status', 'pending');

      setMaintenanceRequests(requestCount || 0);

      // Fetch room details
      const { data: room } = await supabase
        .from('room_allocations')
        .select('*, rooms(*)')
        .eq('student_id', user.id)
        .is('end_date', null)
        .single();

      setRoomDetails(room);

      // Fetch notifications count (unread)
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('student_id', user.id)
        .eq('read', false);

      setNotifications(notifCount || 0);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const QuickAccessCard = ({ icon: Icon, title, value, link, bgColor }: any) => (
    <div 
      onClick={() => navigate(link)}
      className={`${bgColor} rounded-lg p-6 cursor-pointer transform transition-transform hover:scale-105 hover:shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-sm font-medium mb-1">{title}</p>
          <p className="text-white text-2xl font-bold">{value}</p>
        </div>
        <Icon className="text-white h-8 w-8 opacity-80" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Welcome to Your Dashboard</h1>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <QuickAccessCard
            icon={IoBedOutline}
            title="Room Details"
            value={roomDetails?.rooms?.room_number || 'Not Allocated'}
            link="/student/room"
            bgColor="bg-blue-600"
          />
          <QuickAccessCard
            icon={FiDollarSign}
            title="Latest Payment"
            value={recentPayment ? `KES ${recentPayment.amount}` : 'No Payment'}
            link="/student/payment"
            bgColor="bg-green-600"
          />
          <QuickAccessCard
            icon={FiTool}
            title="Maintenance Requests"
            value={maintenanceRequests}
            link="/student/maintenance"
            bgColor="bg-orange-600"
          />
          <QuickAccessCard
            icon={FiBell}
            title="Notifications"
            value={notifications}
            link="/student/notifications"
            bgColor="bg-purple-600"
          />
        </div>

        {/* Services Quick Access */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Services</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <button
            onClick={() => navigate('/student/booking')}
            className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <FiCalendar className="h-6 w-6 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Book Room</span>
          </button>
          <button
            onClick={() => navigate('/student/laundry')}
            className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <GiWashingMachine className="h-6 w-6 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Laundry</span>
          </button>
          <button
            onClick={() => navigate('/student/meal')}
            className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <RiLeafLine className="h-6 w-6 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Meal Plan</span>
          </button>
          <button
            onClick={() => navigate('/student/resources')}
            className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <FiBox className="h-6 w-6 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Resources</span>
          </button>
          <button
            onClick={() => navigate('/student/handbook')}
            className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <FiBook className="h-6 w-6 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Handbook</span>
          </button>
        </div>

        {/* Recent Activity */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            {recentPayment && (
              <div className="flex items-center text-sm">
                <FiClock className="h-5 w-5 text-gray-400 mr-3" />
                <span>Last payment of <strong>KES {recentPayment.amount}</strong> on {new Date(recentPayment.payment_date).toLocaleDateString()}</span>
              </div>
            )}
            {maintenanceRequests > 0 && (
              <div className="flex items-center text-sm">
                <FiTool className="h-5 w-5 text-gray-400 mr-3" />
                <span>You have <strong>{maintenanceRequests}</strong> pending maintenance {maintenanceRequests === 1 ? 'request' : 'requests'}</span>
              </div>
            )}
            {notifications > 0 && (
              <div className="flex items-center text-sm">
                <FiBell className="h-5 w-5 text-gray-400 mr-3" />
                <span>You have <strong>{notifications}</strong> unread {notifications === 1 ? 'notification' : 'notifications'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <ChatBot />
    </div>
  );
};

export default StudentDashboard;