import { useEffect, useRef, useState } from "react";
import { Sparkles, Square, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.js";
import MessageBubble from "./MessageBubble.jsx";
import Composer from "./Composer.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ChatWindow({ threadId, documentName }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [mode, setMode] = useState("detailed");
  const bottomRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!threadId) return;
    setMessages([]);
    api.get(`/chat/threads/${threadId}/messages`).then((res) => setMessages(res.data.messages));
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const streamReply = async (userText) => {
    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = localStorage.getItem("synapse_token");
      const response = await fetch(`${API_BASE}/chat/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: userText, mode }),
        signal: controller.signal,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6));
          if (payload.delta) {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: updated[updated.length - 1].content + payload.delta,
              };
              return updated;
            });
          }
          if (payload.done) {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { ...updated[updated.length - 1], sources: payload.sources };
              return updated;
            });
          }
          if (payload.error) {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { ...updated[updated.length - 1], content: "Sorry, something went wrong: " + payload.error };
              return updated;
            });
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: "Connection error. Is the backend server running?" };
          return updated;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleSend = (text) => {
    setMessages((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: "" }]);
    streamReply(text);
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleRegenerate = () => {
    if (streaming) return;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    streamReply(lastUser.content);
  };

  if (!threadId) {
    return (
      <div className="flex-1 hidden sm:flex items-center justify-center flex-col gap-3 text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet to-cyan flex items-center justify-center shadow-glow">
          <Sparkles size={24} className="text-[#0A0C16]" />
        </div>
        <p className="text-ink-300 max-w-sm">Select a conversation on the left, or start a new one to ask your AI tutor a question.</p>
      </div>
    );
  }

  const lastAssistantIndex = messages.map((m) => m.role).lastIndexOf("assistant");

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="sm:hidden flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
        <button onClick={() => navigate("/chat")} className="flex items-center gap-1.5 text-sm text-ink-300">
          <ArrowLeft size={15} /> All chats
        </button>
      </div>
      {documentName && (
        <div className="px-6 py-2 border-b border-white/[0.08] text-xs text-ink-500">
          Answering from: <span className="text-cyan">{documentName}</span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.length === 0 && (
          <p className="text-sm text-ink-500 text-center mt-10">Ask a question to get started — explanations, summaries, worked examples, anything.</p>
        )}
        {messages.map((m, i) => (
          <MessageBubble
            key={i}
            role={m.role}
            content={m.content}
            sources={m.sources}
            isLast={i === lastAssistantIndex}
            streaming={streaming && i === messages.length - 1}
            onRegenerate={i === lastAssistantIndex ? handleRegenerate : undefined}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-4">
        {streaming ? (
          <button onClick={handleStop} className="btn-ghost w-full flex items-center justify-center gap-2">
            <Square size={14} /> Stop generating
          </button>
        ) : (
          <Composer onSend={handleSend} disabled={streaming} mode={mode} onModeChange={setMode} />
        )}
      </div>
    </div>
  );
}
