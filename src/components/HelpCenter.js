import React from 'react';

const HelpCenter = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Help Center</h1>
          <p className="text-gray-600">This is a placeholder. Documentation and guides will appear here.</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Getting Started</h2>
          <ol className="list-decimal ml-5 text-gray-700 space-y-1">
            <li>Invite your partner from Profile → My Partner</li>
            <li>Start a Weekly Meeting from the dashboard</li>
            <li>Track Rocks, To-Dos, and Issues</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;







