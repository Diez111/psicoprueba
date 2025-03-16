import React from 'react';
import { Users, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { DashboardStats } from '../types';

interface DashboardProps {
  stats: DashboardStats;
  darkMode: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, darkMode }) => {
  const StatCard = ({ icon: Icon, title, value, color }: { icon: any, title: string, value: string | number, color: string }) => (
    <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
        <div>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
          <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-white'} shadow-lg`}>
      <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard</h2>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard 
          icon={Users} 
          title="Pacientes" 
          value={stats.totalPatients} 
          color="bg-blue-500"
        />
        <StatCard 
          icon={CheckCircle} 
          title="Asistencias" 
          value={stats.totalAttendances} 
          color="bg-green-500"
        />
        <StatCard 
          icon={XCircle} 
          title="Ausencias" 
          value={stats.totalAbsences} 
          color="bg-red-500"
        />
        <StatCard 
          icon={DollarSign} 
          title="Pagos Pendientes" 
          value={stats.pendingPayments} 
          color="bg-yellow-500"
        />
      </div>

      <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white/50'} mb-4 text-sm`}>
        <h3 className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Resumen Financiero
        </h3>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Total Facturado</span>
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              ${stats.totalBilled.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Total Cobrado</span>
            <span className="font-medium text-green-500">
              ${stats.totalCollected.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Pendiente de Cobro</span>
            <span className="font-medium text-yellow-500">
              ${stats.pendingCollection.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Estadísticas
        </h3>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between mb-1">
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Tasa de Asistencia
              </span>
              <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {stats.attendanceRate.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full">
              <div 
                className="h-1.5 bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${stats.attendanceRate}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Tasa de Cobro
              </span>
              <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {stats.paymentRate.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full">
              <div 
                className="h-1.5 bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${stats.paymentRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};