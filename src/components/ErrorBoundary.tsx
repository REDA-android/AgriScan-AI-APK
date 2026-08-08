import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0d120f 0%, #111412 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "420px",
              width: "100%",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "28px",
              padding: "40px 32px",
              textAlign: "center",
              boxShadow:
                "0 20px 50px -10px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.3)",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "20px",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: "32px",
              }}
            >
              ⚠️
            </div>
            <h1
              style={{
                color: "#f8fafc",
                fontSize: "22px",
                fontWeight: 900,
                margin: "0 0 8px",
                letterSpacing: "-0.02em",
              }}
            >
              Une erreur est survenue
            </h1>
            <p
              style={{
                color: "#94a3b8",
                fontSize: "14px",
                margin: "0 0 24px",
                lineHeight: 1.5,
              }}
            >
              L'application a rencontré un problème inattendu. Vos données sont
              en sécurité.
            </p>
            {this.state.error && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.15)",
                  borderRadius: "16px",
                  padding: "12px 16px",
                  marginBottom: "24px",
                  textAlign: "left",
                }}
              >
                <p
                  style={{
                    color: "#fca5a5",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    margin: "0 0 6px",
                  }}
                >
                  Détails de l'erreur
                </p>
                <p
                  style={{
                    color: "#f87171",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    margin: 0,
                    wordBreak: "break-word",
                    lineHeight: 1.4,
                  }}
                >
                  {this.state.error.message}
                </p>
              </div>
            )}
            <button
              onClick={this.handleReload}
              style={{
                width: "100%",
                padding: "14px 24px",
                background:
                  "linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0.12) 100%)",
                border: "1px solid rgba(52,211,153,0.4)",
                borderRadius: "9999px",
                color: "#6ee7b7",
                fontSize: "15px",
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.2s ease",
                letterSpacing: "-0.01em",
              }}
            >
              🔄 Recharger l'application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
