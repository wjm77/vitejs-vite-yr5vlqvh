import { Link } from 'react-router-dom';
import { Monitor, Stethoscope, Users, Clock3 } from 'lucide-react';

import { useQueue } from '../context/QueueContext';
import type { ReactNode } from 'react';

function Dashboard() {
  const { clinics, tickets, activeCalls, currentPatients, getWaitingTickets } =
    useQueue();

  const totalWaiting = tickets.filter(
    (ticket) => ticket.status === 'waiting'
  ).length;

  const totalCalled = tickets.filter(
    (ticket) => ticket.status === 'called'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Stethoscope size={26} />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                مركز الرعاية الصحية
              </h1>

              <p className="text-sm text-slate-500">
                لوحة متابعة نظام الانتظار
              </p>
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            to="/reception"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            الاستقبال
          </Link>

          <Link
            to="/clinic"
            className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            العيادات
          </Link>

          <Link
            to="/display"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <Monitor size={18} />
            شاشة العرض
          </Link>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="المراجعون المنتظرون"
            value={totalWaiting}
            icon={<Users size={22} />}
            description="بانتظار الاستدعاء"
          />

          <StatCard
            title="الاستدعاءات الحالية"
            value={activeCalls.length}
            icon={<Monitor size={22} />}
            description="ظاهر حاليًا على الشاشة"
          />

          <StatCard
            title="قيد الخدمة"
            value={totalCalled}
            icon={<Stethoscope size={22} />}
            description="تم استدعاؤهم"
          />

          <StatCard
            title="عدد العيادات"
            value={clinics.filter((clinic) => clinic.isActive).length}
            icon={<Clock3 size={22} />}
            description="العيادات النشطة"
          />
        </div>

        {/* Clinics */}
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-extrabold text-slate-900">
              حالة العيادات
            </h2>

            <p className="text-sm text-slate-500">
              متابعة حالة كل عيادة وأرقام الانتظار الخاصة بها
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {clinics
              .filter((clinic) => clinic.isActive)
              .map((clinic) => {
                const waiting = getWaitingTickets(clinic.id);
                const current = currentPatients[clinic.id];

                return (
                  <div
                    key={clinic.id}
                    className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
                  >
                    {/* Clinic Header */}
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-extrabold text-slate-900">
                          {clinic.name}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          غرفة {clinic.roomNumber}
                        </p>
                      </div>

                      <span className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-extrabold text-blue-700">
                        {clinic.prefix}
                      </span>
                    </div>

                    {/* Current Patient */}
                    <div className="mb-4 rounded-xl bg-slate-50 p-4">
                      <p className="mb-1 text-xs font-semibold text-slate-500">
                        المراجع الحالي
                      </p>

                      {current ? (
                        <div>
                          <div className="text-2xl font-extrabold text-blue-700">
                            {current.ticketNumber}
                          </div>

                          <div className="mt-1 font-bold text-slate-800">
                            {current.patientName}
                          </div>
                        </div>
                      ) : (
                        <div className="font-bold text-slate-400">
                          لا يوجد مراجع حالي
                        </div>
                      )}
                    </div>

                    {/* Waiting */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-sm font-semibold text-slate-500">
                        المنتظرون
                      </span>

                      <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-extrabold text-amber-700">
                        {waiting.length}
                      </span>
                    </div>

                    {/* Waiting Numbers Preview */}
                    {waiting.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {waiting.slice(0, 4).map((ticket) => (
                          <span
                            key={ticket.id}
                            className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700"
                          >
                            {ticket.ticketNumber}
                          </span>
                        ))}

                        {waiting.length > 4 && (
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                            +{waiting.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: ReactNode;
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>

          <div className="mt-2 text-3xl font-extrabold text-slate-900">
            {value}
          </div>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>

      <p className="text-xs font-medium text-slate-400">{description}</p>
    </div>
  );
}

export default Dashboard;
