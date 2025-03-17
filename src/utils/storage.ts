import { AppState, AttendanceType } from '../types';
import { supabase } from './supabase';
import { z } from 'zod';

// Esquemas de validación
const PatientSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
  created_at: z.string().datetime()
});

const AttendanceSchema = z.object({
  id: z.string().uuid(),
  patient_id: z.string().uuid(),
  date: z.string().datetime(),
  type: z.nativeEnum(AttendanceType),
  status: z.enum(['present', 'absent', 'holiday', 'my_absence']).nullable(),
  amount: z.number(),
  paid: z.boolean(),
  notes: z.string().optional()
});

// Clase de error personalizado
class StorageError extends Error {
  constructor(
    message: string, 
    public code: string = 'STORAGE_ERROR',
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

// Error codes for specific error types
const ERROR_CODES = {
  VALIDATION: 'VALIDATION_ERROR',
  NETWORK: 'NETWORK_ERROR', 
  DATABASE: 'DATABASE_ERROR',
  SYNC: 'SYNC_ERROR'
} as const;

export const saveState = async (state: AppState): Promise<void> => {
  try {
    // Validar y preparar datos de pacientes
    const patientsData = state.patients.map(p => ({
      ...PatientSchema.parse({
        ...p,
        created_at: new Date().toISOString()
      }),
      attendance: undefined // Excluir relaciones
    }));

    // Upsert pacientes
    const { error: patientsError } = await supabase
      .from('patients')
      .upsert(patientsData);

    if (patientsError) throw new StorageError('Error saving patients', ERROR_CODES.DATABASE, patientsError);

    // Preparar registros de asistencia
    const attendanceRecords = state.patients.flatMap(p =>
      p.attendance.map(a => AttendanceSchema.parse({
        ...a,
        patient_id: p.id,
        date: new Date(a.date).toISOString()
      }))
    );

    // Upsert asistencias
    const { error: attendanceError } = await supabase
      .from('attendance')
      .upsert(attendanceRecords);

    if (attendanceError) throw new StorageError('Error saving attendance', ERROR_CODES.DATABASE, attendanceError);

  } catch (err) {
    console.error('[Storage] Error saving state:', err);
    throw err;
  }
};

export const loadState = async (): Promise<AppState> => {
  try {
    // Cargar pacientes
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: true });

    if (patientsError) throw new StorageError('Error loading patients', ERROR_CODES.DATABASE, patientsError);
    const validatedPatients = z.array(PatientSchema).parse(patients);

    // Cargar asistencias
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .order('date', { ascending: true });

    if (attendanceError) throw new StorageError('Error loading attendance', ERROR_CODES.DATABASE, attendanceError);
    const validatedAttendance = z.array(AttendanceSchema).parse(attendance);

    // Combinar datos
    const combinedData = validatedPatients.map(p => ({
      ...p,
      attendance: validatedAttendance
        .filter(a => a.patient_id === p.id)
        .map(a => ({
          ...a,
          date: new Date(a.date).toISOString(),
          type: a.type as AttendanceType,
          status: a.status,
          amount: a.amount,
          paid: a.paid
        }))
    }));

    return {
      patients: combinedData,
      darkMode: true, // Tema oscuro por defecto
      syncStatus: 'success'
    };

  } catch (err) {
    console.error('[Storage] Error loading state:', err);
    throw err;
  }
};

// Sincronización en tiempo real
export const subscribeToChanges = (callback: (state: AppState) => void) => {
  const channel = supabase
    .channel('db-changes')
    .on('postgres_changes', { event: '*', schema: 'public' }, async () => {
      try {
        const newState = await loadState();
        callback(newState);
      } catch (err) {
        console.error('[Storage] Sync error:', err);
      }
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
};

// Manejo del tema oscuro con fallback a localStorage
export const getDarkModePreference = (): boolean => {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  }
  return true;
};

export const persistDarkMode = (isDark: boolean): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('darkMode', JSON.stringify(isDark));
  }
};
