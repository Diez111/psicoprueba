export interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'holiday' | 'my_absence' | null; // No change needed - status already includes the required values
  amount: number;
  paid: boolean;
}

export interface Patient {
  id: string;
  name: string;
  attendance: AttendanceRecord[];
}

export interface AppState {
  patients: Patient[];
  darkMode: boolean;
  lastUpdate?: string; // Track last sync time
}

export interface DashboardStats {
  totalPatients: number;
  totalAttendances: number;
  totalAbsences: number;
  totalHolidays: number;
  totalMyAbsences: number;
  pendingPayments: number;
  totalBilled: number;
  totalCollected: number;
  pendingCollection: number;
  attendanceRate: number;
  paymentRate: number;
}
