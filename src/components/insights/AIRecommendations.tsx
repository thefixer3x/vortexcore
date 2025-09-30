import React, { useState, useEffect } from 'react';

interface PerformanceData {
  timestamp: Date;
  avgQueryTime: number;
  cacheHitRate: number;
  activeConnections: number;
  slowQueries: number;
  cpuUsage: number;
  memoryUsage: number;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
}

const AIRecommendations: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Simulate fetching performance data
  useEffect(() => {
    // In a real application, this would come from your monitoring service
    const mockPerformanceData: PerformanceData[] = [
      {
        timestamp: new Date(Date.now() - 3600000),
        avgQueryTime: 65,
        cacheHitRate: 78,
        activeConnections: 24,
        slowQueries: 8,
        cpuUsage: 65,
        memoryUsage: 72
      },
      {
        timestamp: new Date(Date.now() - 180000),
        avgQueryTime: 52,
        cacheHitRate: 82,
        activeConnections: 18,
        slowQueries: 5,
        cpuUsage: 58,
        memoryUsage: 68
      },
      {
        timestamp: new Date(),
        avgQueryTime: 45,
        cacheHitRate: 89,
        activeConnections: 15,
        slowQueries: 2,
        cpuUsage: 45,
        memoryUsage: 62
      }
    ];

    const mockRecommendations: Recommendation[] = [
      {
        id: '1',
        title: 'Enable Redis Caching',
        description: 'Implement Redis caching for frequently accessed data to reduce database load',
        priority: 'high',
        impact: 'high',
        status: 'pending'
      },
      {
        id: '2',
        title: 'Optimize Connection Pooling',
        description: 'Adjust connection pool settings to reduce overhead from connection establishment',
        priority: 'high',
        impact: 'medium',
        status: 'completed'
      },
      {
        id: '3',
        title: 'Update Database Extensions',
        description: 'Update outdated extensions to reduce migration query overhead',
        priority: 'medium',
        impact: 'medium',
        status: 'completed'
      },
      {
        id: '4',
        title: 'Add Missing Indexes',
        description: 'Add indexes to frequently queried columns to improve query performance',
        priority: 'medium',
        impact: 'high',
        status: 'pending'
      },
      {
        id: '5',
        title: 'Optimize Realtime Subscriptions',
        description: 'Refine realtime subscription filters to reduce unnecessary data transfer',
        priority: 'low',
        impact: 'medium',
        status: 'completed'
      }
    ];

    setPerformanceData(mockPerformanceData);
    setRecommendations(mockRecommendations);
    setLoading(false);
  }, []);

  // Calculate trend
  const calculateTrend = () => {
    if (performanceData.length < 2) return 0;
    
    const first = performanceData[0];
    const last = performanceData[performanceData.length - 1];
    
    // Calculate improvement in query time (lower is better)
    const queryTimeImprovement = ((first.avgQueryTime - last.avgQueryTime) / first.avgQueryTime) * 100;
    
    return queryTimeImprovement;
  };

  const trend = calculateTrend();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Performance Insights & Recommendations</h2>
        
        {/* Performance Trend Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Performance Trend</h3>
              <p className="text-gray-600 mt-1">Query performance has improved {trend.toFixed(1)}% in the last hour</p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">vs. 1 hour ago</div>
            </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Avg Query Time</h3>
            <p className="text-3xl font-bold text-blue-60">
              {performanceData[performanceData.length - 1]?.avgQueryTime}ms
            </p>
            <p className="text-sm text-gray-500 mt-1">Target: &lt;50ms</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Cache Hit Rate</h3>
            <p className="text-3xl font-bold text-green-600">
              { performanceData[ performanceData.length - 1]?.cacheHitRate}%
            </p>
            <p className="text-sm text-gray-500 mt-1">Target: &gt;90%</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Slow Queries</h3>
            <p className="text-3xl font-bold text-orange-600">
              { performanceData[ performanceData.length - 1]?.slowQueries}
            </p>
            <p className="text-sm text-gray-500 mt-1">Target: &lt;5/hour</p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div>
        
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div 
              key={rec.id} 
              className={`p-4 rounded-lg border ${
                rec.status === 'completed' 
                  ? 'bg-green-50 border-green-200' 
                  : rec.status === 'in-progress' 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    <h4 className="text-lg font-medium text-gray-900">{rec.title}</h4>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      rec.priority === 'high' 
                        ? 'bg-red-100 text-red-800' 
                        : rec.priority === 'medium' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{rec.description}</p>
                </div>
                
                <span className={`px-2 py-1 text-xs rounded-full ${
                  rec.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : rec.status === 'in-progress' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                }`}>
                  {rec.status.replace('-', ' ')}
                </span>
              </div>
              
              <div className="mt-3 flex items-center">
                <span className="text-sm text-gray-500 mr-4">
                  Impact: 
                  <span className={`ml-1 ${
                    rec.impact === 'high' 
                      ? 'text-red-600' 
                      : rec.impact === 'medium' 
                        ? 'text-yellow-600' 
                        : 'text-green-600'
                  }`}>
                    {rec.impact}
                  </span>
                </span>
                
                {rec.status === 'pending' && (
                  <button className="ml-auto px-3 py-1 bg-blue-60 text-white text-sm rounded-md hover:bg-blue-700">
                    Implement
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Implementation Guide */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Implementation Guide</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Implement the database extension updates using the script in APPLY_THIS_IN_SUPABASE_DASHBOARD.sql</li>
          <li>Update connection pooling settings in your Supabase dashboard as outlined in MANUAL_DASHBOARD_FIXES.md</li>
          <li>Monitor performance metrics after each change to measure improvement</li>
          <li>Consider implementing Redis caching for production environments</li>
          <li>Regularly review query performance in your Supabase dashboard</li>
        </ol>
      </div>
    </div>
  );
};

export default AIRecommendations;