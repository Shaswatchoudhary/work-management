import { useEffect, useState } from "react";

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({ open, onClose, title, children, size = "lg" }: ModalProps) {
  const [hoveredClose, setHoveredClose] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeWidths = {
    sm: "448px",
    md: "576px",
    lg: "768px",
    xl: "1024px",
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.55)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      />

      {/* Modal Dialog */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: sizeWidths[size],
          maxHeight: "90vh",
          overflow: "hidden",
          borderRadius: "16px",
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(25px)",
          WebkitBackdropFilter: "blur(25px)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
          display: "flex",
          flexDirection: "column",
          color: "#ffffff",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.10)",
            boxSizing: "border-box",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "#ffffff",
              margin: 0,
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            onMouseEnter={() => setHoveredClose(true)}
            onMouseLeave={() => setHoveredClose(false)}
            style={{
              background: "none",
              border: "none",
              color: hoveredClose ? "#ffffff" : "rgba(255, 255, 255, 0.6)",
              fontSize: "22px",
              lineHeight: 1,
              cursor: "pointer",
              transition: "color 0.15s ease",
              padding: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Body Content */}
        <div
          style={{
            overflowY: "auto",
            padding: "16px 20px",
            backgroundColor: "transparent",
            boxSizing: "border-box",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

