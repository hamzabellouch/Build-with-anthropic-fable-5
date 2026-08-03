import { Component, type ErrorInfo, type ReactNode } from "react";
import { store } from "../store";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** smaller, inline fallback (no full-viewport centering) */
  compact?: boolean;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Catches render crashes, flushes any pending save first, and shows a recoverable
    fallback instead of a white screen. Styles are inline (with CSS-var hooks) so the
    fallback renders even if the stylesheet itself is what broke. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // First priority: nothing typed may be lost.
    try {
      store.flushSave();
    } catch {
      /* saving is best-effort here */
    }
    console.error("Crash caught by ErrorBoundary:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const { compact } = this.props;
    const message = this.state.error.message || String(this.state.error);
    return (
      <div
        role="alert"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: compact ? undefined : "100vh",
          padding: compact ? 16 : 48,
          background: "var(--bg-primary, #1e1e1e)",
          color: "var(--text-normal, #dcdcdc)",
          fontFamily: "var(--font-ui, sans-serif)",
        }}
      >
        <div style={{ maxWidth: 540, textAlign: "center" }}>
          <h2 style={{ marginBlockEnd: 12, fontSize: compact ? 16 : 20 }}>
            Something went wrong — your notes are saved.
          </h2>
          <details
            dir="auto"
            style={{
              marginBlockEnd: 16,
              textAlign: "start",
              background: "var(--bg-input, rgba(0, 0, 0, 0.3))",
              border: "1px solid var(--border-color, #2a2a2a)",
              borderRadius: 6,
              padding: "8px 12px",
              color: "var(--text-muted, #9b9b9b)",
              fontSize: 13,
            }}
          >
            <summary style={{ cursor: "pointer" }}>Error details</summary>
            <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", marginBlockStart: 8 }}>{message}</pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "var(--accent, #8a7cf0)",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "8px 20px",
              font: "inherit",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
