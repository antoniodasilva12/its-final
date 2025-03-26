import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { FiRefreshCw, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

interface MealPlan {
  id: string;
  name: string;
  price: number;
  description: string;
  is_active: boolean;
}

interface MealSubscription {
  id: string;
  student_id: string;
  plan_id: string;
  start_date: string;
  status: 'active' | 'expired' | 'cancelled';
  profiles: {
    full_name: string;
    registration_number: string;
  };
  meal_plan: MealPlan;
}

const AdminMealPlans = () => {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<MealSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MealPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    fetchMealPlans();
    fetchSubscriptions();
  }, []);

  const fetchMealPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setMealPlans(data || []);
    } catch (err: any) {
      console.error('Error fetching meal plans:', err);
      setError(err.message);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('meal_subscriptions')
        .select(`
          *,
          profiles (
            full_name,
            registration_number
          ),
          meal_plan:plan_id (*)
        `)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (err: any) {
      console.error('Error fetching subscriptions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const planData = {
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description,
        is_active: formData.is_active
      };

      let error;
      if (editingPlan) {
        const { error: updateError } = await supabase
          .from('meal_plans')
          .update(planData)
          .eq('id', editingPlan.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('meal_plans')
          .insert([planData]);
        error = insertError;
      }

      if (error) throw error;

      setIsModalOpen(false);
      setEditingPlan(null);
      setFormData({ name: '', price: '', description: '', is_active: true });
      fetchMealPlans();
    } catch (err: any) {
      console.error('Error saving meal plan:', err);
      setError(err.message);
    }
  };

  const handleEdit = (plan: MealPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price.toString(),
      description: plan.description,
      is_active: plan.is_active
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this meal plan?')) return;

    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchMealPlans();
    } catch (err: any) {
      console.error('Error deleting meal plan:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Meal Plans Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Meal Plans</h2>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setEditingPlan(null);
                    setFormData({ name: '', price: '', description: '', is_active: true });
                    setIsModalOpen(true);
                  }}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <FiPlus className="mr-2" />
                  Add Plan
                </button>
                <button
                  onClick={fetchMealPlans}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  <FiRefreshCw className="mr-2" />
                  Refresh
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mealPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="border rounded-lg p-6 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                      <p className="text-2xl font-bold text-blue-600">KSh {plan.price.toLocaleString()}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(plan)}
                        className="p-2 text-gray-600 hover:text-blue-600"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="p-2 text-gray-600 hover:text-red-600"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                  <div className="flex items-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${plan.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subscriptions Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Active Subscriptions</h2>
              <button
                onClick={fetchSubscriptions}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                <FiRefreshCw className="mr-2" />
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.map((subscription) => (
                    <tr key={subscription.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {subscription.profiles?.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {subscription.profiles?.registration_number}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {subscription.meal_plan?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          KSh {subscription.meal_plan?.price.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(subscription.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                          subscription.status === 'expired' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {subscription.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingPlan ? 'Edit Meal Plan' : 'Add New Meal Plan'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price (KSh)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  rows={3}
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Active</label>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingPlan ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMealPlans; 