import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  LogOut,
  Plus,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useQueue } from '../context/QueueContext';

function Reception() {
  const navigate = useNavigate();

  const { clinics, issueTicket, tickets } = useQueue();

  const [patientName, setPatientName] = useState('');
  const [clinicId, setClinicId] = useState(clinics[0]?.id ?? '');
  const [issuedTicket, setIssuedTicket] = useState<string | null>(null);
  const [error, setError] = useState('');

  // حالات الفرز والتقسيم (Pagination & Filter)
  const [selectedFilterClinic, setSelectedFilterClinic] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!clinicId && clinics.length > 0) {
      setClinicId(clinics[0].id);
    }
  }, [clinics, clinicId]);

  // تصفية وترتيب المراجعين المنتظرين
  const waitingTickets = tickets
    .filter((ticket) => {
      const isWaiting = ticket.status === 'waiting';
      const matchesClinic =
        selectedFilterClinic === 'all' ||
        ticket.clinicId === selectedFilterClinic;
      return isWaiting && matchesClinic;
    })
    .sort((a, b) => a.createdAt - b.createdAt);

  // حساب الصفحات
  const totalPages = Math.ceil(waitingTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTableData = waitingTickets.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFilterClinic(e.target.value);
    setCurrentPage(1);
  };

  const handleIssueTicket = async () => {
    setError('');
    setIssuedTicket(null);

    const cleanName = patientName.trim();

    if (!cleanName) {
      setError('يرجى إدخال اسم المراجع');
      return;
    }

    if (!clinicId) {
      setError('يرجى اختيار العيادة');
      return;
    }

    const ticket = await issueTicket(cleanName, clinicId);

    if (!ticket) {
      setError('تعذر إصدار الرقم، تأكد من البيانات');
      return;
    }

    setIssuedTicket(ticket.ticketNumber);
    setPatientName('');

    // أمر الطباعة المباشر بعد إصدار التذكرة بـ 150 جزء من الثانية
    // (التأخير ضروري للسماح للمتصفح برسم التذكرة في الصفحة قبل التقاطها للطباعة)
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('receptionAuthenticated');
    navigate('/login/reception');
  };

  // الحصول على اسم العيادة المحددة لطباعتها في التذكرة
  const selectedClinicName = clinics.find((c) => c.id === clinicId)?.name || '';

  return (
    <>
      {/* الواجهة الرئيسية - سيتم إخفائها تلقائياً وقت الطباعة باستخدام print:hidden */}
      <div
        className="min-h-screen bg-gradient-to-r from-sky-300 to-emerald-300 print:hidden"
        dir="rtl"
      >
        <div className="mx-auto max-w-7xl p-6">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="mx-auto mb-6 flex justify-center">
                <img
                  src="/logo.svg"
                  alt="شعار تجمع الرياض الصحي الأول"
                  className="h-12 w-auto object-contain drop-shadow-md transition-transform hover:scale-105"
                />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  الاستقبال
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  إصدار أرقام الانتظار للمراجعين
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50 hover:text-red-600"
            >
              <LogOut size={17} />
              تسجيل الخروج
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Issue Ticket */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-1">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Plus size={22} />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900">إصدار رقم</h2>
                  <p className="text-xs text-slate-500">أدخل بيانات المراجع</p>
                </div>
              </div>

              <label className="mb-2 block text-sm font-bold text-slate-700">
                اسم المراجع
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(event) => setPatientName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleIssueTicket();
                  }
                }}
                placeholder="مثال: أحمد محمد"
                className="mb-5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />

              <label className="mb-2 block text-sm font-bold text-slate-700">
                العيادة
              </label>
              <select
                value={clinicId}
                onChange={(event) => setClinicId(event.target.value)}
                className="mb-5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              >
                {clinics
                  .filter((clinic) => clinic.isActive)
                  .map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name} - غرفة {clinic.roomNumber}
                    </option>
                  ))}
              </select>

              {error && (
                <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              {issuedTicket && (
                <div className="mb-5 rounded-2xl bg-emerald-50 p-5 text-center">
                  <CheckCircle2
                    size={28}
                    className="mx-auto mb-2 text-emerald-600"
                  />
                  <p className="text-sm font-semibold text-emerald-700">
                    تم إصدار الرقم بنجاح
                  </p>
                  <div className="mt-2 text-4xl font-extrabold text-emerald-700">
                    {issuedTicket}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleIssueTicket}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-blue-700 active:scale-[0.99]"
              >
                <Plus size={19} />
                إصدار رقم
              </button>
            </div>

            {/* Queue List with Filtering and Pagination */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-2 flex flex-col justify-between">
              {/* بقية كود الجدول الخاص بك كما هو... */}
              <div>
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-extrabold text-slate-900">
                      قائمة الانتظار
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      جميع المراجعين المنتظرين حاليًا
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex-1 sm:flex-none">
                      <Filter size={16} className="text-slate-500" />
                      <select
                        value={selectedFilterClinic}
                        onChange={handleFilterChange}
                        className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                      >
                        <option value="all">كل العيادات</option>
                        {clinics.map((clinic) => (
                          <option key={clinic.id} value={clinic.id}>
                            {clinic.name} (غرفة {clinic.roomNumber})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-blue-700 shrink-0">
                      <Users size={18} />
                      <span className="text-sm font-extrabold">
                        {waitingTickets.length}
                      </span>
                      <span className="text-xs font-semibold">منتظر</span>
                    </div>
                  </div>
                </div>

                {waitingTickets.length === 0 ? (
                  <div className="flex min-h-[300px] items-center justify-center rounded-2xl bg-slate-50 text-sm font-semibold text-slate-400">
                    لا يوجد مراجعين في قائمة الانتظار مطابقين للبحث
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-right">
                          <th className="px-4 py-4 text-xs font-extrabold text-slate-500">
                            الرقم
                          </th>
                          <th className="px-4 py-4 text-xs font-extrabold text-slate-500">
                            العيادة
                          </th>
                          <th className="px-4 py-4 text-xs font-extrabold text-slate-500">
                            الغرفة
                          </th>
                          <th className="px-4 py-4 text-xs font-extrabold text-slate-500">
                            الحالة
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentTableData.map((ticket) => (
                          <tr
                            key={ticket.id}
                            className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="px-4 py-4">
                              <span className="font-extrabold text-blue-700">
                                {ticket.ticketNumber}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm font-semibold text-slate-600">
                                {ticket.clinicName}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm font-semibold text-slate-600">
                                {ticket.roomNumber}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700">
                                في الانتظار
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    <ChevronRight size={16} />
                    السابق
                  </button>

                  <div className="text-xs font-bold text-slate-500">
                    صفحة <span className="text-blue-600">{currentPage}</span> من{' '}
                    <span className="text-slate-800">{totalPages}</span>
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    التالي
                    <ChevronLeft size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* قسم التذكرة المخفي - يظهر فقط في الطابعة بمقاس ورق حراري (80mm) */}
      {issuedTicket && (
        <div
          className="hidden print:block print:w-[80mm] print:m-auto print:text-black"
          dir="rtl"
        >
          <div className="text-center p-4 font-sans">
            <img
              src="/logo.svg"
              alt="الشعار"
              className="h-14 mx-auto mb-2 grayscale"
            />
            <h2 className="text-lg font-bold">تجمع الرياض الصحي الأول</h2>

            <div className="border-t-2 border-b-2 border-black border-dashed py-6 my-4">
              <p className="text-sm font-bold mb-2">رقم الانتظار</p>
              <h1 className="text-6xl font-extrabold">{issuedTicket}</h1>
            </div>

            <p className="text-lg font-bold">{selectedClinicName}</p>
            <p className="text-sm mt-3">
              الوقت: {new Date().toLocaleTimeString('ar-SA')}
            </p>
            <p className="text-xs mt-4 text-gray-500">
              نرجو انتظار النداء على رقمك
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default Reception;
