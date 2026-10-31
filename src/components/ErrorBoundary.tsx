import { Component, ErrorInfo, ReactNode } from "react";

interface Props { children: ReactNode; area?: string }
interface State { error: Error | null }

/** Zeigt statt einer leeren Seite eine verständliche Fehlermeldung (für Screenshot/Support). */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.area || "App"}]`, error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "#f5f5f4", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: 560, width: "100%", background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}>
          <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>Da ist etwas schiefgelaufen</h1>
          <p style={{ color: "#57534e", margin: "0 0 12px" }}>Bitte von dieser Meldung einen Screenshot machen und an den Support schicken.</p>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#fef2f2", color: "#991b1b", padding: 12, borderRadius: 8, fontSize: 13 }}>
            {this.props.area ? `${this.props.area}: ` : ""}{error.name}: {error.message}
            {"\n"}{(error.stack || "").split("\n").slice(1, 6).join("\n")}
          </pre>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <button onClick={() => window.location.reload()} style={{ padding: "10px 16px", borderRadius: 8, background: "#1c1917", color: "#fff", border: 0, fontWeight: 600 }}>Neu laden</button>
            <a href="/" style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #d6d3d1", color: "#1c1917", textDecoration: "none", fontWeight: 600 }}>Zur Startseite</a>
          </div>
        </div>
      </div>
    );
  }
}
