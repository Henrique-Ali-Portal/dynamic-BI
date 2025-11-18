import React from 'react';
import Dashboard from '../pages/Dashboard';

function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header placeholder */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard BI</h1>
        </div>
      </header>

      {/* Main content area */}
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Replace with actual dashboard content */}
          <Dashboard />
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
