import React from 'react';

const OverviewTabContent: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Financial Overview</h2>
      </div>

      {/* Empty State */}
      <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-300 text-center mb-8">
        <p className="text-gray-600 text-lg">No financial data available yet.</p>
        <p className="text-gray-500 mt-2">
          Add your first transaction to see your spending overview and insights.
        </p>
      </div>
    </div>
  );
};

export default OverviewTabContent;