import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, Trash2, MessageSquare, Loader2, CheckCircle2, XCircle } from "lucide-react";
import api from "../api/axios.js";
import { useConfirm } from "../context/ConfirmContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function DocumentsPage() {
  const confirm = useConfirm();
  const toast = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const loadDocuments = () => api.get("/documents").then((res) => setDocuments(res.data.documents));

  useEffect(() => {
    loadDocuments().finally(() => setLoading(false));
    const interval = setInterval(loadDocuments, 4000); // poll for processing status
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post("/documents/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      loadDocuments();
      toast.success(`"${file.name}" uploaded — indexing in the background`);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id, name) => {
    const ok = await confirm("Delete this document?", `"${name}" and its indexed chunks will be permanently removed. Any chats linked to it will stop being able to reference it.`);
    if (!ok) return;
    await api.delete(`/documents/${id}`);
    setDocuments((prev) => prev.filter((d) => d._id !== id));
    toast.success("Document deleted");
  };

  const handleChat = async (doc) => {
    const res = await api.post("/chat/threads", { title: `About: ${doc.originalName}`, documentId: doc._id });
    navigate(`/chat/${res.data.thread._id}`);
  };

  const statusBadge = (status) => {
    if (status === "ready") return <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 size={13} /> Ready</span>;
    if (status === "failed") return <span className="flex items-center gap-1 text-xs text-red-400"><XCircle size={13} /> Failed</span>;
    return <span className="flex items-center gap-1 text-xs text-amber"><Loader2 size={13} className="animate-spin" /> Processing</span>;
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl">Documents</h1>
          <p className="text-ink-500 text-sm mt-1">Upload notes or textbooks and chat with them directly.</p>
        </div>
        <label className="btn-primary flex items-center gap-2 cursor-pointer">
          <Upload size={16} />
          {uploading ? "Uploading..." : "Upload file"}
          <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" onChange={handleFileChange} disabled={uploading} className="hidden" />
        </label>
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      <div className="space-y-3">
        {loading && (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 glass-panel" />)}
          </div>
        )}
        {!loading && documents.length === 0 && (
          <div className="glass-panel p-10 text-center text-ink-500 text-sm">
            No documents yet. Upload a PDF, TXT, or Markdown file to get started.
          </div>
        )}
        {documents.map((doc) => (
          <div key={doc._id} className="glass-panel p-4 flex items-start gap-4 animate-in">
            <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
              <FileText size={18} className="text-cyan" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{doc.originalName}</p>
              <div className="flex items-center gap-3 mt-1">
                {statusBadge(doc.status)}
                {doc.status === "ready" && <span className="text-xs text-ink-500">{doc.chunkCount} chunks indexed</span>}
              </div>
              {doc.status === "ready" && doc.summary && (
                <p className="text-xs text-ink-300 mt-2 leading-relaxed">{doc.summary}</p>
              )}
              {doc.status === "ready" && doc.keyTopics?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {doc.keyTopics.map((topic, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-violet/[0.1] text-violet-soft border border-violet/20">
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => handleChat(doc)}
              disabled={doc.status !== "ready"}
              className="btn-ghost flex items-center gap-2 disabled:opacity-40"
            >
              <MessageSquare size={14} /> Chat
            </button>
            <button onClick={() => handleDelete(doc._id, doc.originalName)} className="p-2 rounded-lg hover:bg-white/[0.08] text-ink-500 hover:text-red-400">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
