import React from 'react';

interface KPIcardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
}

export default function KPIcard({ title, value, icon, trend, trendValue }: KPIcardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      default:
        return '→';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className={`text-sm flex items-center mt-1 ${getTrendColor()}`}>
            <span className="mr-1">{getTrendIcon()}</span>
            {trendValue}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  );
}
