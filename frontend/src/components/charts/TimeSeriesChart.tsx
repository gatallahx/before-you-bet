'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { MarketSummary, PriceHistory } from '@/lib/types';
import { getChartColor } from '@/lib/colors';
import { useTheme } from '@/lib/theme';

interface TimeSeriesChartProps {
  data: { market: MarketSummary; history: PriceHistory }[];
  hoveredTicker?: string | null;
}

interface ChartDataPoint {
  timestamp: number;
  date: string;
  [key: string]: number | string;
}

export function TimeSeriesChart({ data, hoveredTicker }: TimeSeriesChartProps) {
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme colors
  const gridColor = isDark ? '#374151' : '#E5E7EB';
  const textColor = isDark ? '#9CA3AF' : '#6B7280';

  // Transform market data into chart format
  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    // Get all unique timestamps from all markets
    const timestampSet = new Set<number>();
    data.forEach(({ history }) => {
      history.candles.forEach((candle) => timestampSet.add(new Date(candle.date).getTime()));
    });

    const timestamps = Array.from(timestampSet).sort((a, b) => a - b);

    // Build data points for each timestamp
    return timestamps.map((timestamp) => {
      const point: ChartDataPoint = {
        timestamp,
        date: new Date(timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      };

      data.forEach(({ market, history }) => {
        const candle = history.candles.find(
          (c) => new Date(c.date).getTime() === timestamp
        );
        if (candle) {
          point[market.ticker] = candle.close;
        }
      });

      return point;
    });
  }, [data]);

  const toggleLine = (ticker: string) => {
    setHiddenLines((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) {
        next.delete(ticker);
      } else {
        next.add(ticker);
      }
      return next;
    });
  };

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">No market data available</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: textColor }}
              tickLine={{ stroke: gridColor }}
              axisLine={{ stroke: gridColor }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: textColor }}
              tickLine={{ stroke: gridColor }}
              axisLine={{ stroke: gridColor }}
              tickFormatter={(value) => `${value}¢`}
            />
            <Tooltip content={<CustomTooltip data={data} isDark={isDark} />} />
            <Legend content={<CustomLegend data={data} hiddenLines={hiddenLines} onToggle={toggleLine} isDark={isDark} />} />
            {data.map(({ market }, index) => {
              const isHovered = hoveredTicker === market.ticker;
              const isDimmed = hoveredTicker !== null && !isHovered;

              return (
                <Line
                  key={market.ticker}
                  type="monotone"
                  dataKey={market.ticker}
                  stroke={isDimmed ? (isDark ? '#4B5563' : '#D1D5DB') : getChartColor(index)}
                  strokeWidth={isHovered ? 3 : 2}
                  strokeOpacity={isDimmed ? 0.3 : 1}
                  dot={false}
                  activeDot={{ r: isHovered ? 6 : 4 }}
                  hide={hiddenLines.has(market.ticker)}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
  }>;
  label?: string;
  data: { market: MarketSummary; history: PriceHistory }[];
  isDark: boolean;
}

function CustomTooltip({ active, payload, label, data, isDark }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  // Create a map for quick market lookup
  const marketMap = new Map(data.map(({ market }) => [market.ticker, market]));

  return (
    <div className={`rounded-lg shadow-lg p-3 max-w-xs border ${
      isDark
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-200'
    }`}>
      <p className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => {
          const market = marketMap.get(entry.dataKey);
          return (
            <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className={`truncate flex-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {market?.title || entry.dataKey}
              </span>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{entry.value}¢</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface CustomLegendProps {
  data: { market: MarketSummary; history: PriceHistory }[];
  hiddenLines: Set<string>;
  onToggle: (ticker: string) => void;
  isDark: boolean;
}

function CustomLegend({ data, hiddenLines, onToggle, isDark }: CustomLegendProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center mt-4 px-4">
      {data.map(({ market }, index) => {
        const isHidden = hiddenLines.has(market.ticker);
        return (
          <button
            key={market.ticker}
            onClick={() => onToggle(market.ticker)}
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-all ${
              isHidden
                ? 'opacity-40 hover:opacity-60'
                : `opacity-100 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`
            }`}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: getChartColor(index) }}
            />
            <span className={`truncate max-w-[120px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {market.ticker}
            </span>
          </button>
        );
      })}
    </div>
  );
}
