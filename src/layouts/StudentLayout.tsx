import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';

const StudentLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 flex-shrink-0">
        <Sidebar role="student" />
      </div>
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default StudentLayout;
