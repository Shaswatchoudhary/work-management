interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const variantsStyle: Record<string, React.CSSProperties> = {
  primary: {
    background: "linear-gradient(135deg, #0052cc, #0066ff)",
    color: "#ffffff",
    boxShadow: "0 4px 6px -1px rgba(0, 82, 204, 0.1), 0 2px 4px -1px rgba(0, 82, 204, 0.06)",
  },
  secondary: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#ffffff",
    borderColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(4px)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "#ffffff",
  },
  danger: {
    backgroundColor: "rgba(220, 38, 38, 0.8)",
    color: "#ffffff",
    borderColor: "rgba(220, 38, 38, 0.35)",
  },
  success: {
    backgroundColor: "rgba(22, 163, 74, 0.8)",
    color: "#ffffff",
    borderColor: "rgba(22, 163, 74, 0.35)",
  },
  outline: {
    backgroundColor: "transparent",
    borderColor: "rgba(255, 255, 255, 0.2)",
    color: "#ffffff",
  },
};

const sizesStyle: Record<string, React.CSSProperties> = {
  sm: { height: "32px", padding: "0 12px", fontSize: "12px" },
  md: { height: "36px", padding: "0 16px", fontSize: "14px" },
  lg: { height: "40px", padding: "0 20px", fontSize: "14px" },
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        borderRadius: "6px",
        fontWeight: 600,
        transition: "all 0.15s ease-in-out",
        border: "1px solid transparent",
        cursor: "pointer",
        boxSizing: "border-box",
        ...variantsStyle[variant],
        ...sizesStyle[size],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
