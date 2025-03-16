import React, { useState, useEffect, useCallback } from "react";
import { MessageSquare, X, Loader2 } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: number;
}

interface AppState {
  patients: {
    id: string;
    name: string;
    attendance: {
      id: string;
      date: string;
      status: "present" | "absent" | null;
      amount: number;
      paid: boolean;
    }[];
  }[];
  darkMode: boolean;
}

export function ChatAssistant({ state }: { state: AppState }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const generateContextInfo = useCallback(() => {
    const stats = {
      totalPatients: state.patients.length,
      totalSessions: state.patients.reduce(
        (acc: number, p) => acc + p.attendance.length,
        0,
      ),
      attendanceStats: state.patients.reduce(
        (acc: { present?: number; absent?: number }, p) => {
          p.attendance.forEach((a) => {
            if (a.status === "present") acc.present = (acc.present || 0) + 1;
            if (a.status === "absent") acc.absent = (acc.absent || 0) + 1;
          });
          return acc;
        },
        {},
      ),
      payments: state.patients.reduce(
        (acc: { total: number; paid: number }, p) => {
          p.attendance.forEach((a) => {
            acc.total += a.amount;
            if (a.paid) acc.paid += a.amount;
          });
          return acc;
        },
        { total: 0, paid: 0 },
      ),
      patientDetails: state.patients.map((p) => ({
        name: p.name,
        totalSessions: p.attendance.length,
        attendance: {
          present: p.attendance.filter((a) => a.status === "present").length,
          absent: p.attendance.filter((a) => a.status === "absent").length,
        },
        payments: {
          total: p.attendance.reduce((acc: number, a) => acc + a.amount, 0),
          pending: p.attendance.reduce(
            (acc: number, a) => acc + (a.paid ? 0 : a.amount),
            0,
          ),
        },
        lastSession:
          p.attendance.length > 0
            ? new Date(
                p.attendance[p.attendance.length - 1].date,
              ).toLocaleDateString()
            : "N/A",
      })),
    };

    return stats;
  }, [state]);

  const sendMessage = useCallback(
    async (message: string) => {
      setIsLoading(true);

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "user",
        content: message,
        timestamp: Date.now(),
      };

      setMessages((prev: ChatMessage[]) => [...prev, userMessage]);

      try {
        const contextInfo = generateContextInfo();

        const response = await fetch(
          "https://api.llama-api.com/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: "Bearer 5cfd1923-0c68-4b7f-be86-ecf748c708c4",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messages: [
                {
                  role: "system",
                  content:
                    "Eres un asistente médico profesional que ayuda a gestionar pacientes y sus registros. Hablas siempre en español y te comunicas de manera formal y respetuosa.",
                },
                {
                  role: "assistant",
                  content: JSON.stringify({
                    context: contextInfo,
                    userMessage: message,
                    previousMessages: messages.slice(-5),
                  }),
                },
                {
                  role: "user",
                  content: message,
                },
              ],
              model: "llama3-8b",
              stream: false,
            }),
          },
        );

        if (!response.ok) {
          throw new Error("Error en la respuesta de la API");
        }

        const data = await response.json();

        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          sender: "ai",
          content: data.choices[0].message.content,
          timestamp: Date.now(),
        };

        setMessages((prev: ChatMessage[]) => [...prev, aiMessage]);
      } catch (error) {
        console.error("Error:", error);
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          sender: "ai",
          content: "Lo siento, hubo un error al procesar tu mensaje.",
          timestamp: Date.now(),
        };
        setMessages((prev: ChatMessage[]) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [generateContextInfo, messages],
  );

  return (
    <div className={`fixed z-50 ${isMobile ? "inset-0" : "bottom-4 right-4"}`}>
      {open ? (
        <div
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col ${
            isMobile ? "h-full w-full" : "w-96 h-[32rem]"
          }`}
        >
          <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
            <h3
              className={`font-medium ${state.darkMode ? "text-white" : "text-gray-900"}`}
            >
              Asistente Virtual
            </h3>
            <button
              onClick={() => setOpen(false)}
              className={`p-2 rounded-lg transition-colors ${
                state.darkMode
                  ? "hover:bg-gray-700 text-gray-400"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg: ChatMessage) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white"
                      : state.darkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <span className="text-xs opacity-70">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem(
                "message",
              ) as HTMLInputElement;
              if (input.value.trim()) {
                sendMessage(input.value.trim());
                input.value = "";
              }
            }}
            className="p-4 border-t dark:border-gray-700"
          >
            <div className="flex gap-2">
              <input
                name="message"
                type="text"
                placeholder="Escribe tu mensaje..."
                className={`flex-1 px-4 py-2 rounded-xl border ${
                  state.darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className={`p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors ${
            isMobile ? "fixed bottom-4 right-4" : ""
          }`}
        >
          <MessageSquare size={24} />
        </button>
      )}
    </div>
  );
}
