import {
  Activity,
  LayoutDashboard,
  Monitor,
  Stethoscope,
  UsersRound,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

function Sidebar() {
  const links = [
    {
      to: '/',
      label: 'لوحة التحكم',
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: '/reception',
      label: 'الاستقبال',
      icon: UsersRound,
    },
    {
      to: '/clinic',
      label: 'العيادات',
      icon: Stethoscope,
    },
    {
      to: '/display',
      label: 'شاشة العرض',
      icon: Monitor,
      newTab: true,
    },
  ];

  return (
    <aside className="fixed right-0 top-0 z-40 hidden h-screen w-64 border-l border-slate-200 bg-white lg:block">
      {/* Logo / Brand */}
      <div className="border-b border-slate-100 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Activity size={23} />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-extrabold text-slate-900">
              مركز الرعاية الصحية
            </h1>

            <p className="mt-0.5 text-xs font-semibold text-slate-400">
              نظام انتظار المراجعين
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <p className="mb-3 px-3 text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
          القائمة الرئيسية
        </p>

        <div className="space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;

            if (link.newTab) {
              return (
                <a
                  key={link.to}
                  href={link.to}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <Icon size={19} />
                  <span>{link.label}</span>
                </a>
              );
            }

            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  ].join(' ')
                }
              >
                <Icon size={19} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* System Status */}
      <div className="absolute bottom-0 right-0 left-0 border-t border-slate-100 p-4">
        <div className="rounded-xl bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

            <span className="text-xs font-extrabold text-emerald-700">
              النظام يعمل
            </span>
          </div>

          <p className="mt-1 text-[11px] font-semibold text-emerald-600/80">
            جميع الخدمات متاحة
          </p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
