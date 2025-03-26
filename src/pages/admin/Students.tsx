import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';
import { supabase } from '../../services/supabase';

interface Student {
  id: string;
  full_name: string;
  email: string;
  national_id: string;
  student_id: string;
  gender: string;
  role: string;
  created_at: string;
}

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    nationalId: '',
    studentId: '',
    email: '',
    password: '',
    gender: '',
  });

  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasNumber: false,
    hasUppercase: false,
    hasLowercase: false,
    hasSpecialChar: false
  });

  useEffect(() => {
    validatePassword(formData.password);
  }, [formData.password]);

  const validatePassword = (password: string) => {
    setPasswordValidation({
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  };

  const isPasswordValid = () => {
    return Object.values(passwordValidation).every(Boolean);
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Error fetching students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Also delete the auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      if (authError) throw authError;

      setStudents(students.filter(student => student.id !== id));
      alert('Student deleted successfully');
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Error deleting student. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate full name has at least two words
      const nameWords = formData.fullName.trim().split(/\s+/);
      if (nameWords.length < 2) {
        throw new Error('Please enter at least two names (first name and last name)');
      }

      // Validate email domain
      if (!formData.email.endsWith('@chuka.ac.ke')) {
        throw new Error('Please use a Chuka University email (@chuka.ac.ke)');
      }

      // Validate National ID
      if (formData.nationalId.length !== 8) {
        throw new Error('National ID must be exactly 8 characters');
      }

      // Validate password
      if (!isPasswordValid()) {
        throw new Error('Please ensure the password meets all requirements');
      }

      // First check if user already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', formData.email)
        .limit(1);

      if (checkError) throw checkError;
      if (existingUsers && existingUsers.length > 0) {
        throw new Error('A user with this email already exists');
      }

      // Use standard signUp instead of admin API
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            national_id: formData.nationalId,
            student_id: formData.studentId,
            gender: formData.gender,
            role: 'student'
          }
        }
      });

      if (error) throw error;
      if (!data?.user) throw new Error('No user data returned');

      // Create profile entry
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: formData.fullName,
          email: formData.email,
          national_id: formData.nationalId,
          student_id: formData.studentId,
          gender: formData.gender,
          role: 'student'
        });

      if (profileError) throw profileError;

      // Reset form and close modal
      setFormData({
        fullName: '',
        nationalId: '',
        studentId: '',
        email: '',
        password: '',
        gender: ''
      });
      setIsModalOpen(false);
      
      // Refresh the students list
      await fetchStudents();
      
      alert('Student added successfully! They will need to verify their email before they can log in.');
    } catch (error: any) {
      console.error('Error adding student:', error);
      alert(error.message || 'Error adding student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
        >
          <FiPlus className="w-5 h-5" />
          <span>Add New Student</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reg Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">National ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{student.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{student.student_id || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{student.national_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(student.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="text-red-600 hover:text-red-900 ml-4"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] flex flex-col">
            <h2 className="text-xl font-bold mb-4">Add New Student</h2>
            
            <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
              <p>
                <strong>Note:</strong> This will create a fully functional student account.
                The student will be able to log in with the email and password you provide.
              </p>
            </div>
            
            <div className="overflow-y-auto pr-2 flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    required
                    pattern="\S+\s+\S+.*"
                    title="Enter at least first name and last name"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                  <p className="mt-1 text-sm text-gray-500">Enter at least first name and last name</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">National ID</label>
                  <input
                    type="text"
                    required
                    pattern="\d{8}"
                    title="Must be exactly 8 digits"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  />
                  <p className="mt-1 text-sm text-gray-500">Must be exactly 8 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Registration Number</label>
                  <input
                    type="text"
                    required
                    pattern="\d{4}/[A-Z]{2,}/\d{5}"
                    title="Enter Registration Number (e.g., 2024/CS/12345)"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value.toUpperCase() })}
                  />
                  <p className="mt-1 text-sm text-gray-500">Format: YEAR/COURSE CODE/STUDENT NUMBER</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    pattern="[a-zA-Z0-9._%+-]+@chuka\.ac\.ke$"
                    placeholder="username@chuka.ac.ke"
                    title="Please use a Chuka University email (@chuka.ac.ke)"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <p className="mt-1 text-sm text-gray-500">Must be a Chuka University email (@chuka.ac.ke)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <div className="mt-2 text-sm">
                    <p className={`${passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                      ✓ At least 8 characters
                    </p>
                    <p className={`${passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                      ✓ At least one uppercase letter
                    </p>
                    <p className={`${passwordValidation.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
                      ✓ At least one lowercase letter
                    </p>
                    <p className={`${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                      ✓ At least one number
                    </p>
                    <p className={`${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                      ✓ At least one special character
                    </p>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  const form = document.querySelector('form');
                  if (form) form.requestSubmit();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={loading || !isPasswordValid()}
              >
                {loading ? 'Adding...' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students; 