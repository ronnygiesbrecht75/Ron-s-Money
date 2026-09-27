import React from 'react';
import * as LucideIcons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5', size }) => {
  // Try to find icon in Lucide
  const IconComponent = (LucideIcons as Record<string, any>)[name] || LucideIcons.CircleDollarSign;
  return <IconComponent className={className} size={size} />;
};

export const AVAILABLE_CATEGORY_ICONS = [
  'Home', 'Trees', 'Utensils', 'Bus', 'Receipt', 'Zap', 'ShieldCheck',
  'Percent', 'CreditCard', 'TrendingUp', 'Fuel', 'Hammer', 'Wrench',
  'MoreHorizontal', 'Briefcase', 'Wallet', 'Landmark', 'Cpu', 'CircleDollarSign',
  'ShoppingBag', 'Tv', 'HeartPulse', 'Plane', 'BookOpen', 'Coffee', 'Gift',
  'Smartphone', 'PiggyBank', 'DollarSign', 'Building2', 'Truck', 'Sparkles'
];
