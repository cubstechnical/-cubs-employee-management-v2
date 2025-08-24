import React from 'react';

export const DemoInfo: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-3">
        🔐 Demo Account for App Reviewers
      </h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Email:</strong> 
          <code className="ml-2 bg-white px-2 py-1 rounded">info@cubstechnical.com</code>
        </div>
        <div>
          <strong>Password:</strong> 
          <code className="ml-2 bg-white px-2 py-1 rounded">Admin@123456</code>
        </div>
      </div>
      
      <div className="mt-3 text-sm text-blue-800">
        <strong>Test these features:</strong>
        <ul className="mt-1 ml-4 space-y-1">
          <li>• Employee Management</li>
          <li>• Document Upload & Management</li>
          <li>• Visa Expiry Monitoring</li>
          <li>• Real-time Notifications</li>
          <li>• Admin Dashboard</li>
        </ul>
      </div>
    </div>
  );
};
