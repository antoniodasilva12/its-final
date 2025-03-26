import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiDollarSign } from 'react-icons/fi';
import { IoBedOutline } from 'react-icons/io5';
import { supabase } from '../../services/supabase';

interface QuickAccessCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  link: string;
  bgColor: string;
}

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({ icon: Icon, title, value, link, bgColor }) => {
  const navigate = useNavigate();
  return (
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
};

const QuickAccess = () => {
  const [recentPayment, setRecentPayment] = React.useState<any>(null);
  const [roomDetails, setRoomDetails] = React.useState<any>(null);

  React.useEffect(() => {
    fetchQuickAccessData();
  }, []);

  const fetchQuickAccessData = async () => {
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

      // Fetch room details
      const { data: room } = await supabase
        .from('room_allocations')
        .select('*, rooms(*)')
        .eq('student_id', user.id)
        .is('end_date', null)
        .single();

      setRoomDetails(room);
    } catch (error) {
      console.error('Error fetching quick access data:', error);
    }
  };

  return (
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
    </div>
  );
};

export default QuickAccess;
