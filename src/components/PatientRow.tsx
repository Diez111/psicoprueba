import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, Plus, Check, X, DollarSign, Calendar } from 'lucide-react';
import { Patient } from '../types';

interface PatientRowProps {
  patient: Patient;
  onToggleAttendance: (patientId: string, attendanceId: string) => void;
  // Ciclo de estados: present -> absent -> holiday -> my_absence -> null
  onAddAttendance: (patientId: string) => void;
  onDeletePatient: (patientId: string) => void;
  onTogglePaid: (patientId: string, attendanceId: string) => void;
  onDeleteAttendance: (patientId: string, attendanceId: string) => void;
  onUpdateAmount: (patientId: string, attendanceId: string, amount: number) => void;
  onUpdateDate: (patientId: string, attendanceId: string, date: string) => void;
  darkMode: boolean;
}

export const PatientRow: React.FC<PatientRowProps> = ({
  patient,
  onToggleAttendance,
  onAddAttendance,
  onDeletePatient,
  onTogglePaid,
  onDeleteAttendance,
  onUpdateAmount,
  onUpdateDate,
  darkMode,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, patientId: string, attendanceId: string) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    onUpdateAmount(patientId, attendanceId, Number(value));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, patientId: string, attendanceId: string) => {
    const date = new Date(e.target.value);
    if (!isNaN(date.getTime())) {
      onUpdateDate(patientId, attendanceId, date.toISOString());
    }
  };

  const formatDateForInput = (date: string) => {
    return new Date(date).toISOString().split('T')[0];
  };

  return (
    <div className={`rounded-xl overflow-hidden transition-all duration-300 ${
      darkMode ? 'bg-gray-800' : 'bg-white'
    } shadow-lg`}>
      <div 
        className={`flex items-center justify-between p-4 cursor-pointer transition-colors duration-300 ${
          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {patient.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddAttendance(patient.id);
            }}
            className={`p-1.5 rounded-lg transition-colors duration-300 ${
              darkMode 
                ? 'hover:bg-gray-600 text-gray-300' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Plus size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeletePatient(patient.id);
            }}
            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors duration-300"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={darkMode ? 'bg-gray-900/30' : 'bg-gray-50'}>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Fecha</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Asistencia</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Monto</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Estado</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {patient.attendance.map((record) => (
                  <tr 
                    key={record.id}
                    className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
                  >
                    <td className="px-4 py-2">
                      <input
                        type="date"
                        value={formatDateForInput(record.date)}
                        onChange={(e) => handleDateChange(e, patient.id, record.id)}
                        className={`rounded-lg border px-2 py-1 text-sm transition-colors duration-300 ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => onToggleAttendance(patient.id, record.id)}
                        className={`px-2 py-1 rounded-lg text-sm font-medium flex items-center gap-1 ${
                          record.status === 'present'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                            : record.status === 'absent'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                            : record.status === 'holiday'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                            : record.status === 'my_absence'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {record.status === 'present' && <Check size={14} />}
                        {record.status === 'absent' && <X size={14} />}
                        {record.status === 'holiday' && <Calendar size={14} />}
                        {record.status === 'my_absence' && <X size={14} />}
                        {record.status === 'present' ? 'Presente' : 
                         record.status === 'absent' ? 'Ausente' :
                         record.status === 'holiday' ? 'Feriado' :
                         record.status === 'my_absence' ? 'Ausencia mía' : 'Sin marcar'}
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <div className="relative">
                        <span className={`absolute left-2 top-1/2 -translate-y-1/2 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>$</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={record.amount || ''}
                          onChange={(e) => handleAmountChange(e, patient.id, record.id)}
                          className={`w-24 text-center rounded-lg border pl-6 pr-2 py-1 text-sm transition-colors duration-300 ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          } appearance-none`}
                          placeholder="Monto"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => onTogglePaid(patient.id, record.id)}
                        className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors duration-300 flex items-center gap-1 ${
                          record.paid
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400'
                        }`}
                      >
                        <DollarSign size={12} />
                        {record.paid ? 'Pagado' : 'Pendiente'}
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => onDeleteAttendance(patient.id, record.id)}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors duration-300"
                        title="Eliminar registro"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
