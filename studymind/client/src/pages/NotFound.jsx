import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="h-screen w-full flex items-center justify-center px-4">
      <div className="glass-panel p-10 max-w-sm text-center">
        <Compass className="mx-auto mb-4 text-violet-soft" size={32} />
        <p className="font-display font-bold text-2xl mb-1">404</p>
        <p className="text-ink-500 text-sm mb-6">This page doesn't exist, or the link is broken.</p>
        <Link to="/" className="btn-primary inline-block">Back to Synapse</Link>
      </div>
    </div>
  );
}
