import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Brain } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center px-4">
      <div className="w-full max-w-sm glass-panel p-8 animate-in">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet to-cyan flex items-center justify-center shadow-glow">
            <Brain size={20} className="text-[#0A0C16]" />
          </div>
          <div>
            <p className="font-display font-bold text-xl leading-none">Synapse</p>
            <p className="text-xs text-ink-500 mt-1">Create your account</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-ink-300 mb-1 block">Full name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Adi Sharma" />
          </div>
          <div>
            <label className="text-xs text-ink-300 mb-1 block">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@college.edu" />
          </div>
          <div>
            <label className="text-xs text-ink-300 mb-1 block">Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="At least 6 characters" />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-sm text-ink-500 mt-6 text-center">
          Already have an account? <Link to="/login" className="text-violet-soft hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
