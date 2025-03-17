import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
  darkMode: boolean;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  darkMode,
}) => {
  const [name, setName] = useState("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm ${isOpen ? '' : 'pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md rounded-2xl p-6 shadow-xl animate-modal-appear ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <button
          onClick={onClose}
          className={`absolute right-4 top-4 p-1 rounded-lg transition-colors ${
            darkMode
              ? "text-gray-400 hover:bg-gray-700"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          <X size={20} />
        </button>

        <h2
          className={`text-xl font-semibold mb-4 ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Agregar Nuevo Paciente
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="patientName"
              className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Nombre del Paciente
            </label>
            <input
              id="patientName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ingrese el nombre completo"
              className={`w-full px-4 py-2 rounded-xl border transition-colors ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              autoFocus
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl transition-colors ${
                darkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className={`px-4 py-2 rounded-xl bg-blue-600 text-white transition-colors ${
                name.trim()
                  ? "hover:bg-blue-700"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
