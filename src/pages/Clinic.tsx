import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Forward,
  LogOut,
  RotateCcw,
  SkipForward,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useQueue } from '../context/QueueContext';

function Clinic() {
  const navigate = useNavigate();

  const {
    clinics,
    currentPatients,
    getWaitingTickets,
    callNext,
    recallPatient,
    skipPatient,
    completePatient,
  } = useQueue();

  const [message, setMessage] = useState('');
  const [selectedClinicId, setSelectedClinicId] = useState('');

  /*
   * الحساب مرتبط بالغرفة وليس بعيادة واحدة.
   */
  const clinicRoom =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('clinicRoom') ?? ''
      : '';

  /*
   * جميع العيادات النشطة الموجودة في نفس الغرفة.
   *
   * مثال:
   * الغرفة 1:
   * - طب الأسرة
   * - رعاية عاجلة
   */
  const roomClinics = useMemo(() => {
    if (!clinicRoom) {
      return [];
    }

    return clinics
      .filter((clinic) => clinic.isActive && clinic.roomNumber === clinicRoom)
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [clinics, clinicRoom]);

  /*
   * عند تحميل العيادات، نحدد أول عيادة كتحديد افتراضي.
   * وإذا تغيرت قائمة العيادات نتأكد أن التحديد لا يزال صالحًا.
   */
  useEffect(() => {
    if (
      roomClinics.length > 0 &&
      !roomClinics.some((clinic) => clinic.id === selectedClinicId)
    ) {
      setSelectedClinicId(roomClinics[0].id);
    }
  }, [roomClinics, selectedClinicId]);

  /*
   * العيادة المختارة حاليًا.
   */
  const selectedClinic = roomClinics.find(
    (clinic) => clinic.id === selectedClinicId
  );

  /*
   * هذا هو الـclinicId الحقيقي الذي تستخدمه التذاكر والاستدعاءات.
   */
  const activeClinicId = selectedClinic?.id ?? '';
  useEffect(() => {
    if (!activeClinicId) return;

    const roomChannel = supabase.channel('online-rooms');

    roomChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await roomChannel.track({
          clinicId: activeClinicId,
          onlineAt: new Date().toISOString(),
        });
      }
    });

    return () => {
      void supabase.removeChannel(roomChannel);
    };
  }, [activeClinicId]);
  /*
   * قائمة انتظار العيادة المحددة فقط.
   */
  const waitingTickets = useMemo(() => {
    return activeClinicId ? getWaitingTickets(activeClinicId) : [];
  }, [activeClinicId, getWaitingTickets]);

  /*
   * المراجع الحالي للعيادة المحددة فقط.
   */
  const currentPatient = activeClinicId
    ? currentPatients[activeClinicId] ?? null
    : null;

  /*
   * عدد المنتظرين لكل عيادة داخل الغرفة.
   * يستخدم في شريط التبويبات.
   */
  const waitingCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    roomClinics.forEach((clinic) => {
      counts[clinic.id] = getWaitingTickets(clinic.id).length;
    });

    return counts;
  }, [roomClinics, getWaitingTickets]);

  const showMessage = (text: string) => {
    setMessage(text);

    window.setTimeout(() => {
      setMessage('');
    }, 2500);
  };

  const handleClinicChange = (clinicId: string) => {
    setSelectedClinicId(clinicId);
    setMessage('');
  };

  const handleCallNext = async () => {
    if (!activeClinicId) {
      showMessage('لم يتم تحديد العيادة');
      return;
    }

    const ticket = await callNext(activeClinicId);

    if (!ticket) {
      showMessage('لا يوجد مراجعون منتظرون لهذه العيادة');
      return;
    }

    showMessage(`تم استدعاء ${ticket.ticketNumber}`);
  };

  const handleRecall = async () => {
    if (!currentPatient) {
      showMessage('لا يوجد مراجع حالي لإعادة النداء');
      return;
    }

    try {
      // إضافة await لانتظار استجابة السياق/الخادم
      const call = await recallPatient(currentPatient.id);

      if (call) {
        showMessage(`تمت إعادة النداء على ${currentPatient.ticketNumber}`);
      }
    } catch (error) {
      console.error('خطأ في إعادة النداء:', error);
      showMessage('حدث خطأ أثناء محاولة إعادة النداء');
    }
  };

  const handleSkip = async () => {
    if (!currentPatient) {
      showMessage('لا يوجد مراجع حالي لتخطيه');
      return;
    }

    const ticketNumber = currentPatient.ticketNumber;

    await skipPatient(currentPatient.id);

    showMessage(`تم تخطي ${ticketNumber}`);
  };

  const handleComplete = async () => {
    if (!currentPatient) {
      showMessage('لا يوجد مراجع حالي لإنهاء الزيارة');
      return;
    }

    const ticketNumber = currentPatient.ticketNumber;

    await completePatient(currentPatient.id);

    showMessage(`تم إنهاء زيارة ${ticketNumber}`);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('clinicAuthenticated');
    sessionStorage.removeItem('clinicRoom');
    sessionStorage.removeItem('clinicUsername');
    sessionStorage.removeItem('clinicId');

    navigate('/login/clinic');
  };

  /*
   * إذا لم يسجل الدخول أو لم توجد عيادات فعالة للغرفة.
   */
  if (!clinicRoom || roomClinics.length === 0) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-slate-50 p-6"
        dir="rtl"
      >
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
            <Stethoscope size={26} />
          </div>

          <h1 className="text-xl font-extrabold text-slate-900">
            لا توجد عيادات لهذه الغرفة
          </h1>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            يرجى التأكد من تسجيل الدخول بالحساب الصحيح.
          </p>

          <button
            type="button"
            onClick={() => navigate('/login/clinic')}
            className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-blue-700"
          >
            الانتقال إلى تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-r from-sky-300 to-emerald-300"
      dir="rtl"
    >
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="mx-auto mb-6 flex justify-center">
                  <img
                    src="/logo.svg"
                    alt="شعار تجمع الرياض الصحي الأول"
                    className="h-12 w-auto object-contain drop-shadow-md transition-transform hover:scale-105"
                  />
                </div>

                <div>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    مركز الرعاية الصحية الأولية بالخرج
                  </p>
                  <h1 className="text-2xl font-extrabold text-slate-900">
                    عيادات الغرفة {clinicRoom}
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 px-5 py-3 text-center">
                <div className="text-xs font-bold text-emerald-600">
                  حالة الغرفة
                </div>

                <div className="mt-1 text-sm font-extrabold text-emerald-700">
                  مفتوحة
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50 hover:text-red-600"
              >
                <LogOut size={17} />
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>

        {/* Clinic Tabs */}
        <div className="mb-6 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap gap-2">
            {roomClinics.map((roomClinic) => {
              const isSelected = roomClinic.id === activeClinicId;
              const waitingCount = waitingCounts[roomClinic.id] ?? 0;

              return (
                <button
                  key={roomClinic.id}
                  type="button"
                  onClick={() => handleClinicChange(roomClinic.id)}
                  className={[
                    'relative flex min-h-[58px] flex-1 items-center justify-center gap-3 rounded-xl px-5 py-3 text-sm font-extrabold transition',
                    'min-w-[220px] sm:min-w-[240px]',
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100',
                  ].join(' ')}
                >
                  <span>{roomClinic.name}</span>

                  {waitingCount > 0 && (
                    <span
                      className={[
                        'inline-flex min-w-7 items-center justify-center rounded-full px-2 py-1 text-xs font-extrabold',
                        isSelected
                          ? 'bg-white text-blue-700'
                          : 'bg-red-500 text-white',
                      ].join(' ')}
                    >
                      {waitingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clinic Information */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="text-xs font-bold text-slate-500">العيادة</div>

            <div className="mt-2 text-lg font-extrabold text-slate-900">
              {selectedClinic?.name ?? '-'}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="text-xs font-bold text-slate-500">رقم الغرفة</div>

            <div className="mt-2 text-lg font-extrabold text-slate-900">
              غرفة {selectedClinic?.roomNumber ?? clinicRoom}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="text-xs font-bold text-slate-500">
              عدد المنتظرين
            </div>

            <div className="mt-2 text-2xl font-extrabold text-amber-600">
              {waitingTickets.length}
            </div>
          </div>
        </div>

        {/* Notification */}
        {message && (
          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Current Patient */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-1">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Bell size={20} />
              </div>

              <div>
                <h2 className="font-extrabold text-slate-900">
                  المراجع الحالي
                </h2>

                <p className="text-xs text-slate-500">
                  {selectedClinic?.name ?? 'العيادة المحددة'}
                </p>
              </div>
            </div>

            {currentPatient ? (
              <>
                <div className="mb-5 rounded-2xl bg-slate-50 p-6 text-center">
                  <div className="text-5xl font-extrabold tracking-tight text-black-700">
                    {currentPatient.ticketNumber}
                  </div>

                  <div className="mt-3 text-lg font-extrabold text-slate-900">
                    {currentPatient.patientName}
                  </div>

                  <div className="mt-1 text-sm font-semibold text-slate-500">
                    غرفة {currentPatient.roomNumber}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleRecall}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
                  >
                    <RotateCcw size={17} />
                    إعادة النداء
                  </button>

                  <button
                    type="button"
                    onClick={handleSkip}
                    className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-extrabold text-amber-700 transition hover:bg-amber-100"
                  >
                    <SkipForward size={17} />
                    تخطي
                  </button>

                  <button
                    type="button"
                    onClick={handleComplete}
                    className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-red-700"
                  >
                    <CheckCircle2 size={18} />
                    إنهاء الزيارة
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-2xl bg-slate-50 p-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm">
                  <Bell size={26} />
                </div>

                <p className="font-extrabold text-slate-500">
                  لا يوجد مراجع حالي
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-400">
                  اضغط على استدعاء التالي لبدء الخدمة
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleCallNext}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-4 text-base font-extrabold text-white shadow-sm transition hover:bg-emerald-600 active:scale-[0.99]"
            >
              <Forward size={20} />
              استدعاء التالي
            </button>
          </div>

          {/* Waiting Queue */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-extrabold text-slate-900">
                  قائمة انتظار {selectedClinic?.name ?? ''}
                </h2>

                <p className="mt-1 text-xs text-emerald-500">
                  المراجعون التابعون لهذه العيادة فقط
                </p>
              </div>

              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-extrabold text-amber-700">
                {waitingTickets.length} منتظر
              </span>
            </div>

            {waitingTickets.length === 0 ? (
              <div className="flex min-h-[350px] items-center justify-center rounded-2xl bg-slate-50 text-center">
                <div>
                  <Users size={40} className="mx-auto mb-3 text-slate-300" />

                  <p className="font-extrabold text-slate-500">
                    لا يوجد مراجعون في الانتظار
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    عند إصدار أرقام جديدة لهذه العيادة ستظهر هنا
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {waitingTickets.map((ticket, index) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-extrabold text-slate-400 shadow-sm">
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="text-lg font-extrabold text-emerald-700">
                          {ticket.ticketNumber}
                        </div>

                        <div className="truncate text-sm font-bold text-slate-800">
                          {ticket.patientName}
                        </div>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700">
                      في الانتظار
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Clinic;
