import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const accents = {
  success: "text-emerald-400 border-emerald-500/20",
  error: "text-red-400 border-red-500/20",
  info: "text-cyan border-cyan/20",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const toast = {
    success: (msg) => push(msg, "success"),
    error: (msg) => push(msg, "error"),
    info: (msg) => push(msg, "info"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-80 max-w-[90vw]">
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div key={t.id} className={`glass-panel px-4 py-3 flex items-start gap-3 border animate-in ${accents[t.type]}`}>
              <Icon size={17} className="shrink-0 mt-0.5" />
              <p className="text-sm text-ink-100 flex-1">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-ink-500 hover:text-ink-100 shrink-0">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
