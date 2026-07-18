import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Brain, User, Copy, Check, RotateCcw } from "lucide-react";

export default function MessageBubble({ role, content, sources, onRegenerate, isLast, streaming }) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`flex gap-3 animate-in group ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          isUser ? "bg-white/[0.08]" : "bg-gradient-to-br from-violet to-cyan"
        }`}
      >
        {isUser ? <User size={15} className="text-ink-100" /> : <Brain size={15} className="text-[#0A0C16]" />}
      </div>
      <div className={`max-w-[75%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser ? "bg-violet/[0.15] border border-violet/20" : "glass"
        }`}>
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-pre:bg-black/40 prose-pre:rounded-xl prose-code:text-cyan prose-code:before:content-none prose-code:after:content-none prose-table:text-xs prose-th:text-ink-300">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{content || (streaming ? "..." : " ")}</ReactMarkdown>
          </div>
          {sources?.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/[0.08] flex flex-wrap gap-1.5">
              {sources.map((s, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-cyan/[0.12] text-cyan border border-cyan/20">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {!isUser && content && !streaming && (
          <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleCopy} title="Copy" className="p-1.5 rounded-lg hover:bg-white/[0.08] text-ink-500 hover:text-ink-100">
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
            {isLast && onRegenerate && (
              <button onClick={onRegenerate} title="Regenerate response" className="p-1.5 rounded-lg hover:bg-white/[0.08] text-ink-500 hover:text-ink-100">
                <RotateCcw size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
