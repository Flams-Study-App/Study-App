import { Link } from "react-router-dom";
import { Brain, MessageSquare, FileText, Layers, ListChecks, Calendar, LayoutDashboard, ArrowRight } from "lucide-react";

const features = [
  { icon: MessageSquare, title: "AI Chat Tutor", desc: "Ask questions and get clear, streaming explanations tailored to how you learn." },
  { icon: FileText, title: "Document Q&A", desc: "Upload your notes or a textbook chapter and get answers grounded in that exact material." },
  { icon: Layers, title: "Smart Flashcards", desc: "AI-generated cards that resurface using proven spaced-repetition scheduling." },
  { icon: ListChecks, title: "Instant Quizzes", desc: "Generate a quiz on any topic in seconds, with explanations for every answer." },
  { icon: Calendar, title: "Planner + Pomodoro", desc: "Track deadlines by priority and time your focus sessions automatically." },
  { icon: LayoutDashboard, title: "Progress Dashboard", desc: "See your study streak, accuracy, and focus time trends at a glance." },
];

export default function Landing() {
  return (
    <div className="min-h-screen w-full">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet to-cyan flex items-center justify-center shadow-glow">
            <Brain size={18} className="text-[#0A0C16]" />
          </div>
          <span className="font-display font-bold text-lg">Synapse</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost">Sign in</Link>
          <Link to="/register" className="btn-primary">Get started</Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 pt-16 pb-20 text-center">
        <span className="inline-block px-3 py-1 rounded-full text-xs border border-violet/30 bg-violet/[0.08] text-violet-soft mb-5">
          AI-powered studying, all in one place
        </span>
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl leading-tight mb-5">
          Study smarter with an AI tutor that <span className="bg-gradient-to-r from-violet to-cyan bg-clip-text text-transparent">actually knows your notes</span>
        </h1>
        <p className="text-ink-300 text-lg max-w-2xl mx-auto mb-8">
          Chat with an AI tutor, turn your documents into flashcards and quizzes, and track your focus time — all in a single, distraction-free workspace.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/register" className="btn-primary flex items-center gap-2 !px-6 !py-3">
            Create free account <ArrowRight size={16} />
          </Link>
          <Link to="/login" className="btn-ghost !px-6 !py-3">I already have an account</Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-panel p-6">
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center mb-4">
                <Icon size={18} className="text-cyan" />
              </div>
              <p className="font-semibold mb-1.5">{title}</p>
              <p className="text-sm text-ink-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 pb-10 text-center text-xs text-ink-500">
        Built with the MERN stack and Google Gemini.
      </footer>
    </div>
  );
}
