import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios.js";
import ThreadList from "../components/chat/ThreadList.jsx";
import ChatWindow from "../components/chat/ChatWindow.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";

export default function ChatPage() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [threads, setThreads] = useState([]);

  const loadThreads = () => api.get("/chat/threads").then((res) => setThreads(res.data.threads));

  useEffect(() => {
    loadThreads();
  }, []);

  const handleNew = async () => {
    const res = await api.post("/chat/threads", {});
    setThreads((prev) => [res.data.thread, ...prev]);
    navigate(`/chat/${res.data.thread._id}`);
  };

  const handleDelete = async (id) => {
    const ok = await confirm("Delete this conversation?", "All messages in this chat will be permanently removed.");
    if (!ok) return;
    await api.delete(`/chat/threads/${id}`);
    setThreads((prev) => prev.filter((t) => t._id !== id));
    if (threadId === id) navigate("/chat");
  };

  const activeThread = threads.find((t) => t._id === threadId);

  return (
    <div className="h-full flex">
      <ThreadList
        threads={threads}
        activeId={threadId}
        onSelect={(id) => navigate(`/chat/${id}`)}
        onNew={handleNew}
        onDelete={handleDelete}
      />
      <ChatWindow threadId={threadId} documentName={activeThread?.documentId ? "Linked document" : null} />
    </div>
  );
}
