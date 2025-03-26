import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    nationalId: '',
    studentId: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    gender: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate full name has at least two words
    const nameWords = formData.fullName.trim().split(/\s+/);
    if (nameWords.length < 2) {
      setError('Please enter at least two names (first name and last name)');
      setLoading(false);
      return;
    }

    // Validate email domain
    if (!formData.email.endsWith('@chuka.ac.ke')) {
      setError('Please use your Chuka University email (@chuka.ac.ke)');
      setLoading(false);
      return;
    }

    if (formData.nationalId.length !== 8) {
      setError('National ID must be exactly 8 characters');
      setLoading(false);
      return;
    }

    if (!isPasswordValid()) {
      setError('Please ensure your password meets all requirements');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      // Step 1: Sign up with auth and include profile data in metadata
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            national_id: formData.nationalId,
            student_id: formData.studentId,
            role: formData.role,
            gender: formData.gender
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        throw error;
      }

      if (!data?.user?.id) {
        throw new Error('No user data returned');
      }

      // Step 2: Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: formData.fullName,
          national_id: formData.nationalId,
          student_id: formData.studentId,
          email: formData.email,
          role: formData.role
          // gender will be added after database schema update
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      alert('Account created successfully! Please sign in.');
      navigate('/login');
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center bg-fixed bg-no-repeat before:content-[''] before:fixed before:inset-0 before:bg-black before:bg-opacity-50">
      <div className="min-h-screen flex flex-col py-12 sm:px-6 lg:px-8 relative z-10 overflow-y-auto">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-200">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white bg-opacity-90 backdrop-blur-sm py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
            {error && (
              <div className="mb-4 p-2 text-sm text-red-700 bg-red-100 rounded-md">
                {error}
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
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
                  <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700">
                    National ID
                  </label>
                  <input
                    id="nationalId"
                    name="nationalId"
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
                  <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                    Registration Number
                  </label>
                  <input
                    id="studentId"
                    name="studentId"
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
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    pattern="[a-zA-Z0-9._%+-]+@chuka\.ac\.ke$"
                    title="Use your Chuka University email (@chuka.ac.ke)"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <p className="mt-1 text-sm text-gray-500">Use your Chuka University email (@chuka.ac.ke)</p>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <FaEyeSlash size={20} />
                      ) : (
                        <FaEye size={20} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <FaEyeSlash size={20} />
                      ) : (
                        <FaEye size={20} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-2 text-sm">
                  <p className="font-medium text-gray-700">Password must contain:</p>
                  <ul className="list-none mt-1 space-y-1">
                    <li className={passwordValidation.minLength ? "text-green-600" : "text-red-600"}>
                      ✓ At least 8 characters
                    </li>
                    <li className={passwordValidation.hasNumber ? "text-green-600" : "text-red-600"}>
                      ✓ At least one number
                    </li>
                    <li className={passwordValidation.hasUppercase ? "text-green-600" : "text-red-600"}>
                      ✓ At least one uppercase letter
                    </li>
                    <li className={passwordValidation.hasLowercase ? "text-green-600" : "text-red-600"}>
                      ✓ At least one lowercase letter
                    </li>
                    <li className={passwordValidation.hasSpecialChar ? "text-green-600" : "text-red-600"}>
                      ✓ At least one special character (!@#$%^&*,.?)
                    </li>
                  </ul>
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <input
                    type="text"
                    id="role"
                    name="role"
                    value="student"
                    readOnly
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 cursor-not-allowed"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Creating account...' : 'Sign up'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 