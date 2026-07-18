import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import Layout from "./components/common/Layout.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import DocumentsPage from "./pages/DocumentsPage.jsx";
import FlashcardsPage from "./pages/FlashcardsPage.jsx";
import QuizzesPage from "./pages/QuizzesPage.jsx";
import PlannerPage from "./pages/PlannerPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import NotFound from "./pages/NotFound.jsx";

function Protected({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function Root() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : <Landing />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Root />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/chat" element={<Protected><ChatPage /></Protected>} />
      <Route path="/chat/:threadId" element={<Protected><ChatPage /></Protected>} />
      <Route path="/documents" element={<Protected><DocumentsPage /></Protected>} />
      <Route path="/flashcards" element={<Protected><FlashcardsPage /></Protected>} />
      <Route path="/flashcards/:deckId" element={<Protected><FlashcardsPage /></Protected>} />
      <Route path="/quizzes" element={<Protected><QuizzesPage /></Protected>} />
      <Route path="/quizzes/:quizId" element={<Protected><QuizzesPage /></Protected>} />
      <Route path="/planner" element={<Protected><PlannerPage /></Protected>} />
      <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
