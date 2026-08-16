import React from 'react';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed';
}

const AIRecommendations: React.FC = () => {
  // Empty state — no mock data. Recommendations populate when user has transactions.
  const recommendations: Recommendation[] = [];

  if (recommendations.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Financial Insights & Recommendations</h2>

          <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-300 text-center">
            <p className="text-gray-600 text-lg">No financial data available yet.</p>
            <p className="text-gray-500 mt-2">
              Start adding transactions to receive personalized financial recommendations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Financial Insights & Recommendations</h2>

        {/* Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Your Financial Health</h3>
              <p className="text-gray-600 mt-1">AI-powered recommendations based on your spending patterns</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Personalized Recommendations</h3>

        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`p-4 rounded-lg border ${
                rec.status === 'completed'
                  ? 'bg-green-50 border-green-200'
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
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {rec.status.replace('-', ' ')}
                </span>
              </div>

              <div className="mt-3">
                <span className="text-sm text-gray-500">
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIRecommendations;