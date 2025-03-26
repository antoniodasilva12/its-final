import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { analyzeResourceUsage } from '../../services/resourceAnalytics';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { FiTrendingUp, FiTrendingDown, FiMinus, FiDroplet } from 'react-icons/fi';
import { RiLightbulbLine } from 'react-icons/ri';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ResourceUsage {
  id: string;
  electricity_kwh: number;
  water_liters: number;
  date: string;
  student_id: string;
  room_number: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

interface Analytics {
  electricityTrend: 'increasing' | 'decreasing' | 'stable';
  waterTrend: 'increasing' | 'decreasing' | 'stable';
  averageElectricityUsage: number;
  averageWaterUsage: number;
  peakElectricityTime: string;
  peakWaterTime: string;
  recommendations: string[];
}

const Resources = () => {
  const [resourceUsage, setResourceUsage] = useState<ResourceUsage[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResourceUsage();
  }, []);

  const addSampleData = async () => {
    try {
      const { data: existingData } = await supabase
        .from('resource_usage')
        .select('*');

      if (!existingData || existingData.length === 0) {
        const sampleData = generateSampleData();
        const { error } = await supabase
          .from('resource_usage')
          .insert(sampleData);

        if (error) throw error;
        fetchResourceUsage();
      }
    } catch (err) {
      console.error('Error adding sample data:', err);
    }
  };

  const generateSampleData = () => {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14); // Start from 14 days ago

    for (let i = 0; i < 14; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Generate realistic random usage data
      const electricity_kwh = Math.round((15 + Math.random() * 10) * 10) / 10; // Between 15-25 kWh
      const water_liters = Math.round((100 + Math.random() * 50) * 10) / 10; // Between 100-150 liters

      data.push({
        date: date.toISOString().split('T')[0],
        electricity_kwh,
        water_liters,
        room_number: '101', // Sample room number
        student_id: '1', // Sample student ID
      });
    }

    return data;
  };

  useEffect(() => {
    addSampleData();
  }, []);

  const fetchResourceUsage = async () => {
    try {
      // Verify admin session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session found');
      }

      // Verify admin role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile || profile.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      // Fetch resource usage data
      const { data: usageData, error: usageError } = await supabase
        .from('resource_usage')
        .select('*, profiles(full_name)')
        .order('date', { ascending: false });

      if (usageError) {
        throw usageError;
      }

      setResourceUsage(usageData || []);

      // Get AI analytics
      if (usageData && usageData.length > 0) {
        const analyticsData = await analyzeResourceUsage(usageData);
        setAnalytics(analyticsData);
      }
    } catch (err) {
      console.error('Error fetching resource usage:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch resource usage');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return <FiTrendingUp className="text-red-500" />;
      case 'decreasing':
        return <FiTrendingDown className="text-green-500" />;
      default:
        return <FiMinus className="text-gray-500" />;
    }
  };

  const getChartData = () => {
    const dates = resourceUsage.map(usage => new Date(usage.date).toLocaleDateString());
    const electricityData = resourceUsage.map(usage => usage.electricity_kwh);
    const waterData = resourceUsage.map(usage => usage.water_liters);

    return {
      labels: dates,
      datasets: [
        {
          label: 'Electricity (kWh)',
          data: electricityData,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          yAxisID: 'y'
        },
        {
          label: 'Water (L)',
          data: waterData,
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          yAxisID: 'y1'
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    stacked: false,
    plugins: {
      title: {
        display: true,
        text: 'Resource Usage Over Time'
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Electricity (kWh)'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Water (L)'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">Resource Usage Management</h1>

      {/* Student Resource Usage Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <h2 className="text-xl font-semibold p-6 border-b">Student Resource Usage Records</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Electricity (kWh)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Water (L)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resourceUsage.map((usage) => (
                <tr key={usage.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(usage.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {usage.profiles?.full_name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usage.room_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usage.electricity_kwh}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usage.water_liters}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-6">Resource Analytics & Insights</h2>
        
        {/* Usage Graph */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <Line options={chartOptions} data={getChartData()} />
        </div>

        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <RiLightbulbLine className="text-2xl text-yellow-500 mr-2" />
                  <h3 className="text-gray-500 text-sm font-medium">Electricity Usage</h3>
                </div>
                {getTrendIcon(analytics.electricityTrend)}
              </div>
              <p className="mt-2 text-3xl font-bold">{analytics.averageElectricityUsage.toFixed(1)} kWh</p>
              <p className="text-sm text-gray-500">Daily Average</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FiDroplet className="text-2xl text-blue-500 mr-2" />
                  <h3 className="text-gray-500 text-sm font-medium">Water Usage</h3>
                </div>
                {getTrendIcon(analytics.waterTrend)}
              </div>
              <p className="mt-2 text-3xl font-bold">{analytics.averageWaterUsage.toFixed(1)} L</p>
              <p className="text-sm text-gray-500">Daily Average</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Peak Usage Times</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Electricity:</p>
                  <p className="text-sm text-gray-500">{new Date(analytics.peakElectricityTime).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Water:</p>
                  <p className="text-sm text-gray-500">{new Date(analytics.peakWaterTime).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">AI Recommendations</h3>
              <ul className="space-y-2">
                {analytics.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Resources;
