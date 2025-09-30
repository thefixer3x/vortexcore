import React, { useState, useEffect } from 'react';
import { logSlowQueries, batchUserQueries, getChatWithRelatedData, getTransactionWithRelatedData, getUserRecentTransactions, getUserWallet, invalidateCache } from '@/lib/analytics';

interface PerformanceMetrics {
  avgQueryTime: number;
  cacheHitRate: number;
  activeSubscriptions: number;
  totalRequests: number;
}

const OverviewTabContent: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  // Simulate getting user ID (in real app, this would come from auth context)
  useEffect(() => {
    // In a real app, this would be from the authenticated user context
    setUserId('user-123');
  }, []);

  // Function to simulate performance monitoring
  const updateMetrics = async () => {
    setLoading(true);
    
    try {
      // Simulate some performance metrics
      const mockMetrics: PerformanceMetrics = {
        avgQueryTime: 45, // ms
        cacheHitRate: 89, // %
        activeSubscriptions: 3,
        totalRequests: 1250
      };
      
      setMetrics(mockMetrics);
      
      // Test the analytics functions with performance monitoring
      if (userId) {
        const { data: userData } = await batchUserQueries(userId);
        console.log('User data fetched with caching:', userData);
        
        const { data: transactions } = await getUserRecentTransactions(userId, 5);
        setRecentTransactions(transactions || []);
      }
    } catch (error) {
      console.error('Error updating metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update metrics when component mounts
  useEffect(() => {
    updateMetrics();
  }, [userId]);

  // Function to manually refresh data and clear cache
  const handleRefresh = () => {
    if (userId) {
      // Invalidate cache for this user
      invalidateCache(userId);
      updateMetrics();
    }
 };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Performance Overview</h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Avg Query Time</h3>
          <p className="text-3xl font-bold text-blue-60">
            {metrics?.avgQueryTime ? `${metrics.avgQueryTime}ms` : '--'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Target: &lt;50ms</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Cache Hit Rate</h3>
          <p className="text-3xl font-bold text-green-600">
            {metrics?.cacheHitRate ? `${metrics.cacheHitRate}%` : '--'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Target: &gt;90%</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Active Subscriptions</h3>
          <p className="text-3xl font-bold text-purple-600">
            {metrics?.activeSubscriptions || '--'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Optimized subscriptions</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total Requests</h3>
          <p className="text-3xl font-bold text-orange-600">
            {metrics?.totalRequests || '--'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Since last refresh</p>
        </div>
      </div>

      {/* Performance Recommendations */}
      <div className="bg-white p-6 rounded-lg shadow border mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Recommendations</h3>
        <ul className="space-y-2">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Query batching implemented for user data retrieval</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Application-level caching added with TTL management</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Realtime subscriptions optimized with specific filters</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Slow query monitoring implemented</span>
          </li>
          <li className="flex items-start">
            <span className="text-yellow-500 mr-2">→</span>
            <span>Consider implementing Redis caching for production</span>
          </li>
        </ul>
      </div>

      {/* Recent Transactions (using cached data) */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions (Cached)</h3>
        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.id?.slice(0, 8)}...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${transaction.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No recent transactions</p>
        )}
      </div>
    </div>
  );
};

export default OverviewTabContent;