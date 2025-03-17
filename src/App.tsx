import React, { useEffect, useState } from "react";
import { Plus, Moon, Sun, Search, Download, Upload } from "lucide-react";
import { AppState, DashboardStats, Patient, AttendanceRecord } from "./types";
import { PatientRow } from "./components/PatientRow";
import { Dashboard } from "./components/Dashboard";
import { AddPatientModal } from "./components/AddPatientModal";
import { ChatAssistant } from "./components/ChatAssistant";
import { supabase } from "./utils/supabase";
import { loadState, saveState } from "./utils/storage";

function App() {
  const [state, setState] = useState<AppState>(() => {
    return (
      loadState() || {
        patients: [],
        darkMode: false,
      }
    );
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const uploadLocalDataToSupabase = async (patients: Patient[]) => {
    try {
      await supabase.from("patients").delete().neq("id", "");

      for (const patient of patients) {
        const { error } = await supabase.from("patients").insert({
          id: patient.id,
          name: patient.name,
          attendance: patient.attendance as AttendanceRecord[],
        });

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error uploading to Supabase:", error);
    }
  };

  useEffect(() => {
    const syncWithSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from("patients")
          .select("*")
          .order("updated_at", { ascending: false });

        if (error) throw error;

        if (data) {
          const localData = loadState();
          if (localData && localData.patients.length > 0) {
            await uploadLocalDataToSupabase(localData.patients);
          } else if (data.length > 0) {
            const typedData = data as Patient[];
            setState((prev) => ({
              ...prev,
              patients: typedData,
            }));
            saveState({
              ...state,
              patients: typedData,
            });
          }
        }
      } catch (error) {
        console.error("Error syncing with Supabase:", error);
      }
    };

    syncWithSupabase();
  }, [state]);

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

    const totalRecords = totalAttendances + totalAbsences;
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

  const updatePatientInSupabase = async (patient: Patient) => {
    try {
      const { error } = await supabase
        .from("patients")
        .update({
          name: patient.name,
          attendance: patient.attendance as AttendanceRecord[],
          updated_at: new Date().toISOString(),
        })
        .eq("id", patient.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating patient in Supabase:", error);
    }
  };

  const addPatient = async (name: string) => {
    const newPatient: Patient = {
      id: crypto.randomUUID(),
      name,
      attendance: [],
    };

    setState((prev) => ({
      ...prev,
      patients: [...prev.patients, newPatient],
    }));

    try {
      const { error } = await supabase.from("patients").insert(newPatient);

      if (error) throw error;
    } catch (error) {
      console.error("Error adding patient to Supabase:", error);
    }
  };

  const deletePatient = async (patientId: string) => {
    if (!confirm("¿Está seguro de eliminar este paciente?")) return;

    setState((prev) => ({
      ...prev,
      patients: prev.patients.filter((p) => p.id !== patientId),
    }));

    try {
      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("id", patientId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting patient from Supabase:", error);
    }
  };

  const toggleAttendance = async (patientId: string, attendanceId: string) => {
    setState((prev: AppState) => {
      const newState: AppState = {
        ...prev,
        patients: prev.patients.map((patient) => {
          if (patient.id !== patientId) return patient;

          const updatedPatient: Patient = {
            ...patient,
            attendance: patient.attendance.map((record) => {
              if (record.id !== attendanceId) return record;

              const statusOrder = ['present', 'absent', 'holiday', 'my_absence', null];
              const currentIndex = statusOrder.indexOf(record.status);
              const nextIndex = (currentIndex + 1) % statusOrder.length;
              const nextStatus = statusOrder[nextIndex];

              return { ...record, status: nextStatus } as AttendanceRecord;
            }),
          };

          updatePatientInSupabase(updatedPatient);
          return updatedPatient;
        }),
      };
      return newState;
    });
  };

  const addAttendance = async (patientId: string) => {
    setState((prev) => {
      const newState = {
        ...prev,
        patients: prev.patients.map((patient) => {
          if (patient.id !== patientId) return patient;

          const updatedPatient = {
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

          updatePatientInSupabase(updatedPatient);
          return updatedPatient;
        }),
      };
      return newState;
    });
  };

  const deleteAttendance = async (patientId: string, attendanceId: string) => {
    setState((prev) => {
      const newState = {
        ...prev,
        patients: prev.patients.map((patient) => {
          if (patient.id !== patientId) return patient;

          const updatedPatient = {
            ...patient,
            attendance: patient.attendance.filter(
              (record) => record.id !== attendanceId,
            ),
          };

          updatePatientInSupabase(updatedPatient);
          return updatedPatient;
        }),
      };
      return newState;
    });
  };

  const togglePaid = async (patientId: string, attendanceId: string) => {
    setState((prev) => {
      const newState = {
        ...prev,
        patients: prev.patients.map((patient) => {
          if (patient.id !== patientId) return patient;

          const updatedPatient = {
            ...patient,
            attendance: patient.attendance.map((record) => {
              if (record.id !== attendanceId) return record;
              return { ...record, paid: !record.paid };
            }),
          };

          updatePatientInSupabase(updatedPatient);
          return updatedPatient;
        }),
      };
      return newState;
    });
  };

  const updateAmount = async (
    patientId: string,
    attendanceId: string,
    amount: number,
  ) => {
    setState((prev) => {
      const newState = {
        ...prev,
        patients: prev.patients.map((patient) => {
          if (patient.id !== patientId) return patient;

          const updatedPatient = {
            ...patient,
            attendance: patient.attendance.map((record) => {
              if (record.id !== attendanceId) return record;
              return { ...record, amount };
            }),
          };

          updatePatientInSupabase(updatedPatient);
          return updatedPatient;
        }),
      };
      return newState;
    });
  };

  const updateDate = async (
    patientId: string,
    attendanceId: string,
    date: string,
  ) => {
    setState((prev) => {
      const newState = {
        ...prev,
        patients: prev.patients.map((patient) => {
          if (patient.id !== patientId) return patient;

          const updatedPatient = {
            ...patient,
            attendance: patient.attendance.map((record) => {
              if (record.id !== attendanceId) return record;
              return { ...record, date };
            }),
          };

          updatePatientInSupabase(updatedPatient);
          return updatedPatient;
        }),
      };
      return newState;
    });
  };

  const toggleDarkMode = async () => {
    setState((prev) => ({
      ...prev,
      darkMode: !prev.darkMode,
    }));

    try {
      const { error } = await supabase
        .from("settings")
        .upsert({ key: "darkMode", value: !state.darkMode });

      if (error) throw error;
    } catch (error) {
      console.error("Error saving dark mode:", error);
    }
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

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const patients = JSON.parse(e.target?.result as string);
        setState((prev) => ({
          ...prev,
          patients,
        }));
        await uploadLocalDataToSupabase(patients);
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
