import type {
  AppointmentRepository,
  DoctorRepository,
  OrganizationBillingRepository,
  PatientRepository,
  UnitRepository,
} from "../../domain/repositories";

export type OverviewKPIs = {
  totalPatients: number;
  totalDoctors: number;
  totalUnits: number;
  appointmentsToday: number;
  appointmentsThisWeek: number;
};

export type OverviewAppointmentsByWorkflowStatus = { workflowStatus: string; count: number }[];

export type OverviewAppointmentsByDay = { date: string; count: number }[];

export type OverviewUpcomingItem = {
  id: string;
  patientName: string;
  doctorName: string;
  scheduledAt: string;
  unitName: string | null;
};

export type OverviewBilling = {
  status: string;
  validUntil: string | null;
  planId: string | null;
} | null;

export type OverviewStats = {
  kpis: OverviewKPIs;
  appointmentsByWorkflowStatus: OverviewAppointmentsByWorkflowStatus;
  appointmentsByDay: OverviewAppointmentsByDay;
  upcomingAppointments: OverviewUpcomingItem[];
  billing: OverviewBilling;
};

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export class OverviewService {
  constructor(
    private patients: PatientRepository,
    private doctors: DoctorRepository,
    private units: UnitRepository,
    private appointments: AppointmentRepository,
    private organizationBilling: OrganizationBillingRepository,
  ) {}

  async getStats(organizationId: string, unitId: string | null): Promise<OverviewStats> {
    const [patients, doctors, units, appointments, billing] = await Promise.all([
      this.patients.listByOrganization(organizationId, unitId),
      this.doctors.listByOrganization(organizationId, unitId),
      this.units.listByOrganization(organizationId),
      this.appointments.listByOrganization(organizationId, unitId),
      this.organizationBilling.getByOrganizationId(organizationId),
    ]);

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfDay(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));

    const appointmentsToday = appointments.filter(
      a => a.scheduledAt >= todayStart && a.scheduledAt <= todayEnd,
    ).length;
    const appointmentsThisWeek = appointments.filter(a => a.scheduledAt >= weekStart && a.scheduledAt <= todayEnd).length;

    const byWorkflow: Record<string, number> = {};
    for (const a of appointments) {
      const s = a.workflowStatus ?? "AGUARDANDO";
      byWorkflow[s] = (byWorkflow[s] ?? 0) + 1;
    }
    const appointmentsByWorkflowStatus = Object.entries(byWorkflow).map(([workflowStatus, count]) => ({
      workflowStatus,
      count,
    }));

    const last14Days: OverviewAppointmentsByDay = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      const dayStart = startOfDay(d);
      const dayEnd = endOfDay(d);
      const count = appointments.filter(
        a => a.scheduledAt >= dayStart && a.scheduledAt <= dayEnd,
      ).length;
      last14Days.push({ date: key, count });
    }

    const futureAppointments = appointments
      .filter(a => a.scheduledAt >= now)
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
      .slice(0, 5);

    const patientById = new Map(patients.map(p => [p.id, p]));
    const doctorById = new Map(doctors.map(d => [d.id, d]));
    const unitById = new Map(units.map(u => [u.id, u]));

    const upcomingAppointments: OverviewUpcomingItem[] = futureAppointments.map(a => ({
      id: a.id,
      patientName: patientById.get(a.patientId)?.name ?? "—",
      doctorName: doctorById.get(a.doctorId)?.name ?? "—",
      scheduledAt: a.scheduledAt.toISOString(),
      unitName: a.unitId ? unitById.get(a.unitId)?.name ?? null : null,
    }));

    return {
      kpis: {
        totalPatients: patients.length,
        totalDoctors: doctors.length,
        totalUnits: units.length,
        appointmentsToday,
        appointmentsThisWeek,
      },
      appointmentsByWorkflowStatus,
      appointmentsByDay: last14Days,
      upcomingAppointments,
      billing: billing
        ? {
            status: billing.status,
            validUntil: billing.validUntil ? billing.validUntil.toISOString() : null,
            planId: billing.planId ?? null,
          }
        : null,
    };
  }
}
