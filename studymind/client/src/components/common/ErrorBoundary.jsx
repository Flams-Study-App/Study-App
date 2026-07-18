import { Component } from "react";
import { AlertTriangle } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Synapse crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex items-center justify-center px-4">
          <div className="glass-panel p-8 max-w-sm text-center">
            <AlertTriangle className="mx-auto mb-3 text-amber" size={28} />
            <p className="font-display font-semibold mb-1">Something went wrong</p>
            <p className="text-sm text-ink-500 mb-4">Try reloading the page. If this keeps happening, check the browser console for details.</p>
            <button onClick={() => window.location.reload()} className="btn-primary w-full">Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
