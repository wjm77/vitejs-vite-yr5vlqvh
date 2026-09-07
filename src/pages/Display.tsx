import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Monitor, Stethoscope } from 'lucide-react';

import { useQueue } from '../context/QueueContext';
import type { Ticket } from '../types/queue';

const DISPLAY_DURATION = 3 * 60 * 1000;
const MAX_DISPLAY_TICKETS = 7;

function getSpeechText(ticket: Ticket) {
  // 1. تحويل الحروف الإنجليزية إلى مقابلها الصوتي بالعربي
  let text = ticket.ticketNumber
    .replace(/BD/gi, ' بي دي ')
    .replace(/HC/gi, ' إتش سي ')
    .replace(/F/gi, ' إف ')
    .replace(/U/gi, ' يو ');

  // 2. معالجة الشرطة - وفصل الأرقام بعد الحرف لنطقها مفردة أو خانة بخانة
  // تفكيك الأرقام المتتالية (مثل 004) وإضافة مساحات لتنطق (صفر صفر أربعة)
  text = text.replace(/-/g, ' ');

  // تحويل الأرقام التي تبدأ بأصفار إلى نطق خانة بخانة كي لا ينطقها المتصفح كـ (أربعة آلاف)
  const parts = text.split(' ');
  const processedParts = parts.map((part) => {
    if (/^\d+$/.test(part)) {
      // إذا كان الجزء عبارة عن أرقام فقط، نضيف مسافة بين كل رقم لتنطق خانة بخانة
      return part.split('').join(' ');
    }
    return part;
  });

  const formattedNumber = processedParts.join(' ');
  const room = ticket.roomNumber;

  // 3. النص النهائي الموجه لمحرك الصوت
  return `رقم ${formattedNumber}، يرجى التوجه إلى الغرفة رقم ${room}`;
}

function speakTicket(ticket: Ticket) {
  try {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // إيقاف أي صوت سابق

    const utterance = new SpeechSynthesisUtterance(getSpeechText(ticket));

    // إعدادات الصوت العربي
    utterance.lang = 'ar-SA';
    utterance.rate = 0.8; // سرعة مناسبة للانتظار
    utterance.pitch = 1;
    utterance.volume = 1;

    // البحث عن أفضل صوت عربي مثبت في النظام (Windows/Android/iOS)
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
  const { tickets } = useQueue();
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

  const calledTickets = useMemo(() => {
    const now = Date.now();

    return tickets
      .filter((ticket) => {
        if (ticket.status !== 'called') return false;
        if (!ticket.calledAt) return false;
        return now - ticket.calledAt <= DISPLAY_DURATION;
      })
      .sort((a, b) => (b.calledAt ?? 0) - (a.calledAt ?? 0))
      .slice(0, MAX_DISPLAY_TICKETS);
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

  const displayTickets = calledTickets;

  return (
    <div
      className="display-screen h-screen overflow-hidden flex flex-col"
      dir="rtl"
    >
      {/* Header */}
      <header className="flex h-[80px] shrink-0 items-center justify-between border-b border-white/20 bg-white px-8 py-3 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center">
            <img
              src="/logo.svg"
              alt="شعار تجمع الرياض الصحي الأول"
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

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden p-4 bg-sky-500">
        {/* Title */}
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-white">
              الأرقام المستدعاة
            </h2>
            <p className="text-xs font-semibold text-white/80">
              يرجى التوجه إلى العيادة والغرفة الموضحة
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm">
            <Monitor size={16} />
            الشاشة الرئيسية
          </div>
        </div>

        {/* Tickets Grid */}
        {displayTickets.length > 0 ? (
          <div
            className={`
              grid flex-1 gap-4 overflow-hidden
              ${
                displayTickets.length === 1
                  ? 'grid-cols-1 grid-rows-1'
                  : displayTickets.length === 2
                  ? 'grid-cols-2 grid-rows-1'
                  : displayTickets.length === 3
                  ? 'grid-cols-3 grid-rows-1'
                  : displayTickets.length === 4
                  ? 'grid-cols-3 grid-rows-2'
                  : displayTickets.length === 5
                  ? 'grid-cols-3 grid-rows-2'
                  : displayTickets.length === 6
                  ? 'grid-cols-3 grid-rows-2'
                  : 'grid-cols-3 grid-rows-3'
              }
            `}
          >
            {displayTickets.map((ticket, index) => {
              // لمعالجة حالة 4 بطاقات (3 في الأعلى والرابعة في السطر الثاني على اليمين)
              const isFourthOfFour = displayTickets.length === 4 && index === 3;
              // لمعالجة حالة 7 بطاقات (السابعة في السطر الثالث على اليمين)
              const isSeventhOfSeven =
                displayTickets.length === 7 && index === 6;

              let customClasses = '';
              if (isFourthOfFour || isSeventhOfSeven) {
                customClasses = 'col-start-1';
              }

              return (
                <div
                  key={ticket.id}
                  className={`${customClasses} h-full w-full`}
                >
                  <TicketCard
                    ticket={ticket}
                    isNew={newCallIds.has(ticket.id)}
                    totalTickets={displayTickets.length}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyDisplay />
        )}

        {/* Footer */}
        <footer className="mt-2 flex shrink-0 items-center justify-center">
          <p className="text-xs font-semibold text-white/80">
            يرجى متابعة الشاشة والتوجه إلى العيادة عند استدعاء رقمك
          </p>
        </footer>
      </main>
    </div>
  );
}

// Ticket Card Component
interface TicketCardProps {
  ticket: Ticket;
  isNew: boolean;
  totalTickets: number;
}

function TicketCard({ ticket, isNew, totalTickets }: TicketCardProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(
      0,
      Math.ceil(
        ((ticket.calledAt ?? Date.now()) + DISPLAY_DURATION - Date.now()) / 1000
      )
    )
  );

  useEffect(() => {
    const update = () => {
      const calledAt = ticket.calledAt ?? Date.now();
      const seconds = Math.max(
        0,
        Math.ceil((calledAt + DISPLAY_DURATION - Date.now()) / 1000)
      );
      setRemainingSeconds(seconds);
    };

    update();
    const timer = window.setInterval(update, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [ticket.calledAt]);

  const callTime = ticket.calledAt
    ? new Date(ticket.calledAt).toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--:--:--';

  // ضبط الأحجام ديناميكياً بحسب عدد التذاكر
  const getDynamicStyles = () => {
    if (totalTickets <= 2) {
      return {
        numberText: 'text-7xl lg:text-9xl',
        clinicText: 'text-xl lg:text-2xl',
        roomBadge: 'text-lg lg:text-xl px-4 py-2',
        instructionText: 'text-lg lg:text-xl mt-3',
        padding: 'p-6',
      };
    } else if (totalTickets <= 4) {
      return {
        numberText: 'text-5xl lg:text-7xl',
        clinicText: 'text-lg lg:text-xl',
        roomBadge: 'text-base lg:text-lg px-3 py-1.5',
        instructionText: 'text-base lg:text-lg mt-2',
        padding: 'p-4',
      };
    } else {
      // 5 إلى 7 تذاكر
      return {
        numberText: 'text-3xl lg:text-5xl',
        clinicText: 'text-base lg:text-lg',
        roomBadge: 'text-sm lg:text-base px-2.5 py-1',
        instructionText: 'text-sm lg:text-base mt-1',
        padding: 'p-3',
      };
    }
  };

  const styles = getDynamicStyles();

  return (
    <div
      className={`
        relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white
        transition-all duration-300 ${styles.padding}
        ${
          isNew
            ? 'scale-[1.01] border-4 border-yellow-400 shadow-[0_8px_30px_rgba(253,224,71,0.4)]'
            : 'border-4 border-transparent shadow-xl ring-1 ring-black/5'
        }
      `}
    >
      {/* Clinic & Room */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-extrabold text-slate-400">العيادة</p>
          <h3
            className={`font-extrabold text-slate-800 truncate ${styles.clinicText}`}
          >
            {ticket.clinicName}
          </h3>
        </div>

        <div
          className={`
            rounded-xl bg-blue-50 font-extrabold text-blue-700 whitespace-nowrap shrink-0
            ${styles.roomBadge}
          `}
        >
          غرفة {ticket.roomNumber}
        </div>
      </div>

      {/* Ticket Number */}
      <div className="flex flex-1 flex-col items-center justify-center py-1">
        <div
          className={`
            display-number font-black text-blue-700 leading-none tracking-tight
            ${styles.numberText}
            ${isNew ? 'animate-pulse-call' : ''}
          `}
        >
          {ticket.ticketNumber}
        </div>

        <div
          className={`text-center font-extrabold text-slate-700 ${styles.instructionText}`}
        >
          يرجى التوجه إلى غرفة {ticket.roomNumber}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-2 shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
          <Bell size={14} className="text-blue-600" />
          <span>{callTime}</span>
        </div>

        <div
          className={`
            rounded-full px-3 py-1 text-xs font-extrabold
            ${
              remainingSeconds <= 10
                ? 'bg-red-50 text-red-600'
                : 'bg-emerald-50 text-emerald-700'
            }
          `}
        >
          متبقي {formatRemainingTime(remainingSeconds)}
        </div>
      </div>
    </div>
  );
}

function formatRemainingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function EmptyDisplay() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-3xl bg-white shadow-2xl">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-500">
          <Stethoscope size={36} />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-700">
          لا توجد أرقام مستدعاة حاليًا
        </h2>
        <p className="mt-2 text-base font-semibold text-slate-400">
          سيتم عرض الرقم هنا عند استدعاء أحد المراجعين
        </p>
      </div>
    </div>
  );
}

export default Display;
