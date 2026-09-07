import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-500">{title}</p>

          <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            {value}
          </div>

          {description && (
            <p className="mt-2 text-xs font-semibold text-slate-400">
              {description}
            </p>
          )}
        </div>

        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;
