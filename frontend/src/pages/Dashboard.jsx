// src/pages/Dashboard.jsx
import { useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, Flame, Calendar } from 'lucide-react';
import { useStore } from '../store/AppStore';

const PRIORITY_COLORS = {
  low: '#64748b', medium: '#f59e0b', high: '#ef4444', urgent: '#dc2626',
};

function StatCard({ icon: Icon, label, value, sub, color = '#6366f1' }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}18`, color }}>
        <Icon size={20} />
      </div>
      <div className="stat-body">
        <p className="stat-value">{value ?? '—'}</p>
        <p className="stat-label">{label}</p>
        {sub && <p className="stat-sub">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { state, actions } = useStore();
  const { stats } = state;

  useEffect(() => { actions.loadStats(); }, []);

  if (!stats) {
    return (
      <div className="page">
        <div className="page-header"><h1 className="page-title">Dashboard</h1></div>
        <div className="loading-state">Loading analytics…</div>
      </div>
    );
  }

  const { overview, byPriority, byCategory, completionTrend, byStatus } = stats;

  const completionPct = overview.total
    ? Math.round((overview.completed / overview.total) * 100)
    : 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your productivity at a glance</p>
        </div>
        <div className="completion-ring">
          <svg viewBox="0 0 44 44" width="56" height="56">
            <circle cx="22" cy="22" r="18" fill="none" stroke="#e2e8f0" strokeWidth="4" />
            <circle
              cx="22" cy="22" r="18" fill="none"
              stroke="#6366f1" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${(completionPct / 100) * 113} 113`}
              transform="rotate(-90 22 22)"
            />
          </svg>
          <span className="ring-label">{completionPct}%</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard icon={CheckCircle2} label="Completed" value={overview.completed}  color="#10b981"
          sub={`of ${overview.total} total`} />
        <StatCard icon={Clock}        label="Pending"   value={overview.pending}    color="#f59e0b" />
        <StatCard icon={Flame}        label="High Priority" value={overview.high_priority} color="#ef4444" />
        <StatCard icon={AlertTriangle} label="Overdue"  value={overview.overdue}    color="#dc2626" />
        <StatCard icon={Calendar}     label="Due Today" value={overview.due_today}  color="#6366f1" />
        <StatCard icon={TrendingUp}   label="Completion" value={`${completionPct}%`} color="#8b5cf6" />
      </div>

      {/* Charts row */}
      <div className="charts-grid">
        {/* Completion trend */}
        <div className="chart-card chart-card--wide">
          <h3 className="chart-title">30-Day Completion Trend</h3>
          {completionTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={completionTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  labelFormatter={l => `Date: ${l}`}
                />
                <Line
                  type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5}
                  dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">Complete some tasks to see the trend</div>
          )}
        </div>

        {/* By priority */}
        <div className="chart-card">
          <h3 className="chart-title">By Priority</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byPriority} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="priority" tick={{ fontSize: 11 }}
                tickFormatter={p => p.charAt(0).toUpperCase() + p.slice(1)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]}>
                {byPriority.map((entry, i) => (
                  <Cell key={i} fill={PRIORITY_COLORS[entry.priority] ?? '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By status */}
        <div className="chart-card">
          <h3 className="chart-title">By Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={byStatus} dataKey="total" nameKey="status"
                cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                paddingAngle={3}
              >
                {byStatus.map((entry, i) => (
                  <Cell key={i} fill={['#6366f1','#f59e0b','#10b981','#94a3b8'][i % 4]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                formatter={(v, n) => [v, n.replace('_', ' ')]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend">
            {byStatus.map((s, i) => (
              <span key={s.status} className="pie-legend-item">
                <span className="pie-dot" style={{ background: ['#6366f1','#f59e0b','#10b981','#94a3b8'][i % 4] }} />
                {s.status.replace('_', ' ')} ({s.total})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <div className="chart-card">
          <h3 className="chart-title">Category Breakdown</h3>
          <div className="category-bars">
            {byCategory.map(cat => {
              const pct = cat.total ? Math.round(((cat.completed || 0) / cat.total) * 100) : 0;
              return (
                <div key={cat.id} className="category-bar-row">
                  <div className="category-bar-label">
                    <span className="cat-dot" style={{ background: cat.color }} />
                    <span>{cat.name}</span>
                  </div>
                  <div className="category-bar-track">
                    <div
                      className="category-bar-fill"
                      style={{ width: `${pct}%`, background: cat.color }}
                    />
                  </div>
                  <span className="category-bar-pct">{pct}%</span>
                  <span className="category-bar-count">{cat.completed ?? 0}/{cat.total}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
