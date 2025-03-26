import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { FiSave, FiRefreshCw } from 'react-icons/fi';

interface SystemSettings {
  hostelName: string;
  emailNotifications: boolean;
  semesterStartDate: string;
  semesterEndDate: string;
  defaultRoomPrice: number;
  bookingEnabled: boolean;
}

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    hostelName: 'Student Hostel',
    emailNotifications: true,
    semesterStartDate: new Date().toISOString().split('T')[0],
    semesterEndDate: new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString().split('T')[0],
    defaultRoomPrice: 5000,
    bookingEnabled: true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          ...settings,
          ...data
        });
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Check if settings record exists
      const { data: existingSettings, error: checkError } = await supabase
        .from('system_settings')
        .select('id')
        .limit(1);

      if (checkError) throw checkError;

      let saveError;
      if (existingSettings && existingSettings.length > 0) {
        // Update existing record
        const { error } = await supabase
          .from('system_settings')
          .update(settings)
          .eq('id', existingSettings[0].id);
        saveError = error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('system_settings')
          .insert([settings]);
        saveError = error;
      }

      if (saveError) throw saveError;

      setSuccessMessage('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseFloat(value) : value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchSettings}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={saving}
          >
            <FiRefreshCw className="mr-2" />
            Refresh
          </button>
          <button
            onClick={saveSettings}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            disabled={saving}
          >
            <FiSave className="mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 text-sm text-green-700 bg-green-100 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="hostelName" className="block text-sm font-medium text-gray-700">
              Hostel Name
            </label>
            <input
              type="text"
              name="hostelName"
              id="hostelName"
              value={settings.hostelName}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="defaultRoomPrice" className="block text-sm font-medium text-gray-700">
              Default Room Price (KSh)
            </label>
            <input
              type="number"
              name="defaultRoomPrice"
              id="defaultRoomPrice"
              value={settings.defaultRoomPrice}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="semesterStartDate" className="block text-sm font-medium text-gray-700">
              Semester Start Date
            </label>
            <input
              type="date"
              name="semesterStartDate"
              id="semesterStartDate"
              value={settings.semesterStartDate}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="semesterEndDate" className="block text-sm font-medium text-gray-700">
              Semester End Date
            </label>
            <input
              type="date"
              name="semesterEndDate"
              id="semesterEndDate"
              value={settings.semesterEndDate}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="emailNotifications"
                name="emailNotifications"
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={handleChange}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="emailNotifications" className="font-medium text-gray-700">
                Email Notifications
              </label>
              <p className="text-gray-500">Receive system notifications via email</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="bookingEnabled"
                name="bookingEnabled"
                type="checkbox"
                checked={settings.bookingEnabled}
                onChange={handleChange}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="bookingEnabled" className="font-medium text-gray-700">
                Room Booking
              </label>
              <p className="text-gray-500">Allow students to book rooms</p>
            </div>
          </div>
        </div>
      </div>

      {/* Database Schema Section */}
      <div className="bg-white shadow rounded-lg p-6 mt-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Database Management</h2>
        <p className="text-sm text-gray-600 mb-4">
          These actions should be performed with caution. Make sure to backup your data before running any database operations.
        </p>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button 
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none"
            onClick={() => alert('This feature requires manual SQL execution. Please contact the system administrator.')}
          >
            Create Database Tables
          </button>
          <button 
            className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 focus:outline-none"
            onClick={() => alert('This feature requires manual SQL execution. Please contact the system administrator.')}
          >
            Reset Row Permissions
          </button>
          <button 
            className="px-4 py-2 bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 focus:outline-none"
            onClick={() => alert('This feature requires manual SQL execution. Please contact the system administrator.')}
          >
            Generate Test Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings; 