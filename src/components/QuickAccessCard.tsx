import * as React from 'react';
import { Link } from 'react-router-dom';
import { IconType } from 'react-icons';

interface QuickAccessCardProps {
  to: string;
  icon: IconType;
  title: string;
  value: string;
  color: string;
}

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({ to, icon: Icon, title, value, color }) => (
  <Link to={to} className={`p-6 rounded-lg shadow-md ${color} transition-transform hover:scale-105`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-lg font-semibold text-white mb-1">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
      <Icon className="w-12 h-12 text-white opacity-80" />
    </div>
  </Link>
);

export default QuickAccessCard;
