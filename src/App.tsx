import React, { useEffect, useState } from "react";
import { Plus, Moon, Sun, Search, Download, Upload } from "lucide-react";
import { AppState, DashboardStats, Patient, AttendanceRecord } from "./types";
import { PatientRow } from "./components/PatientRow";
import { Dashboard } from "./components/Dashboard";
import { AddPatientModal } from "./components/AddPatientModal";
import { ChatAssistant } from "./components/ChatAssistant";
import { loadState, saveState } from "./utils/storage";

function App() {
  const [state, setState] = useState<AppState>(() => {
    const savedState = loadState();
    if (savedState) {
      return {
        ...savedState,
        patients: savedState.patients.map(patient => ({
          ...patient,
          attendance: patient.attendance.map(record => ({
            ...record,
              status: record.status
          }))
        }))
      };
    }
    return {
      patients: [],
      darkMode: false,
    };
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const localData = loadState();
    if (localData) {
      setState(localData);
    }
  }, []);

  useEffect(() => {
    saveState(state);
    if (state.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [state]);

  const calculateStats = (): DashboardStats => {
    let totalAttendances = 0;
    let totalAbsences = 0;
    let totalHolidays = 0;
    let totalMyAbsences = 0;
    let totalBilled = 0;
    let totalCollected = 0;
    let pendingPayments = 0;

    state.patients.forEach((patient) => {
      patient.attendance.forEach((record) => {
        if (record.status === "present") totalAttendances++;
        if (record.status === "absent") totalAbsences++;
        if (record.status === "holiday") totalHolidays++;
        if (record.status === "my_absence") totalMyAbsences++;
        if (record.amount) {
          totalBilled += record.amount;
          if (record.paid) {
            totalCollected += record.amount;
          } else {
            pendingPayments++;
          }
        }
      });
    });

    const totalRecords = totalAttendances + totalAbsences + totalHolidays + totalMyAbsences;
    const attendanceRate = totalRecords
      ? (totalAttendances / totalRecords) * 100
      : 0;
    const paymentRate = totalBilled ? (totalCollected / totalBilled) * 100 : 0;

    return {
      totalPatients: state.patients.length,
      totalAttendances,
      totalAbsences,
      totalHolidays,
      totalMyAbsences,
      pendingPayments,
      totalBilled,
      totalCollected,
      pendingCollection: totalBilled - totalCollected,
      attendanceRate,
      paymentRate,
    };
  };

  const addPatient = (name: string) => {
    const newPatient: Patient = {
      id: crypto.randomUUID(),
      name,
      attendance: [],
    };

    setState((prev) => ({
      ...prev,
      patients: [...prev.patients, newPatient],
    }));
  };

  const deletePatient = (patientId: string) => {
    if (!confirm("¿Está seguro de eliminar este paciente?")) return;

    setState((prev) => ({
      ...prev,
      patients: prev.patients.filter((p) => p.id !== patientId),
    }));
  };

  const toggleAttendance = (patientId: string, attendanceId: string, status: "present" | "absent" | "holiday" | "my_absence" | null) => {
    setState((prev: AppState) => ({
      ...prev,
      patients: prev.patients.map((patient) => {
        if (patient.id !== patientId) return patient;

        return {
          ...patient,
          attendance: patient.attendance.map((record) => {
            if (record.id !== attendanceId) return record;

            return { ...record, status } as AttendanceRecord;
          }),
        };
      }),
    }));
  };

  const addAttendance = (patientId: string) => {
    setState((prev) => ({
      ...prev,
      patients: prev.patients.map((patient) => {
        if (patient.id !== patientId) return patient;

        return {
          ...patient,
          attendance: [
            ...patient.attendance,
            {
              id: crypto.randomUUID(),
              date: new Date().toISOString(),
              status: null,
              amount: 0,
              paid: false,
            },
          ],
        };
      }),
    }));
  };

  const deleteAttendance = (patientId: string, attendanceId: string) => {
    setState((prev) => ({
      ...prev,
      patients: prev.patients.map((patient) => {
        if (patient.id !== patientId) return patient;

        return {
          ...patient,
          attendance: patient.attendance.filter(
            (record) => record.id !== attendanceId,
          ),
        };
      }),
    }));
  };

  const togglePaid = (patientId: string, attendanceId: string) => {
    setState((prev) => ({
      ...prev,
      patients: prev.patients.map((patient) => {
        if (patient.id !== patientId) return patient;

        return {
          ...patient,
          attendance: patient.attendance.map((record) => {
            if (record.id !== attendanceId) return record;
            return { ...record, paid: !record.paid };
          }),
        };
      }),
    }));
  };

  const updateAmount = (
    patientId: string,
    attendanceId: string,
    amount: number,
  ) => {
    setState((prev) => ({
      ...prev,
      patients: prev.patients.map((patient) => {
        if (patient.id !== patientId) return patient;

        return {
          ...patient,
          attendance: patient.attendance.map((record) => {
            if (record.id !== attendanceId) return record;
            return { ...record, amount };
          }),
        };
      }),
    }));
  };

  const updateDate = (
    patientId: string,
    attendanceId: string,
    date: string,
  ) => {
    setState((prev) => ({
      ...prev,
      patients: prev.patients.map((patient) => {
        if (patient.id !== patientId) return patient;

        return {
          ...patient,
          attendance: patient.attendance.map((record) => {
            if (record.id !== attendanceId) return record;
            return { ...record, date };
          }),
        };
      }),
    }));
  };

  const toggleDarkMode = () => {
    setState((prev) => ({
      ...prev,
      darkMode: !prev.darkMode,
    }));
  };

  const exportData = () => {
    const dataStr = JSON.stringify(state.patients);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "pacientes.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const patients = JSON.parse(e.target?.result as string);
        setState((prev) => ({
          ...prev,
          patients,
        }));
      } catch {
        alert("Error al importar el archivo");
      }
    };
    reader.readAsText(file);
  };

  const filteredPatients = state.patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        state.darkMode ? "bg-[#121212]" : "bg-gray-50"
      }`}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Patient Management Section */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h1
                className={`text-2xl font-bold transition-colors duration-300 ${
                  state.darkMode ? "text-white" : "text-gray-900"
                }`}
              ></h1>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  className={`p-2 rounded-xl cursor-pointer transition-colors duration-300 ${
                    state.darkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                  title="Importar datos"
                >
                  <Upload size={20} />
                </label>
                <button
                  onClick={exportData}
                  className={`p-2 rounded-xl transition-colors duration-300 ${
                    state.darkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                  title="Exportar datos"
                >
                  <Download size={20} />
                </button>
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-xl transition-colors duration-300 ${
                    state.darkMode
                      ? "bg-gray-800 text-yellow-400 hover:bg-gray-700"
                      : "bg-white text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  {state.darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-300"
                >
                  <Plus size={20} />
                  <span>Agregar Paciente</span>
                </button>
              </div>
            </div>

            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Buscar paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl border transition-colors duration-300 ${
                  state.darkMode
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
              <Search
                size={20}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  state.darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              />
            </div>

            <div className="space-y-4">
              {filteredPatients.map((patient) => (
                <PatientRow
                  key={patient.id}
                  patient={patient}
                  onToggleAttendance={toggleAttendance}
                  onAddAttendance={addAttendance}
                  onDeletePatient={deletePatient}
                  onTogglePaid={togglePaid}
                  onDeleteAttendance={deleteAttendance}
                  onUpdateAmount={updateAmount}
                  onUpdateDate={updateDate}
                  darkMode={state.darkMode}
                />
              ))}

              {filteredPatients.length === 0 && (
                <div
                  className={`text-center py-8 transition-colors duration-300 ${
                    state.darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {searchTerm
                    ? "No se encontraron pacientes con ese nombre."
                    : "No hay pacientes registrados. Agregue uno para comenzar."}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-full md:w-[400px] space-y-6">
            {/* Dashboard */}
            <Dashboard stats={calculateStats()} darkMode={state.darkMode} />

            {/* Google Calendar */}
            <div
              className={`h-[500px] p-4 rounded-xl transition-all duration-300 ${
                state.darkMode ? "bg-gray-800" : "bg-white"
              } shadow-lg`}
            >
              <h2
                className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                  state.darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Calendario
              </h2>
              <div className="h-[calc(100%-2.5rem)]">
                <iframe
                  src="https://calendar.google.com/calendar/embed?src=julietazimarino%40gmail.com&ctz=America%2FArgentina%2FBuenos_Aires"
                  className="w-full h-full rounded-lg border-0"
                  style={{ filter: state.darkMode ? "invert(1)" : "none" }}
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AddPatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addPatient}
        darkMode={state.darkMode}
      />
      <ChatAssistant state={state} />
    </div>
  );
}

export default App;
