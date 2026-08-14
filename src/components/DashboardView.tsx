import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
} from 'chart.js';
import { Pie, Doughnut, Bar, Line } from 'react-chartjs-2';
import type { SheetData, DashboardWidget } from '../types';
import { Trash2, TrendingUp, Layers, Plus } from 'lucide-react';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
);

interface DashboardViewProps {
  sheetData: SheetData;
  widgets: DashboardWidget[];
  onUpdateWidgets: (widgets: DashboardWidget[]) => void;
  onAddSamplePieChart: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  sheetData,
  widgets,
  onUpdateWidgets,
  onAddSamplePieChart,
}) => {
  const handleDeleteWidget = (id: string) => {
    onUpdateWidgets(widgets.filter((w) => w.id !== id));
  };

  /**
   * Helper to aggregate grid data for charts (e.g. SUM of Count per Data1 label)
   */
  const computeChartData = (widget: DashboardWidget) => {
    const labelCol = widget.labelColumn || 'data1';
    const valueCol = widget.valueColumn || 'count';

    const grouped: Record<string, number> = {};

    sheetData.rows.forEach((row) => {
      const labelVal = String(row[labelCol]?.raw ?? 'Unknown');
      const numVal = Number(row[valueCol]?.raw ?? 0);
      const cleanVal = isNaN(numVal) ? 0 : numVal;

      if (!grouped[labelVal]) grouped[labelVal] = 0;
      grouped[labelVal] += cleanVal;
    });

    const labels = Object.keys(grouped);
    const dataValues = Object.values(grouped);

    const defaultColors = [
      '#6366f1',
      '#ec4899',
      '#14b8a6',
      '#f59e0b',
      '#8b5cf6',
      '#06b6d4',
      '#3b82f6',
      '#10b981',
      '#f43f5e',
    ];

    return {
      labels,
      datasets: [
        {
          label: widget.title,
          data: dataValues,
          backgroundColor: widget.customColors || defaultColors,
          borderColor: '#1e293b',
          borderWidth: 2,
        },
      ],
    };
  };

  /**
   * Compute single KPI metric
   */
  const computeKpiValue = (widget: DashboardWidget): number => {
    const metricCol = widget.kpiConfig?.metricColumn || 'count';
    const agg = widget.kpiConfig?.aggregation || 'SUM';

    const values = sheetData.rows
      .map((r) => Number(r[metricCol]?.raw ?? 0))
      .filter((n) => !isNaN(n));

    if (values.length === 0) return 0;
    if (agg === 'SUM') return values.reduce((a, b) => a + b, 0);
    if (agg === 'AVERAGE') return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    if (agg === 'MAX') return Math.max(...values);
    if (agg === 'COUNT') return values.length;

    return 0;
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#cbd5e1',
          font: { family: 'Outfit, sans-serif', size: 11 },
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
      },
    },
  };

  return (
    <div
      id="dashboard-print-container"
      className="p-6 bg-slate-950 text-slate-100 min-h-full rounded-2xl border border-slate-800 shadow-2xl flex flex-col gap-6"
    >
      {/* Dashboard Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-400" />
            Executive Analytics Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time interactive visualizations synchronized with your spreadsheet entries
          </p>
        </div>

        <button
          onClick={onAddSamplePieChart}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          Add Pie Chart
        </button>
      </div>

      {/* Widgets Grid */}
      {widgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 text-center">
          <Layers className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No Dashboard Widgets Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            Type a prompt in the AI sidebar like: "Create a circular pie chart for Data1 and Count"
          </p>
          <button
            onClick={onAddSamplePieChart}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow"
          >
            Create First Pie Chart
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.map((widget) => {
            if (widget.type === 'kpi') {
              const val = computeKpiValue(widget);
              return (
                <div
                  key={widget.id}
                  className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between hover:border-indigo-500/40 transition group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {widget.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <button
                        onClick={() => handleDeleteWidget(widget.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-black text-white tracking-tight font-mono">
                      {val.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-medium mt-1">
                      Live sync with spreadsheet
                    </div>
                  </div>
                </div>
              );
            }

            const chartData = computeChartData(widget);

            return (
              <div
                key={widget.id}
                className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between hover:border-indigo-500/40 transition group min-h-[320px]"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-200 truncate flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    {widget.title}
                  </h3>
                  <button
                    onClick={() => handleDeleteWidget(widget.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Chart Container */}
                <div className="relative flex-1 w-full min-h-[220px]">
                  {widget.chartType === 'pie' && <Pie data={chartData} options={chartOptions} />}
                  {widget.chartType === 'doughnut' && <Doughnut data={chartData} options={chartOptions} />}
                  {widget.chartType === 'bar' && <Bar data={chartData} options={chartOptions} />}
                  {widget.chartType === 'line' && <Line data={chartData} options={chartOptions} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
