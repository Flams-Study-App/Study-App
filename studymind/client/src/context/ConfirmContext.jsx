import { createContext, useCallback, useContext, useState } from "react";
import { AlertTriangle } from "lucide-react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { title, message, resolve }

  const confirm = useCallback((title, message) => {
    return new Promise((resolve) => {
      setState({ title, message, resolve });
    });
  }, []);

  const handle = (result) => {
    state?.resolve(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass-panel p-6 max-w-sm w-full animate-in">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
              <AlertTriangle size={18} className="text-red-400" />
            </div>
            <p className="font-semibold mb-1.5">{state.title}</p>
            <p className="text-sm text-ink-500 mb-5">{state.message}</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => handle(false)} className="btn-ghost">Cancel</button>
              <button onClick={() => handle(true)} className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
