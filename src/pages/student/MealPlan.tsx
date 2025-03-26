import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { FiCheck, FiAlertCircle } from 'react-icons/fi';

interface MealPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  meals_included: string[];
  duration: string;
}

const MealPlan: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const mealPlans: MealPlan[] = [
    {
      id: 1,
      name: "Basic Plan",
      description: "Perfect for students who want essential meals",
      price: 3000,
      meals_included: ["Breakfast", "Dinner"],
      duration: "Monthly"
    },
    {
      id: 2,
      name: "Standard Plan",
      description: "Most popular choice with all daily meals",
      price: 4500,
      meals_included: ["Breakfast", "Lunch", "Dinner"],
      duration: "Monthly"
    },
    {
      id: 3,
      name: "Premium Plan",
      description: "Complete package with snacks and special meals",
      price: 6000,
      meals_included: ["Breakfast", "Lunch", "Evening Snacks", "Dinner"],
      duration: "Monthly"
    }
  ];

  useEffect(() => {
    fetchUserPlan();
  }, []);

  const fetchUserPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to view meal plans');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('meal_subscriptions')
        .select('*')
        .eq('student_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching meal plan:', fetchError);
        setError('Failed to fetch your current meal plan');
        return;
      }

      if (data) {
        setUserPlan(data);
        setSelectedPlan(data.plan_id);
      }
    } catch (error: any) {
      console.error('Error fetching meal plan:', error);
      setError('An unexpected error occurred while fetching your meal plan');
    }
  };

  const handlePlanSelection = async (planId: number) => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to select a meal plan');
        return;
      }

      const plan = mealPlans.find(p => p.id === planId);
      if (!plan) {
        setError('Invalid plan selected');
        return;
      }

      // Generate a unique reference number
      const referenceNumber = `MEAL-${user.id.slice(0, 4)}-${new Date().getTime().toString().slice(-4)}-${Math.random().toString(36).substr(2, 4)}`.toUpperCase();

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          student_id: user.id,
          amount: plan.price,
          status: 'pending',
          payment_date: new Date().toISOString(),
          payment_method: 'mpesa',
          reference_number: referenceNumber,
          month: new Date().toISOString().slice(0, 7) // Current month in YYYY-MM format
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Payment error:', paymentError);
        setError('Failed to create payment record. Please try again.');
        return;
      }

      // Update or insert meal subscription
      const { error: subscriptionError } = await supabase
        .from('meal_subscriptions')
        .upsert({
          student_id: user.id,
          plan_id: planId,
          start_date: new Date().toISOString(),
          status: 'active'
        });

      if (subscriptionError) {
        console.error('Subscription error:', subscriptionError);
        setError('Failed to update meal subscription. Please try again.');
        return;
      }

      setSelectedPlan(planId);
      setSuccessMessage(`Successfully selected the ${plan.name}! Please proceed to payments to complete your subscription.`);
      await fetchUserPlan();
    } catch (error: any) {
      console.error('Error selecting meal plan:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Meal Plans</h2>
          
          {error && (
            <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md flex items-center">
              <FiAlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 text-green-700 bg-green-100 rounded-md flex items-center">
              <FiCheck className="h-5 w-5 mr-2" />
              {successMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mealPlans.map((plan) => (
              <div
                key={plan.id}
                className={`border rounded-lg p-6 ${
                  selectedPlan === plan.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                  </div>
                  {selectedPlan === plan.id && (
                    <FiCheck className="h-6 w-6 text-blue-500" />
                  )}
                </div>

                <div className="mt-4">
                  <p className="text-2xl font-bold text-gray-900">
                    KSh {plan.price.toLocaleString()}
                    <span className="text-sm font-normal text-gray-500">/{plan.duration}</span>
                  </p>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Included Meals:</h4>
                  <ul className="mt-2 space-y-2">
                    {plan.meals_included.map((meal, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <FiCheck className="h-4 w-4 text-green-500 mr-2" />
                        {meal}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handlePlanSelection(plan.id)}
                  disabled={loading || selectedPlan === plan.id}
                  className={`mt-6 w-full px-4 py-2 rounded-md text-sm font-medium ${
                    selectedPlan === plan.id
                      ? 'bg-green-100 text-green-800 cursor-default'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } disabled:opacity-50`}
                >
                  {loading ? 'Processing...' : selectedPlan === plan.id ? 'Current Plan' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>

          {userPlan && (
            <div className="mt-8 p-4 bg-gray-50 rounded-md">
              <h3 className="text-lg font-medium text-gray-900">Your Current Plan</h3>
              <div className="mt-2 text-sm text-gray-600">
                <p>Start Date: {new Date(userPlan.start_date).toLocaleDateString()}</p>
                <p>Status: <span className="capitalize">{userPlan.status}</span></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealPlan;