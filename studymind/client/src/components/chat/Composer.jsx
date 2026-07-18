import { useState, useRef } from "react";
import { Send, Sparkles, AlignLeft, GraduationCap } from "lucide-react";

const MODES = [
  { id: "concise", label: "Concise", icon: Sparkles },
  { id: "detailed", label: "Detailed", icon: GraduationCap },
  { id: "eli5", label: "ELI5", icon: AlignLeft },
];

export default function Composer({ onSend, disabled, mode, onModeChange }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  return (
    <div className="glass-panel p-2">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask your AI tutor anything... (Shift+Enter for a new line)"
          className="flex-1 bg-transparent resize-none outline-none text-sm px-3 py-2.5 placeholder:text-ink-500 max-h-40"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="btn-primary !px-3 !py-3 flex items-center justify-center shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
      <div className="flex items-center gap-1 px-1 pt-1">
        <span className="text-[11px] text-ink-500 mr-1">Style:</span>
        {MODES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onModeChange(id)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition-colors ${
              mode === id ? "bg-violet/[0.15] text-violet-soft border border-violet/20" : "text-ink-500 hover:text-ink-100"
            }`}
          >
            <Icon size={11} /> {label}
          </button>
        ))}
      </div>
    </div>
  );
}
