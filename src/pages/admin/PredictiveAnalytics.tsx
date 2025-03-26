import React, { useEffect, useState } from 'react';
import { predictiveAnalytics, PredictionMetrics } from '../../services/predictiveAnalytics';
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
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PredictiveAnalytics: React.FC = () => {
  const [predictions, setPredictions] = useState<PredictionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      const data = await predictiveAnalytics.analyzeOccupancyTrends();
      setPredictions(data);
    } catch (err) {
      console.error('Error loading predictions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-4">
          <h2 className="text-lg font-semibold">Error Loading Predictions</h2>
          <p>{error}</p>
        </div>
        <button 
          onClick={loadPredictions}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Predictive Analytics Dashboard</h1>
        <p className="mt-2 text-gray-600">
          AI-powered insights for optimizing hostel occupancy and resource allocation
        </p>
      </div>

      {predictions && (
        <>
          {/* Overcrowding Risk Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Overcrowding Risk Analysis</h2>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${getRiskColor(predictions.overcrowdingRisk.level)}`}>
                {predictions.overcrowdingRisk.level.toUpperCase()} RISK
              </div>
              <div className="mt-4">
                <h3 className="font-medium mb-2">Affected Areas:</h3>
                <ul className="list-disc pl-4 space-y-1">
                  {predictions.overcrowdingRisk.affectedAreas.map((area, index) => (
                    <li key={index} className="text-gray-600">{area}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-4">
                <h3 className="font-medium mb-2">Recommendations:</h3>
                <ul className="list-disc pl-4 space-y-1">
                  {predictions.overcrowdingRisk.recommendations.map((rec, index) => (
                    <li key={index} className="text-gray-600">{rec}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Seasonal Analysis</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">High Demand Months</h3>
                  <ul className="list-disc pl-4 space-y-1">
                    {predictions.seasonalPatterns.highDemandMonths.map((month, index) => (
                      <li key={index} className="text-gray-600">{month}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Low Demand Months</h3>
                  <ul className="list-disc pl-4 space-y-1">
                    {predictions.seasonalPatterns.lowDemandMonths.map((month, index) => (
                      <li key={index} className="text-gray-600">{month}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="font-medium">Year over Year Growth</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {predictions.seasonalPatterns.yearOverYearGrowth.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Utilization Forecast Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Utilization Forecast</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-4">Expected Occupancy Rate</h3>
                <div className="flex items-end space-x-2">
                  <span className="text-3xl font-bold text-blue-600">
                    {predictions.utilizationForecast.expectedOccupancy.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-4">Underutilized Areas</h3>
                <div className="space-y-3">
                  {predictions.utilizationForecast.underutilizedAreas.map((area, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <p className="font-medium">{area.area}</p>
                      <p className="text-sm text-gray-600">
                        Utilization: {area.utilizationRate.toFixed(1)}%
                      </p>
                      <div className="mt-2">
                        <p className="text-sm font-medium">Suggested Actions:</p>
                        <ul className="list-disc pl-4 text-sm text-gray-600">
                          {area.suggestedActions.map((action, actionIndex) => (
                            <li key={actionIndex}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Peak Periods Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Peak Periods Analysis</h2>
            <div className="h-80">
              <Line
                data={{
                  labels: predictions.utilizationForecast.peakPeriods.map(
                    period => new Date(period.startDate).toLocaleDateString()
                  ),
                  datasets: [
                    {
                      label: 'Occupancy Rate',
                      data: predictions.utilizationForecast.peakPeriods.map(
                        period => period.occupancyRate
                      ),
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      tension: 0.3
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                    title: {
                      display: true,
                      text: 'Occupancy Rate During Peak Periods'
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'Occupancy Rate (%)'
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PredictiveAnalytics;
