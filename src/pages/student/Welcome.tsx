const Welcome = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Welcome to Student Portal</h1>
      <p className="text-gray-600 mb-8">
        Use the sidebar menu to access your hostel services and manage your stay.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">Quick Guide</h2>
          <ul className="space-y-2 text-gray-600">
            <li>• View and manage your room details</li>
            <li>• Make hostel fee payments</li>
            <li>• Submit maintenance requests</li>
            <li>• Schedule laundry services</li>
            <li>• Access meal plans and resources</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
