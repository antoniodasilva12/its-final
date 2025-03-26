import * as React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { 
  FiHome, 
  FiLogOut, 
  FiTool, 
  FiDollarSign, 
  FiBox, 
  FiUsers, 
  FiSettings, 
  FiCalendar, 
  FiClock, 
  FiBookOpen,
  FiPieChart,
  FiTrendingUp,
  FiClipboard
} from 'react-icons/fi';
import { GiWashingMachine } from 'react-icons/gi';
import { IoBedOutline } from 'react-icons/io5';
import { BsPersonCircle } from 'react-icons/bs';
import { RiLeafLine } from 'react-icons/ri';

type UserRole = 'admin' | 'student';

interface SidebarProps {
  role: UserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const renderAdminSections = () => (
    <div className="space-y-8">
      {/* Overview Section */}
      <div>
        <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Overview
        </h3>
        <div className="mt-2 space-y-1">
          <Link
            to="/admin"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/admin')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <FiHome className="mr-3 h-5 w-5" />
            Dashboard
          </Link>
          <Link
            to="/admin/students"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/admin/students')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <BsPersonCircle className="mr-3 h-5 w-5" />
            Students
          </Link>
        </div>
      </div>

      {/* Room Management */}
      <div>
        <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Room Management
        </h3>
        <div className="mt-2 space-y-1">
          <Link
            to="/admin/rooms"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/admin/rooms')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <IoBedOutline className="mr-3 h-5 w-5" />
            Rooms
          </Link>
          <Link
            to="/admin/allocations"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/admin/allocations')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <FiUsers className="mr-3 h-5 w-5" />
            Room Allocations
          </Link>
          <Link
            to="/admin/bookings"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/admin/bookings')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <FiCalendar className="mr-3 h-5 w-5" />
            Booking Requests
          </Link>
        </div>
      </div>

      {/* Services Management */}
      <div>
        <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Services
        </h3>
        <div className="mt-2 space-y-1">
          <Link
            to="/admin/maintenance"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/admin/maintenance')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <FiTool className="mr-3 h-5 w-5" />
            Maintenance
          </Link>
          <Link
            to="/admin/laundry"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/admin/laundry')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <GiWashingMachine className="mr-3 h-5 w-5" />
            Laundry Services
          </Link>
          <Link
            to="/admin/meal-plans"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/admin/meal-plans')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <RiLeafLine className="mr-3 h-5 w-5" />
            Meal Plans
          </Link>
        </div>
      </div>

      {/* Financial Management */}
      <div>
        <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Finance
        </h3>
        <div className="mt-2 space-y-1">
          <Link
            to="/admin/payments"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/admin/payments')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <FiDollarSign className="mr-3 h-5 w-5" />
            Payments
          </Link>
          <Link
            to="/admin/invoices"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/admin/invoices')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <FiClipboard className="mr-3 h-5 w-5" />
            Invoices
          </Link>
        </div>
      </div>

      {/* Analytics & Reports */}
      <div>
        <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Analytics
        </h3>
        <div className="mt-2 space-y-1">
          <Link
            to="/admin/reports"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/admin/reports')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <FiPieChart className="mr-3 h-5 w-5" />
            Reports
          </Link>
          <Link
            to="/admin/predictive-analytics"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/admin/predictive-analytics')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <FiTrendingUp className="mr-3 h-5 w-5" />
            Predictive Analytics
          </Link>
        </div>
      </div>

      {/* Resources */}
      <div>
        <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Resources
        </h3>
        <div className="mt-2 space-y-1">
          <Link
            to="/admin/resources"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/admin/resources')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <FiBox className="mr-3 h-5 w-5" />
            Resources
          </Link>
          <Link
            to="/admin/settings"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/admin/settings')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <FiSettings className="mr-3 h-5 w-5" />
            Settings
          </Link>
        </div>
      </div>
    </div>
  );

  const renderStudentSections = () => (
    <div className="space-y-8">
      {/* Overview Section */}
      <div>
        <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Overview
        </h3>
        <div className="mt-2 space-y-1">
          <Link
            to="/student"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/student')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <FiHome className="mr-3 h-5 w-5" />
            Dashboard
          </Link>
          <Link
            to="/student/profile"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/student/profile')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <BsPersonCircle className="mr-3 h-5 w-5" />
            My Profile
          </Link>
        </div>
      </div>

      {/* Accommodation Section */}
      <div>
        <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Accommodation
        </h3>
        <div className="mt-2 space-y-1">
          <Link
            to="/student/room"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/student/room')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <IoBedOutline className="mr-3 h-5 w-5" />
            Room Details
          </Link>
          <Link
            to="/student/booking"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/student/booking')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <FiCalendar className="mr-3 h-5 w-5" />
            Room Booking
          </Link>
        </div>
      </div>

      {/* Services Section */}
      <div>
        <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Services
        </h3>
        <div className="mt-2 space-y-1">
          <Link
            to="/student/maintenance"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/student/maintenance')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <FiTool className="mr-3 h-5 w-5" />
            Maintenance
          </Link>
          <Link
            to="/student/laundry"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/student/laundry')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <GiWashingMachine className="mr-3 h-5 w-5" />
            Laundry Service
          </Link>
          <Link
            to="/student/meal"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/student/meal')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <RiLeafLine className="mr-3 h-5 w-5" />
            Meal Plan
          </Link>
        </div>
      </div>

      {/* Payments Section */}
      <div>
        <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Payments
        </h3>
        <div className="mt-2 space-y-1">
          <Link
            to="/student/payment"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/student/payment')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <FiDollarSign className="mr-3 h-5 w-5" />
            Make Payment
          </Link>
          <Link
            to="/student/payment-history"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/student/payment-history')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <FiClock className="mr-3 h-5 w-5" />
            Payment History
          </Link>
        </div>
      </div>

      {/* Resources Section */}
      <div>
        <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Resources
        </h3>
        <div className="mt-2 space-y-1">
          <Link
            to="/student/resources"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/student/resources')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <FiBox className="mr-3 h-5 w-5" />
            Resources
          </Link>
          <Link
            to="/student/handbook"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/student/handbook')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <FiBookOpen className="mr-3 h-5 w-5" />
            Student Handbook
          </Link>
        </div>
      </div>

      {/* Settings Section */}
      <div>
        <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Settings
        </h3>
        <div className="mt-2 space-y-1">
          <Link
            to="/student/settings"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive('/student/settings')
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <FiSettings className="mr-3 h-5 w-5" />
            Settings
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed left-0 top-0 w-64 h-screen bg-gray-800 z-10">
      <div className="flex flex-col h-full">
        <div className="p-4">
          <h2 className="text-xl font-bold text-white">Student Portal</h2>
          <p className="text-sm text-gray-300">Hostel Management System</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <nav className="px-2 py-4">
            {role === 'admin' ? (
              renderAdminSections()
            ) : (
              renderStudentSections()
            )}
          </nav>
        </div>

        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white"
          >
            <FiLogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;