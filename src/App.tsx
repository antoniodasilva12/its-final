import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import Profile from './pages/student/Profile';
import MyRoom from './pages/student/Room';
import BookRoom from './pages/student/BookRoom';
import Payment from './pages/student/Payment';
import PaymentHistory from './pages/student/PaymentHistory';
import Maintenance from './pages/student/MaintenanceRequest';
import LaundryRequest from './pages/student/LaundryRequest';
import MealPlan from './pages/student/MealPlan';
import ResourceManagement from './pages/student/ResourceManagement';
import StudentHandbook from './pages/student/StudentHandbook';
import StudentSettings from './pages/student/Settings';
import AdminHome from './pages/admin/AdminHome';
import Students from './pages/admin/Students';
import Rooms from './pages/admin/Rooms';
import RoomAllocation from './pages/admin/RoomAllocation';
import MaintenanceManagement from './pages/admin/MaintenanceManagement';
import LaundryManagement from './pages/admin/Laundry';
import Resources from './pages/admin/Resources';
import Reports from './pages/admin/Reports';
import PredictiveAnalytics from './pages/admin/PredictiveAnalytics';
import PrivateRoute from './components/PrivateRoute';
import StudentLayout from './layouts/StudentLayout';
import AdminPayments from './pages/admin/Payments';
import AdminMealPlans from './pages/admin/MealPlans';
import BookingRequests from './pages/admin/BookingRequests';
import AdminSettings from './pages/admin/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<PrivateRoute allowedRoles={['admin']}><AdminDashboard /></PrivateRoute>}>
          <Route index element={<AdminHome />} />
          <Route path="dashboard" element={<AdminHome />} />
          <Route path="students" element={<Students />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="allocations" element={<RoomAllocation />} />
          <Route path="maintenance" element={<MaintenanceManagement />} />
          <Route path="laundry" element={<LaundryManagement />} />
          <Route path="resources" element={<Resources />} />
          <Route path="predictive-analytics" element={<PredictiveAnalytics />} />
          <Route path="reports" element={<Reports />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="meal-plans" element={<AdminMealPlans />} />
          <Route path="bookings" element={<BookingRequests />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        
        {/* Student Routes */}
        <Route path="/student" element={<PrivateRoute allowedRoles={['student']}><StudentLayout /></PrivateRoute>}>
          <Route index element={<StudentDashboard />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="room" element={<MyRoom />} />
          <Route path="booking" element={<BookRoom />} />
          <Route path="payment" element={<Payment />} />
          <Route path="payment-history" element={<PaymentHistory />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="laundry" element={<LaundryRequest />} />
          <Route path="meal" element={<MealPlan />} />
          <Route path="resources" element={<ResourceManagement />} />
          <Route path="handbook" element={<StudentHandbook />} />
          <Route path="settings" element={<StudentSettings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;