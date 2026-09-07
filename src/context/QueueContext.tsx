import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { ActiveCall, Clinic, Patient, Ticket } from '../types/queue';
import { supabase } from '../config/supabase';

interface QueueContextValue {
  clinics: Clinic[];
  patients: Patient[];
  tickets: Ticket[];
  currentPatients: Record<string, Ticket | null>;
  activeCalls: ActiveCall[];

  issueTicket: (
    patientName: string,
    clinicId: string
  ) => Promise<Ticket | null>;

  callNext: (clinicId: string) => Promise<Ticket | null>;

  recallPatient: (ticketId: string) => ActiveCall | null;

  skipPatient: (ticketId: string) => Promise<void>;
  completePatient: (ticketId: string) => Promise<void>;

  getClinicById: (clinicId: string) => Clinic | undefined;
  getClinicTickets: (clinicId: string) => Ticket[];
  getWaitingTickets: (clinicId: string) => Ticket[];
}

const DISPLAY_DURATION = 3 * 60 * 1000;

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const QueueContext = createContext<QueueContextValue | undefined>(undefined);

export function QueueProvider({ children }: { children: ReactNode }) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [patients, _setPatients] = useState<Patient[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const [currentPatients, setCurrentPatients] = useState<
    Record<string, Ticket | null>
  >({});

  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);

  /*
   * ============================================================
   * تحميل العيادات
   * ============================================================
   */
  const loadClinics = useCallback(async () => {
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('is_active', true)
      .order('room_number');

    if (error) {
      console.error('فشل تحميل العيادات:', error);
      return;
    }

    const formattedClinics: Clinic[] = (data ?? []).map((clinic: any) => ({
      id: clinic.id,
      name: clinic.name,
      roomNumber: String(clinic.room_number),
      prefix: clinic.prefix,
      isActive: clinic.is_active,
    }));

    setClinics(formattedClinics);
  }, []);

  /*
   * ============================================================
   * تحويل سجل التذكرة إلى Ticket
   * ============================================================
   */
  const formatTicket = useCallback((ticket: any): Ticket => {
    return {
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      patientId: ticket.patient_id,
      patientName: ticket.patients?.name ?? '',
      clinicId: ticket.clinic_id,
      clinicName: ticket.clinics?.name ?? '',
      roomNumber: String(ticket.clinics?.room_number ?? ''),
      status: ticket.status,
      createdAt: new Date(ticket.created_at).getTime(),
      calledAt: ticket.called_at
        ? new Date(ticket.called_at).getTime()
        : undefined,
      completedAt: ticket.completed_at
        ? new Date(ticket.completed_at).getTime()
        : undefined,
    };
  }, []);

  /*
   * ============================================================
   * تحميل جميع التذاكر
   * ============================================================
   */
  const loadTickets = useCallback(async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select(
        `
        id,
        ticket_number,
        patient_id,
        clinic_id,
        status,
        created_at,
        called_at,
        completed_at,
        clinics (
          name,
          room_number
        ),
        patients (
          name
        )
      `
      )
      .order('created_at', { ascending: true });

    if (error) {
      console.error('فشل تحميل التذاكر:', error);
      return;
    }

    setTickets((data ?? []).map(formatTicket));
  }, [formatTicket]);

  /*
   * ============================================================
   * جلب تذكرة واحدة
   * ============================================================
   */
  const loadSingleTicket = useCallback(
    async (ticketId: string): Promise<Ticket | null> => {
      const { data, error } = await supabase
        .from('tickets')
        .select(
          `
          id,
          ticket_number,
          patient_id,
          clinic_id,
          status,
          created_at,
          called_at,
          completed_at,
          clinics (
            name,
            room_number
          ),
          patients (
            name
          )
        `
        )
        .eq('id', ticketId)
        .single();

      if (error) {
        console.error('فشل تحميل التذكرة:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return formatTicket(data);
    },
    [formatTicket]
  );

  /*
   * ============================================================
   * التحميل الأولي
   * ============================================================
   */
  useEffect(() => {
    void loadClinics();
    void loadTickets();
  }, [loadClinics, loadTickets]);

  /*
   * ============================================================
   * Supabase Realtime
   * ============================================================
   */
  useEffect(() => {
    let mounted = true;

    const channel = supabase
      .channel('tickets-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tickets',
        },
        async (payload) => {
          const ticketId = payload.new?.id;

          if (!ticketId || !mounted) {
            return;
          }

          const newTicket = await loadSingleTicket(ticketId);

          if (!newTicket || !mounted) {
            return;
          }

          setTickets((prev) => {
            const exists = prev.some((ticket) => ticket.id === newTicket.id);

            if (exists) {
              return prev.map((ticket) =>
                ticket.id === newTicket.id ? newTicket : ticket
              );
            }

            return [...prev, newTicket].sort(
              (a, b) => a.createdAt - b.createdAt
            );
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
        },
        async (payload) => {
          const ticketId = payload.new?.id;

          if (!ticketId || !mounted) {
            return;
          }

          const updatedTicket = await loadSingleTicket(ticketId);

          if (!updatedTicket || !mounted) {
            return;
          }

          setTickets((prev) => {
            const exists = prev.some(
              (ticket) => ticket.id === updatedTicket.id
            );

            if (!exists) {
              return [...prev, updatedTicket].sort(
                (a, b) => a.createdAt - b.createdAt
              );
            }

            return prev.map((ticket) =>
              ticket.id === updatedTicket.id ? updatedTicket : ticket
            );
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tickets',
        },
        (payload) => {
          const ticketId = payload.old?.id;

          if (!ticketId || !mounted) {
            return;
          }

          setTickets((prev) => prev.filter((ticket) => ticket.id !== ticketId));

          setCurrentPatients((prev) => {
            const next = { ...prev };

            Object.keys(next).forEach((clinicId) => {
              if (next[clinicId]?.id === ticketId) {
                next[clinicId] = null;
              }
            });

            return next;
          });
        }
      )
      .subscribe((status) => {
        console.log('Realtime tickets status:', status);
      });

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [loadSingleTicket]);

  /*
   * ============================================================
   * إصدار تذكرة جديدة
   * ============================================================
   */
  const issueTicket = useCallback(
    async (patientName: string, clinicId: string) => {
      const cleanName = patientName.trim();
      if (!cleanName || !clinicId) return null;
  
      const { data, error } = await supabase.rpc('issue_ticket', {
        p_patient_name: cleanName,
        p_clinic_id: clinicId,
      });
  
      if (error) {
        alert('خطأ Supabase: ' + error.message);
        return null;
      }
  
      if (!data) {
        alert('لم يتم إرجاع بيانات التذكرة من السيرفر');
        return null;
      }
  
      const ticket = Array.isArray(data) ? data[0] : data;
  
      const clinic = clinics.find((item) => item.id === ticket.clinic_id);
  
      if (!clinic) {
        alert('قائمة العيادات فارغة محلياً (clinics empty)!');
        return null;
      }

      const newTicket: Ticket = {
        id: ticket.id,
        ticketNumber: ticket.ticket_number,
        patientId: ticket.patient_id,
        patientName: cleanName,
        clinicId: ticket.clinic_id,
        clinicName: clinic.name,
        roomNumber: clinic.roomNumber,
        status: ticket.status,
        createdAt: new Date(ticket.created_at).getTime(),
        calledAt: ticket.called_at
          ? new Date(ticket.called_at).getTime()
          : undefined,
        completedAt: ticket.completed_at
          ? new Date(ticket.completed_at).getTime()
          : undefined,
      };

      setTickets((prev) => {
        const exists = prev.some((item) => item.id === newTicket.id);

        if (exists) {
          return prev.map((item) =>
            item.id === newTicket.id ? newTicket : item
          );
        }

        return [...prev, newTicket].sort((a, b) => a.createdAt - b.createdAt);
      });

      return newTicket;
    },
    [clinics]
  );

  /*
   * ============================================================
   * إنشاء استدعاء
   * ============================================================
   */
  const createActiveCall = useCallback((ticket: Ticket) => {
    const now = Date.now();

    const activeCall: ActiveCall = {
      id: createId('call'),
      clinicId: ticket.clinicId,
      clinicName: ticket.clinicName,
      roomNumber: ticket.roomNumber,
      ticketNumber: ticket.ticketNumber,
      patientName: ticket.patientName,
      calledAt: now,
      expiresAt: now + DISPLAY_DURATION,
    };

    setActiveCalls((prev) => [...prev, activeCall]);

    return activeCall;
  }, []);

  /*
   * ============================================================
   * استدعاء الرقم التالي
   * ============================================================
   */
  const callNext = useCallback(
    async (clinicId: string): Promise<Ticket | null> => {
      const waitingTicket = tickets
        .filter(
          (ticket) =>
            ticket.clinicId === clinicId && ticket.status === 'waiting'
        )
        .sort((a, b) => a.createdAt - b.createdAt)[0];

      if (!waitingTicket) {
        return null;
      }

      const now = new Date();

      const { data: updatedRow, error } = await supabase
        .from('tickets')
        .update({
          status: 'called',
          called_at: now.toISOString(),
        })
        .eq('id', waitingTicket.id)
        .select()
        .single();

      if (error) {
        console.error('فشل تحديث حالة التذكرة إلى called:', error);
        return null;
      }

      if (!updatedRow) {
        console.error('لم يتم العثور على التذكرة لتحديثها:', waitingTicket.id);
        return null;
      }

      const updatedTicket: Ticket = {
        ...waitingTicket,
        status: 'called',
        calledAt: updatedRow.called_at
          ? new Date(updatedRow.called_at).getTime()
          : now.getTime(),
      };

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === waitingTicket.id ? updatedTicket : ticket
        )
      );

      setCurrentPatients((prev) => ({
        ...prev,
        [clinicId]: updatedTicket,
      }));

      createActiveCall(updatedTicket);

      return updatedTicket;
    },
    [tickets, createActiveCall]
  );

  /*
   * ============================================================
   * إعادة النداء
   * ============================================================
   */
  const recallPatient = useCallback(
    (ticketId: string) => {
      const ticket = tickets.find((item) => item.id === ticketId);

      if (!ticket) {
        return null;
      }

      return createActiveCall(ticket);
    },
    [tickets, createActiveCall]
  );

  /*
   * ============================================================
   * تخطي المراجع
   * ============================================================
   */
  const skipPatient = useCallback(async (ticketId: string): Promise<void> => {
    const { error } = await supabase
      .from('tickets')
      .update({
        status: 'skipped',
      })
      .eq('id', ticketId);

    if (error) {
      console.error('فشل تخطي التذكرة:', error);
      return;
    }

    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              status: 'skipped',
            }
          : ticket
      )
    );

    setCurrentPatients((prev) => {
      const next = { ...prev };

      Object.keys(next).forEach((clinicId) => {
        if (next[clinicId]?.id === ticketId) {
          next[clinicId] = null;
        }
      });

      return next;
    });
  }, []);

  /*
   * ============================================================
   * إنهاء الزيارة
   * ============================================================
   */
  const completePatient = useCallback(
    async (ticketId: string): Promise<void> => {
      const now = new Date();

      const { error } = await supabase
        .from('tickets')
        .update({
          status: 'completed',
          completed_at: now.toISOString(),
        })
        .eq('id', ticketId);

      if (error) {
        console.error('فشل إنهاء التذكرة:', error);
        return;
      }

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                status: 'completed',
                completedAt: now.getTime(),
              }
            : ticket
        )
      );

      setCurrentPatients((prev) => {
        const next = { ...prev };

        Object.keys(next).forEach((clinicId) => {
          if (next[clinicId]?.id === ticketId) {
            next[clinicId] = null;
          }
        });

        return next;
      });
    },
    []
  );

  /*
   * ============================================================
   * تنظيف الاستدعاءات المنتهية
   * ============================================================
   */
  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();

      setActiveCalls((prev) => prev.filter((call) => call.expiresAt > now));
    }, 500);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  /*
   * ============================================================
   * تنظيف المراجع الحاليين
   * ============================================================
   */
  useEffect(() => {
    const activeTicketIds = new Set(
      tickets
        .filter((ticket) => ticket.status === 'called')
        .map((ticket) => ticket.id)
    );

    setCurrentPatients((prev) => {
      let changed = false;
      const next = { ...prev };

      Object.keys(next).forEach((clinicId) => {
        const current = next[clinicId];

        if (current && !activeTicketIds.has(current.id)) {
          next[clinicId] = null;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [tickets]);

  /*
   * ============================================================
   * الحصول على العيادة
   * ============================================================
   */
  const getClinicById = useCallback(
    (clinicId: string) => {
      return clinics.find((clinic) => clinic.id === clinicId);
    },
    [clinics]
  );

  /*
   * ============================================================
   * تذاكر عيادة محددة
   * ============================================================
   */
  const getClinicTickets = useCallback(
    (clinicId: string) => {
      return tickets
        .filter((ticket) => ticket.clinicId === clinicId)
        .sort((a, b) => a.createdAt - b.createdAt);
    },
    [tickets]
  );

  /*
   * ============================================================
   * التذاكر المنتظرة فقط
   * ============================================================
   */
  const getWaitingTickets = useCallback(
    (clinicId: string) => {
      return getClinicTickets(clinicId).filter(
        (ticket) => ticket.status === 'waiting'
      );
    },
    [getClinicTickets]
  );

  const value = useMemo<QueueContextValue>(
    () => ({
      clinics,
      patients,
      tickets,
      currentPatients,
      activeCalls,

      issueTicket,
      callNext,
      recallPatient,
      skipPatient,
      completePatient,

      getClinicById,
      getClinicTickets,
      getWaitingTickets,
    }),
    [
      clinics,
      patients,
      tickets,
      currentPatients,
      activeCalls,
      issueTicket,
      callNext,
      recallPatient,
      skipPatient,
      completePatient,
      getClinicById,
      getClinicTickets,
      getWaitingTickets,
    ]
  );

  return (
    <QueueContext.Provider value={value}>{children}</QueueContext.Provider>
  );
}

export function useQueue() {
  const context = useContext(QueueContext);

  if (!context) {
    throw new Error('useQueue must be used inside QueueProvider');
  }

  return context;
}
