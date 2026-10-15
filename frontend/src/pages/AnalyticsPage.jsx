import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  BarChart3, 
  RefreshCw, 
  Layers 
} from 'lucide-react';
import FoodSafetyDisclaimer from '../components/FoodSafetyDisclaimer';

const QUALITY_COLORS = {
  Fresh: '#10b981',   // Emerald
  Spoiled: '#ef4444', // Rose / Red
};

export default function AnalyticsPage({ analyticsData, onRefresh, isLoading }) {
  const [refreshing, setRefreshing] = useState(false);

  // Automatically refresh stats on mount to ensure fresh data
  useEffect(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  const handleRefreshClick = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 400);
  };

  const hasData = analyticsData && analyticsData.total_predictions > 0;

  // Prepare Pie Chart Data
  const pieData = hasData
    ? [
        { name: 'Fresh', value: analyticsData.class_counts?.Fresh || 0 },
        { name: 'Spoiled', value: analyticsData.class_counts?.Spoiled || 0 },
      ]
    : [];

  // Prepare Model Breakdown Data
  const modelData = hasData
    ? Object.entries(analyticsData.model_usage_breakdown || {}).map(([name, count]) => ({
        name,
        count,
      }))
    : [];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time visual quality metrics, class distributions, and classification trends.
          </p>
        </div>
        <button
          onClick={handleRefreshClick}
          disabled={isLoading || refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing || isLoading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Total Predictions</span>
          <p className="text-2xl sm:text-3xl font-black text-white mt-1.5 sm:mt-2">
            {analyticsData?.total_predictions ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Logged in SQLite database</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Fresh Ratio
          </span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1.5 sm:mt-2">
            {analyticsData?.class_percentages?.Fresh ?? 0}%
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {analyticsData?.class_counts?.Fresh ?? 0} items identified
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-rose-400 font-medium flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Spoiled Rate
          </span>
          <p className="text-2xl sm:text-3xl font-black text-rose-400 mt-1.5 sm:mt-2">
            {analyticsData?.class_percentages?.Spoiled ?? 0}%
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {analyticsData?.class_counts?.Spoiled ?? 0} items identified
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Average Latency
          </span>
          <p className="text-2xl sm:text-3xl font-black text-white mt-1.5 sm:mt-2 truncate">
            {analyticsData?.average_latency_ms ? `${analyticsData.average_latency_ms} ms` : 'N/A'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Mean: {analyticsData?.average_confidence ? `${(analyticsData.average_confidence * 100).toFixed(1)}%` : '0%'} confidence
          </p>
        </div>
      </div>

      {hasData ? (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Quality Distribution Pie */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white mb-1">Quality Distribution</h3>
              <p className="text-xs text-slate-400">Ratio of Fresh vs. Spoiled assessments</p>
            </div>

            <div className="h-64 w-full my-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={QUALITY_COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-300">Fresh: {analyticsData.class_counts?.Fresh || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-slate-300">Spoiled: {analyticsData.class_counts?.Spoiled || 0}</span>
              </div>
            </div>
          </div>

          {/* Daily Trends Area Chart */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white mb-1">Assessment Activity Timeline</h3>
              <p className="text-xs text-slate-400">Daily frequency of classifications</p>
            </div>

            <div className="h-64 w-full my-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.recent_trends || []}>
                  <defs>
                    <linearGradient id="colorFresh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorSpoiled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area
                    type="monotone"
                    dataKey="Fresh"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorFresh)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="Spoiled"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorSpoiled)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800 text-center">
              Historical activity recorded across all connected clients
            </p>
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <BarChart3 className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Predictions Recorded Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Run your first food quality assessment to populate quality ratio charts, latency benchmarks, and daily trends.
          </p>
        </div>
      )}

      {/* Safety Notice */}
      <FoodSafetyDisclaimer />
    </div>
  );
}
