import {
  TrendingUp,
  Bitcoin,
  Trophy,
  LineChart,
  Film,
  CloudRain,
  Cpu,
  Landmark,
  Rocket,
  Fuel,
  Gamepad2,
  HeartPulse,
  Car,
  Brain,
  DollarSign,
  Globe,
  BarChart3,
  LucideIcon,
} from 'lucide-react';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Economics: TrendingUp,
  Crypto: Bitcoin,
  Sports: Trophy,
  Stocks: LineChart,
  Entertainment: Film,
  Climate: CloudRain,
  Tech: Cpu,
  Politics: Landmark,
  Space: Rocket,
  Commodities: Fuel,
  Gaming: Gamepad2,
  Health: HeartPulse,
  Auto: Car,
  AI: Brain,
  Finance: DollarSign,
  Geopolitics: Globe,
};

export interface CategoryColors {
  light: {
    border: string;
    icon: string;
  };
  dark: {
    border: string;
    icon: string;
  };
}

export const CATEGORY_COLORS: Record<string, CategoryColors> = {
  Economics: {
    light: { border: 'border-emerald-500', icon: 'text-emerald-500' },
    dark: { border: 'border-emerald-400', icon: 'text-emerald-400' },
  },
  Crypto: {
    light: { border: 'border-orange-500', icon: 'text-orange-500' },
    dark: { border: 'border-orange-400', icon: 'text-orange-400' },
  },
  Sports: {
    light: { border: 'border-red-500', icon: 'text-red-500' },
    dark: { border: 'border-red-400', icon: 'text-red-400' },
  },
  Stocks: {
    light: { border: 'border-green-600', icon: 'text-green-600' },
    dark: { border: 'border-green-400', icon: 'text-green-400' },
  },
  Entertainment: {
    light: { border: 'border-pink-500', icon: 'text-pink-500' },
    dark: { border: 'border-pink-400', icon: 'text-pink-400' },
  },
  Climate: {
    light: { border: 'border-sky-500', icon: 'text-sky-500' },
    dark: { border: 'border-sky-400', icon: 'text-sky-400' },
  },
  Tech: {
    light: { border: 'border-blue-500', icon: 'text-blue-500' },
    dark: { border: 'border-blue-400', icon: 'text-blue-400' },
  },
  Politics: {
    light: { border: 'border-rose-600', icon: 'text-rose-600' },
    dark: { border: 'border-rose-400', icon: 'text-rose-400' },
  },
  Space: {
    light: { border: 'border-indigo-600', icon: 'text-indigo-600' },
    dark: { border: 'border-indigo-400', icon: 'text-indigo-400' },
  },
  Commodities: {
    light: { border: 'border-amber-600', icon: 'text-amber-600' },
    dark: { border: 'border-amber-400', icon: 'text-amber-400' },
  },
  Gaming: {
    light: { border: 'border-purple-500', icon: 'text-purple-500' },
    dark: { border: 'border-purple-400', icon: 'text-purple-400' },
  },
  Health: {
    light: { border: 'border-red-600', icon: 'text-red-600' },
    dark: { border: 'border-red-400', icon: 'text-red-400' },
  },
  Auto: {
    light: { border: 'border-slate-600', icon: 'text-slate-600' },
    dark: { border: 'border-slate-400', icon: 'text-slate-400' },
  },
  AI: {
    light: { border: 'border-violet-600', icon: 'text-violet-600' },
    dark: { border: 'border-violet-400', icon: 'text-violet-400' },
  },
  Finance: {
    light: { border: 'border-emerald-600', icon: 'text-emerald-600' },
    dark: { border: 'border-emerald-400', icon: 'text-emerald-400' },
  },
  Geopolitics: {
    light: { border: 'border-cyan-600', icon: 'text-cyan-600' },
    dark: { border: 'border-cyan-400', icon: 'text-cyan-400' },
  },
};

const DEFAULT_COLORS: CategoryColors = {
  light: { border: 'border-gray-500', icon: 'text-gray-500' },
  dark: { border: 'border-gray-400', icon: 'text-gray-400' },
};

export function getCategoryIcon(category: string | null): LucideIcon {
  if (!category) return BarChart3;
  return CATEGORY_ICONS[category] || BarChart3;
}

export function getCategoryColors(category: string | null): CategoryColors {
  if (!category) return DEFAULT_COLORS;
  return CATEGORY_COLORS[category] || DEFAULT_COLORS;
}
