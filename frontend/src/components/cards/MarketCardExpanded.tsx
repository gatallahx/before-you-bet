'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { MarketSummary, MarketData, PriceHistory, LLMEstimate } from '@/lib/types';
import { formatNumber, formatDateTime } from '@/lib/utils';
import { useTheme } from '@/lib/theme';

interface MarketCardExpandedProps {
  market: MarketSummary | MarketData;
  history: PriceHistory;
  estimate?: LLMEstimate;
}

type TimeRange = '1D' | '1W' | '1M' | 'ALL';

// Type guard to check if market is MarketData (has rules)
function isMarketData(market: MarketSummary | MarketData): market is MarketData {
  return 'rules_primary' in market;
}

export function MarketCardExpanded({ market, history, estimate }: MarketCardExpandedProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const [activeTab, setActiveTab] = useState<'analysis' | 'risks' | 'rules'>('analysis');
  const [rulesExpanded, setRulesExpanded] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Get bid/ask - different field names for MarketSummary vs MarketData
  const yesBid = isMarketData(market) ? market.best_bid_yes : market.yes_bid;
  const yesAsk = isMarketData(market) ? market.best_ask_yes : market.yes_ask;

  // Calculate yes price from bid/ask
  const yesPrice = (yesBid + yesAsk) / 2;
  const noPrice = 100 - yesPrice;

  // Determine icon color based on which side is winning
  const isYesWinning = yesPrice > 50;
  const borderColor = isYesWinning ? 'border-emerald-500' : yesPrice < 50 ? 'border-rose-500' : 'border-gray-400';

  // Filter chart data based on time range
  const chartData = useMemo(() => {
    if (!history.candles?.length) return [];

    const now = Date.now();
    const ranges: Record<TimeRange, number> = {
      '1D': 24 * 60 * 60 * 1000,
      '1W': 7 * 24 * 60 * 60 * 1000,
      '1M': 30 * 24 * 60 * 60 * 1000,
      ALL: Infinity,
    };

    const cutoff = timeRange === 'ALL' ? 0 : now - ranges[timeRange];

    return history.candles
      .filter((candle) => new Date(candle.date).getTime() >= cutoff)
      .map((candle) => ({
        timestamp: new Date(candle.date).getTime(),
        price: candle.close,
        date: new Date(candle.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      }));
  }, [history.candles, timeRange]);

  // Create segmented data with columns for each directional segment
  const { segmentedData, segmentKeys } = useMemo(() => {
    if (chartData.length < 2) {
      return {
        segmentedData: chartData.map(d => ({ ...d, seg0: d.price })),
        segmentKeys: [{ key: 'seg0', isUp: true }],
      };
    }

    // Identify segment boundaries
    const segments: Array<{ start: number; end: number; isUp: boolean }> = [];
    let segStart = 0;
    let currentUp = chartData[1].price >= chartData[0].price;

    for (let i = 2; i < chartData.length; i++) {
      const isUp = chartData[i].price >= chartData[i - 1].price;
      if (isUp !== currentUp) {
        segments.push({ start: segStart, end: i - 1, isUp: currentUp });
        segStart = i - 1; // Overlap at transition point for continuity
        currentUp = isUp;
      }
    }
    segments.push({ start: segStart, end: chartData.length - 1, isUp: currentUp });

    // Build data with a column for each segment (null creates gaps)
    const data = chartData.map((point, i) => {
      const result: Record<string, number | string | null> = { ...point };
      segments.forEach((seg, segIdx) => {
        result[`seg${segIdx}`] = (i >= seg.start && i <= seg.end) ? point.price : null;
      });
      return result;
    });

    const keys = segments.map((seg, i) => ({ key: `seg${i}`, isUp: seg.isUp }));

    return { segmentedData: data, segmentKeys: keys };
  }, [chartData]);

  // Calculate volume display
  const volume = market.volume ? `$${formatNumber(market.volume)}` : '--';

  // Derive prediction from probability if estimate is available
  const prediction = estimate
    ? estimate.probability > 0.6
      ? 'YES likely'
      : estimate.probability < 0.4
      ? 'NO likely'
      : 'UNCERTAIN'
    : null;

  const predictionColor = prediction === 'YES likely'
    ? 'text-emerald-500'
    : prediction === 'NO likely'
    ? 'text-rose-500'
    : 'text-gray-500';

  // Check if we have rules (only MarketData has them)
  const hasRules = isMarketData(market);
  const tabs = hasRules ? ['analysis', 'risks', 'rules'] as const : ['analysis', 'risks'] as const;

  return (
    <div className="max-h-[85vh] overflow-y-auto">
      {/* Header Section */}
      <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start gap-4">
          {/* Price Circle */}
          <div className={`w-16 h-16 rounded-xl border-2 ${borderColor} flex items-center justify-center flex-shrink-0`}>
            <span className={`text-lg font-bold ${isYesWinning ? 'text-emerald-500' : yesPrice < 50 ? 'text-rose-500' : 'text-gray-400'}`}>
              {Math.round(yesPrice)}%
            </span>
          </div>

          {/* Title & Meta */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              {market.title}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {volume} vol
              </span>
              {/* Price change from history */}
              <span
                className={`text-sm font-medium ${
                  history.price_change_30d > 0
                    ? 'text-green-600 dark:text-green-400'
                    : history.price_change_30d < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {history.price_change_30d > 0 ? '+' : ''}
                {history.price_change_pct.toFixed(1)}% (30d)
              </span>
              {/* Probability-based prediction if available */}
              {prediction && (
                <span className={`text-sm font-medium ${predictionColor}`}>
                  {prediction}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chart + Trading Section */}
      <div className="p-6 grid grid-cols-3 gap-6">
        {/* Chart Area (2/3) */}
        <div className="col-span-2">
          {/* Time Range Selector */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              {(['1D', '1W', '1M', 'ALL'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    timeRange === range
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {chartData.length > 0 ? `${chartData.length} data points` : 'No data'}
            </span>
          </div>

          {/* Chart */}
          <div className="h-64 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={segmentedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: isDark ? '#9CA3AF' : '#6B7280' }}
                    dy={10}
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: isDark ? '#9CA3AF' : '#6B7280' }}
                    tickFormatter={(v) => `${v}%`}
                    width={40}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      const idx = chartData.findIndex(d => d.timestamp === data.timestamp);
                      const isUp = idx > 0 ? data.price >= chartData[idx - 1].price : true;
                      return (
                        <div className={`rounded-lg shadow-lg px-3 py-2 text-sm ${
                          isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'
                        }`}>
                          <div className="font-medium">{data.date}</div>
                          <div className={isUp ? 'text-emerald-500' : 'text-rose-500'}>{data.price}%</div>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine y={50} stroke={isDark ? '#374151' : '#E5E7EB'} strokeDasharray="3 3" />
                  {segmentKeys.map(({ key, isUp }) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={isUp ? '#10B981' : '#EF4444'}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: isUp ? '#10B981' : '#EF4444' }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                No historical data available
              </div>
            )}
          </div>
        </div>

        {/* Trading Panel (1/3) */}
        <div className="space-y-4">
          {/* Current Price */}
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 dark:text-white">
              {Math.round(yesPrice)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Current Yes Price
            </div>
          </div>

          {/* Price Bar */}
          <div className="h-3 rounded-full overflow-hidden relative">
            <div className="absolute inset-0 flex">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${yesPrice}%` }}
              />
              <div
                className="h-full bg-rose-500"
                style={{ width: `${noPrice}%` }}
              />
            </div>
            <div className="absolute inset-0 animate-stripes" />
          </div>

          {/* Market Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
            <InfoRow label="Bid" value={`${yesBid}¢`} />
            <InfoRow label="Ask" value={`${yesAsk}¢`} />
            <InfoRow
              label="Spread"
              value={`${yesAsk - yesBid}¢`}
            />
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <InfoRow label="Open Interest" value={formatNumber(market.open_interest)} />
            </div>
            {/* Probability if available */}
            {estimate && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <InfoRow label="AI Probability" value={`${Math.round(estimate.probability * 100)}%`} />
              </div>
            )}
          </div>

          {/* Timing */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Closes</span>
              <span>{formatDateTime(market.close_time)}</span>
            </div>
            <div className="flex justify-between">
              <span>Expires</span>
              <span>{formatDateTime(market.expiration_date)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Section */}
      <div className="px-6 pb-6">
        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[200px]">
          {activeTab === 'analysis' && (
            <div className="space-y-4">
              {/* AI Reasoning (if estimate available) */}
              {estimate?.reasoning && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">AI Reasoning</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">{estimate.reasoning}</p>
                </div>
              )}

              {/* Full Analysis */}
              {estimate?.analysis && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Analysis</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {estimate.analysis}
                  </p>
                </div>
              )}

              {/* Key Takeaways */}
              {estimate && estimate.key_takeaways.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Key Takeaways
                  </h4>
                  <ul className="space-y-2">
                    {estimate.key_takeaways.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* No estimate placeholder */}
              {!estimate && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  No AI analysis available for this market.
                </div>
              )}
            </div>
          )}

          {activeTab === 'risks' && (
            <div className="space-y-3">
              {estimate && estimate.risks.length > 0 ? (
                estimate.risks.map((risk, i) => (
                  <div
                    key={i}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                  >
                    <p className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                      <span className="text-rose-500 mt-0.5">•</span>
                      <span>{risk}</span>
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No risks identified</p>
              )}
            </div>
          )}

          {activeTab === 'rules' && hasRules && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Primary Resolution Rule</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {(market as MarketData).rules_primary}
                </p>
              </div>
              {(market as MarketData).rules_secondary && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Secondary Resolution Rule</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {(market as MarketData).rules_secondary}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}
