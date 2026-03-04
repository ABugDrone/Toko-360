'use client';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'cyan' | 'green' | 'purple' | 'pink';
}

const colorClasses = {
  cyan: 'bg-slate-900/60 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(0,217,255,0.3)]',
  green: 'bg-slate-900/60 border-green-500/40 text-green-400 shadow-[0_0_15px_rgba(0,255,136,0.3)]',
  purple: 'bg-slate-900/60 border-purple-500/40 text-purple-400 shadow-[0_0_15px_rgba(200,100,255,0.3)]',
  pink: 'bg-slate-900/60 border-pink-500/40 text-pink-400 shadow-[0_0_15px_rgba(255,0,127,0.3)]',
};

const trendColors = {
  up: 'text-green-400',
  down: 'text-red-400',
  neutral: 'text-slate-400',
};

export function MetricCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  color = 'cyan',
}: MetricCardProps) {
  return (
    <div className={`p-6 rounded-xl border ${colorClasses[color]} backdrop-blur`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        {icon && <div className="text-2xl opacity-60">{icon}</div>}
      </div>
      {trend && trendValue && (
        <div className={`text-sm font-semibold ${trendColors[trend]}`}>
          {trend === 'up' && '↑'} {trend === 'down' && '↓'} {trendValue}
        </div>
      )}
    </div>
  );
}
