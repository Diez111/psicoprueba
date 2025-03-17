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
  phone?: string;
  email?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  attendance: AttendanceRecord[];
}

export enum AttendanceType {
  Presente = 'presente',
  Ausente = 'ausente',
  Feriado = 'feriado',
  AusenciaMia = 'ausencia_mia'
}

export interface AppState {
  patients: Patient[];
  darkMode: boolean;
  lastUpdate?: string;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncError?: string;
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
