import { useEffect, useState } from 'react';
import {
  OccupancyStats,
  RoomUtilizationStats,
  MaintenanceStats,
  getOccupancyStats,
  getRoomUtilizationStats,
  getMaintenanceStats
} from '../../services/reportingAnalytics';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Reports = () => {
  const [occupancyStats, setOccupancyStats] = useState<OccupancyStats | null>(null);
  const [utilizationStats, setUtilizationStats] = useState<RoomUtilizationStats | null>(null);
  const [maintenanceStats, setMaintenanceStats] = useState<MaintenanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const [occupancy, utilization, maintenance] = await Promise.all([
        getOccupancyStats(),
        getRoomUtilizationStats(),
        getMaintenanceStats()
      ]);
      setOccupancyStats(occupancy);
      setUtilizationStats(utilization);
      setMaintenanceStats(maintenance);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  const occupancyData = {
    labels: ['Occupied', 'Available', 'Reserved'],
    datasets: [
      {
        data: [
          occupancyStats?.occupiedRooms || 0,
          occupancyStats?.availableRooms || 0,
          occupancyStats?.reservedRooms || 0
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)'
        ]
      }
    ]
  };

  const roomTypeData = {
    labels: utilizationStats?.roomTypeDistribution.map(item => item.type) || [],
    datasets: [
      {
        label: 'Room Count',
        data: utilizationStats?.roomTypeDistribution.map(item => item.count) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.8)'
      }
    ]
  };

  const floorUtilizationData = {
    labels: utilizationStats?.floorUtilization.map(item => `Floor ${item.floor}`) || [],
    datasets: [
      {
        label: 'Occupancy Rate (%)',
        data: utilizationStats?.floorUtilization.map(item => item.occupancyRate) || [],
        backgroundColor: 'rgba(75, 192, 192, 0.8)'
      }
    ]
  };

  const maintenanceData = {
    labels: maintenanceStats?.commonIssues.map(item => item.issue) || [],
    datasets: [
      {
        label: 'Number of Requests',
        data: maintenanceStats?.commonIssues.map(item => item.count) || [],
        backgroundColor: 'rgba(255, 99, 132, 0.8)'
      }
    ]
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reports & Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Rooms</h2>
          <p className="text-3xl font-bold text-blue-600">{occupancyStats?.totalRooms || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Occupancy Rate</h2>
          <p className="text-3xl font-bold text-green-600">
            {occupancyStats?.occupancyRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Average Stay Duration</h2>
          <p className="text-3xl font-bold text-purple-600">
            {utilizationStats?.averageStayDuration.toFixed(1)} days
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Pending Maintenance</h2>
          <p className="text-3xl font-bold text-orange-600">
            {maintenanceStats?.pendingRequests || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Room Occupancy Distribution</h2>
          <div className="h-64">
            <Pie data={occupancyData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Room Type Distribution</h2>
          <div className="h-64">
            <Bar
              data={roomTypeData}
              options={{
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Floor Utilization</h2>
          <div className="h-64">
            <Bar
              data={floorUtilizationData}
              options={{
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Common Maintenance Issues</h2>
          <div className="h-64">
            <Bar
              data={maintenanceData}
              options={{
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Maintenance Overview</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Requests</span>
              <span className="font-semibold">{maintenanceStats?.totalRequests || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">In Progress</span>
              <span className="font-semibold">{maintenanceStats?.inProgressRequests || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed</span>
              <span className="font-semibold">{maintenanceStats?.completedRequests || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Resolution Time</span>
              <span className="font-semibold">{maintenanceStats?.averageResolutionTime.toFixed(1)} hours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
