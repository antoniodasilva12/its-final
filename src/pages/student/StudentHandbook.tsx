import React, { useState } from 'react';
import { FiBook, FiClock, FiPhone, FiShield, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import { GiWashingMachine } from 'react-icons/gi';
import { IoBedOutline } from 'react-icons/io5';
import { RiLeafLine } from 'react-icons/ri';

interface HandbookSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const StudentHandbook: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('general');

  const sections: HandbookSection[] = [
    {
      id: 'general',
      title: 'General Rules',
      icon: <FiBook className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">General Rules and Guidelines</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Students must carry their ID cards at all times within the hostel premises</li>
            <li>Maintain silence in corridors and common areas</li>
            <li>No visitors are allowed in residential areas without prior permission</li>
            <li>Smoking and alcohol consumption is strictly prohibited</li>
            <li>Keep your rooms clean and tidy</li>
            <li>Report any damages or maintenance issues immediately</li>
            <li>Respect other residents' privacy and personal space</li>
            <li>Follow the prescribed dress code in common areas</li>
          </ul>
        </div>
      )
    },
    {
      id: 'timings',
      title: 'Hostel Timings',
      icon: <FiClock className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Important Timings</h3>
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-medium">Entry/Exit Times</h4>
              <p>Gate closes at 10:00 PM</p>
              <p>Gate opens at 5:00 AM</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-medium">Meal Times</h4>
              <p>Breakfast: 6:30 AM - 9:00 AM</p>
              <p>Lunch: 12:00 PM - 2:00 PM</p>
              <p>Dinner: 7:00 PM - 9:00 PM</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-medium">Laundry Hours</h4>
              <p>Monday to Saturday: 8:00 AM - 6:00 PM</p>
              <p>Sunday: 9:00 AM - 4:00 PM</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'facilities',
      title: 'Facilities',
      icon: <IoBedOutline className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Available Facilities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <div className="flex items-center space-x-2 mb-2">
                <IoBedOutline className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium">Accommodation</h4>
              </div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Furnished rooms</li>
                <li>Study tables and chairs</li>
                <li>Storage facilities</li>
                <li>24/7 hot water</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="flex items-center space-x-2 mb-2">
                <GiWashingMachine className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium">Laundry</h4>
              </div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Washing machines</li>
                <li>Dryers</li>
                <li>Ironing facilities</li>
                <li>Laundry service available</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="flex items-center space-x-2 mb-2">
                <RiLeafLine className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium">Recreation</h4>
              </div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Common room with TV</li>
                <li>Indoor games</li>
                <li>Reading room</li>
                <li>Gym facilities</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'emergency',
      title: 'Emergency',
      icon: <FiAlertTriangle className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Emergency Procedures</h3>
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded">
              <h4 className="font-medium text-red-700 mb-2">Emergency Contacts</h4>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <FiPhone className="text-red-600" />
                  <span>Warden: +254 700 000000</span>
                </li>
                <li className="flex items-center space-x-2">
                  <FiPhone className="text-red-600" />
                  <span>Security: +254 700 000001</span>
                </li>
                <li className="flex items-center space-x-2">
                  <FiPhone className="text-red-600" />
                  <span>Medical Emergency: +254 700 000002</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Emergency Procedures</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li>In case of fire, use the nearest fire exit</li>
                <li>Assembly point is located at the main parking area</li>
                <li>First aid kits are available at the warden's office</li>
                <li>Report any suspicious activities to security immediately</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'discipline',
      title: 'Discipline',
      icon: <FiShield className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Disciplinary Guidelines</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Prohibited Activities</h4>
              <ul className="list-disc pl-5 space-y-2 text-red-600">
                <li>Smoking or consumption of alcohol</li>
                <li>Vandalism of hostel property</li>
                <li>Ragging or harassment of any kind</li>
                <li>Unauthorized gatherings</li>
                <li>Use of electrical appliances without permission</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Consequences</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li>Written warning</li>
                <li>Fine as determined by management</li>
                <li>Suspension from hostel</li>
                <li>Expulsion in severe cases</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Student Handbook</h2>
            
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Sidebar Navigation */}
              <div className="lg:w-64 flex-shrink-0">
                <nav className="space-y-1 sticky top-0">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        activeSection === section.id
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="mr-3">{section.icon}</span>
                      {section.title}
                      {activeSection === section.id && (
                        <FiCheck className="ml-auto h-5 w-5" />
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Content Area */}
              <div className="flex-1">
                <div className="bg-white rounded-lg">
                  {sections.find(s => s.id === activeSection)?.content}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHandbook;
