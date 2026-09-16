import { useEffect, useMemo, useRef, useState } from 'react';
import { Monitor, Stethoscope, Users } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useQueue } from '../context/QueueContext';
import type { Ticket } from '../types/queue';

const DISPLAY_DURATION = 3 * 60 * 1000;

function getSpeechText(ticket: Ticket) {
  let text = ticket.ticketNumber
    .replace(/BD/gi, ' بي دي ')
    .replace(/HC/gi, ' إتش سي ')
    .replace(/F/gi, ' إف ')
    .replace(/U/gi, ' يو ');

  text = text.replace(/-/g, ' ');

  const parts = text.split(' ');
  const processedParts = parts.map((part) => {
    if (/^\d+$/.test(part)) {
      return part.split('').join(' ');
    }
    return part;
  });

  const formattedNumber = processedParts.join(' ');
  const room = ticket.roomNumber;

  return `رقم ${formattedNumber}، يرجى التوجه إلى الغرفة رقم ${room}`;
}

function speakTicket(ticket: Ticket) {
  try {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(getSpeechText(ticket));
    utterance.lang = 'ar-SA';
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(
      (voice) => voice.lang.includes('ar') || voice.lang.startsWith('ar')
    );

    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.warn('تعذر تشغيل الصوت:', error);
  }
}

function playNotificationSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.12);

    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.35,
      audioContext.currentTime + 0.02
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + 0.45
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);

    oscillator.onended = () => {
      audioContext.close();
    };
  } catch (error) {
    console.warn('تعذر تشغيل نغمة التنبيه:', error);
  }
}

function Display() {
  usePageTitle('شاشة التذاكر');
  const { clinics, tickets } = useQueue();
  const [currentTime, setCurrentTime] = useState(new Date());
  const previousCalledKeys = useRef<Set<string>>(new Set());
  const [newCallIds, setNewCallIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  // التذاكر المستدعاة حالياً للالتزام بنغمات التنبيه والصوت
  const calledTickets = useMemo(() => {
    const now = Date.now();
    return tickets.filter((ticket) => {
      if (ticket.status !== 'called') return false;
      if (!ticket.calledAt) return false;
      return now - ticket.calledAt <= DISPLAY_DURATION;
    });
  }, [tickets, currentTime]);

  useEffect(() => {
    const currentKeys = new Set(
      calledTickets.map((ticket) => `${ticket.id}-${ticket.calledAt ?? ''}`)
    );

    const justAdded: Ticket[] = [];

    calledTickets.forEach((ticket) => {
      const key = `${ticket.id}-${ticket.calledAt ?? ''}`;
      if (!previousCalledKeys.current.has(key)) {
        justAdded.push(ticket);
      }
    });

    if (justAdded.length > 0) {
      const ids = new Set(justAdded.map((ticket) => ticket.id));
      setNewCallIds(ids);

      playNotificationSound();

      const latestCall = [...justAdded].sort(
        (a, b) => (b.calledAt ?? 0) - (a.calledAt ?? 0)
      )[0];

      if (latestCall) {
        window.setTimeout(() => {
          speakTicket(latestCall);
        }, 500);
      }

      const timer = window.setTimeout(() => {
        setNewCallIds(new Set());
      }, 1500);

      previousCalledKeys.current = currentKeys;

      return () => {
        window.clearTimeout(timer);
      };
    }

    previousCalledKeys.current = currentKeys;
  }, [calledTickets]);

  // 1. تصفية وتجهيز العيادات الفعالة التي لديها تذاكر (سواء منتظرة أو مستدعاة)
  const activeClinicsData = useMemo(() => {
    return clinics
      .filter((clinic) => clinic.isActive)
      .map((clinic) => {
        const clinicTickets = tickets.filter(
          (t) => t.clinicId === clinic.id
        );

        // التذكرة المستدعاة حالياً في العيادة
        const currentCalled = clinicTickets
          .filter((t) => t.status === 'called')
          .sort((a, b) => (b.calledAt ?? 0) - (a.calledAt ?? 0))[0];

        // القادمون (التذاكر الـ 5 القادمة المنتظرة)
        const upcomingTickets = clinicTickets
          .filter((t) => t.status === 'waiting')
          .sort((a, b) => a.createdAt - b.createdAt)
          .slice(0, 5);

        return {
          clinic,
          currentCalled,
          upcomingTickets,
          totalCount: (currentCalled ? 1 : 0) + upcomingTickets.length,
        };
      })
      .filter((item) => item.totalCount > 0); // نُظهر فقط العيادات التي بها تذاكر
  }, [clinics, tickets]);

  // حساب عدد الأعمدة الديناميكي بناءً على عدد العيادات الفعالة
  const gridColsClass = useMemo(() => {
    const count = activeClinicsData.length;
    if (count <= 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-3';
    if (count === 4) return 'grid-cols-4';
    if (count === 5) return 'grid-cols-5';
    if (count === 6) return 'grid-cols-6';
    return 'grid-cols-7';
  }, [activeClinicsData.length]);

  return (
    <div
      className="display-screen h-screen overflow-hidden flex flex-col bg-slate-900"
      dir="rtl"
    >
      {/* Header */}
      <header className="flex h-[80px] shrink-0 items-center justify-between border-b border-slate-800 bg-white px-8 py-3 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center">
            <img
              src="/logo.svg"
              alt="شعار المركز الصحي"
              className="h-12 w-auto object-contain drop-shadow-md"
            />
          </div>

          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              مركز الرعاية الصحية الأولية بالخرج
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              نظام انتظار المراجعين
            </p>
          </div>
        </div>

        <div className="text-left">
          <div className="text-2xl font-extrabold text-slate-800">
            {currentTime.toLocaleTimeString('ar-SA', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div className="text-xs font-semibold text-slate-400">
            {currentTime.toLocaleDateString('ar-SA', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex flex-1 flex-col overflow-hidden p-4 bg-slate-900">
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-white">
              شاشة استدعاء وتتابع الدور
            </h2>
            <p className="text-xs font-semibold text-slate-300">
              يرجى متابعة القائمة والتوجه للعيادة عند النداء على رقمك
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 border border-slate-700">
            <Monitor size={16} className="text-sky-400" />
            <span>العيادات الفعالة: {activeClinicsData.length}</span>
          </div>
        </div>

        {/* Dynamic Columns Grid */}
        {activeClinicsData.length > 0 ? (
          <div className={`grid ${gridColsClass} flex-1 gap-4 overflow-hidden`}>
            {activeClinicsData.map(({ clinic, currentCalled, upcomingTickets }) => (
              <div
                key={clinic.id}
                className="flex flex-col overflow-hidden rounded-2xl bg-slate-800/90 border border-slate-700/60 shadow-xl"
              >
                {/* Clinic Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-slate-700 bg-sky-600 px-4 py-3 text-white">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-lg truncate">
                      {clinic.name}
                    </h3>
                  </div>
                  <div className="mr-2 rounded-lg bg-sky-800 px-3 py-1 text-xs font-black text-sky-100 whitespace-nowrap">
                    غرفة {clinic.roomNumber}
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-1 flex-col p-3 gap-3 overflow-hidden">
                  {/* Current Called Ticket (Highlighted Box) */}
                  <div className="shrink-0">
                    <span className="mb-1 block text-xs font-extrabold text-amber-400">
                      الرقم المستدعى حالياً:
                    </span>
                    {currentCalled ? (
                      <div
                        className={`flex flex-col items-center justify-center rounded-xl p-3 text-center border-2 transition-all ${
                          newCallIds.has(currentCalled.id)
                            ? 'bg-amber-400 text-slate-950 border-white animate-pulse shadow-[0_0_20px_rgba(251,191,36,0.6)]'
                            : 'bg-gradient-to-b from-sky-500 to-sky-600 text-white border-sky-400 shadow-md'
                        }`}
                      >
                        <div className="text-3xl lg:text-4xl font-black tracking-tight">
                          {currentCalled.ticketNumber}
                        </div>
                        <div className="mt-1 text-xs font-extrabold opacity-90 truncate max-w-full">
                          {currentCalled.patientName || 'مراجع'}
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-16 items-center justify-center rounded-xl border border-dashed border-slate-600 bg-slate-800/50 text-xs font-semibold text-slate-400">
                        لا يوجد استدعاء حالي
                      </div>
                    )}
                  </div>

                  {/* Upcoming 5 Tickets List */}
                  <div className="flex flex-1 flex-col overflow-hidden border-t border-slate-700/80 pt-2">
                    <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users size={14} className="text-sky-400" />
                        القادمون بعد قليلاً (أقصاه 5)
                      </span>
                      <span>({upcomingTickets.length})</span>
                    </div>

                    <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                      {upcomingTickets.length > 0 ? (
                        upcomingTickets.map((ticket, idx) => (
                          <div
                            key={ticket.id}
                            className="flex items-center justify-between rounded-lg bg-slate-700/50 border border-slate-600/40 p-2 text-slate-200"
                          >
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-600 text-[10px] font-bold text-slate-300">
                                {idx + 1}
                              </span>
                              <span className="font-black text-sm text-sky-300">
                                {ticket.ticketNumber}
                              </span>
                            </div>
                            <span className="text-xs font-medium text-slate-300 truncate max-w-[100px]">
                              {ticket.patientName}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="flex h-20 items-center justify-center text-xs font-medium text-slate-500">
                          لا توجد تذاكر قائمة
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyDisplay />
        )}

        {/* Footer */}
        <footer className="mt-2 flex shrink-0 items-center justify-center border-t border-slate-800 pt-2">
          <p className="text-xs font-semibold text-slate-400">
            يرجى الانتباه إلى رقم التذكرة والغرفة الموضحة أعلاه
          </p>
        </footer>
      </main>
    </div>
  );
}

function EmptyDisplay() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-3xl bg-slate-800/80 border border-slate-700 shadow-2xl">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-sky-950 text-sky-400 border border-sky-800">
          <Stethoscope size={36} />
        </div>
        <h2 className="text-2xl font-extrabold text-white">
          لا توجد عيادات أو تذاكر نشطة حالياً
        </h2>
        <p className="mt-2 text-sm font-semibold text-slate-400">
          سيتم عرض قوائم العيادات تلقائياً عند إصدار أو استدعاء التذاكر
        </p>
      </div>
    </div>
  );
}

export default Display;
