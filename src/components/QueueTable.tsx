import type { Ticket } from '../types/queue';

interface QueueTableProps {
  tickets: Ticket[];
  emptyMessage?: string;
}

function QueueTable({
  tickets,
  emptyMessage = 'لا يوجد مراجعين في قائمة الانتظار',
}: QueueTableProps) {
  if (tickets.length === 0) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-2xl bg-slate-50">
        <p className="text-sm font-bold text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[650px] border-collapse">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="px-4 py-4 text-right text-xs font-extrabold text-slate-500">
              الرقم
            </th>

            <th className="px-4 py-4 text-right text-xs font-extrabold text-slate-500">
              المراجع
            </th>

            <th className="px-4 py-4 text-right text-xs font-extrabold text-slate-500">
              العيادة
            </th>

            <th className="px-4 py-4 text-right text-xs font-extrabold text-slate-500">
              الغرفة
            </th>

            <th className="px-4 py-4 text-right text-xs font-extrabold text-slate-500">
              الحالة
            </th>
          </tr>
        </thead>

        <tbody>
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/70"
            >
              {/* Ticket Number */}
              <td className="px-4 py-4">
                <span className="text-base font-extrabold text-blue-700">
                  {ticket.ticketNumber}
                </span>
              </td>

              {/* Patient */}
              <td className="px-4 py-4">
                <span className="font-bold text-slate-800">
                  {ticket.patientName}
                </span>
              </td>

              {/* Clinic */}
              <td className="px-4 py-4">
                <span className="text-sm font-semibold text-slate-600">
                  {ticket.clinicName}
                </span>
              </td>

              {/* Room */}
              <td className="px-4 py-4">
                <span className="text-sm font-semibold text-slate-600">
                  غرفة {ticket.roomNumber}
                </span>
              </td>

              {/* Status */}
              <td className="px-4 py-4">
                <StatusBadge status={ticket.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: Ticket['status'] }) {
  const config: Record<
    Ticket['status'],
    {
      label: string;
      className: string;
    }
  > = {
    waiting: {
      label: 'في الانتظار',
      className: 'bg-amber-50 text-amber-700',
    },

    called: {
      label: 'تم الاستدعاء',
      className: 'bg-blue-50 text-blue-700',
    },

    completed: {
      label: 'مكتمل',
      className: 'bg-emerald-50 text-emerald-700',
    },

    skipped: {
      label: 'تم التخطي',
      className: 'bg-slate-100 text-slate-600',
    },
  };

  const current = config[status];

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${current.className}`}
    >
      {current.label}
    </span>
  );
}

export default QueueTable;
