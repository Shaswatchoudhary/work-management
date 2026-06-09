interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-gradient-to-r from-[#0052cc] to-[#0066ff] hover:brightness-110 text-white shadow-md shadow-blue-500/10",
    secondary: "bg-white/10 hover:bg-white/15 text-white border border-white/10 backdrop-blur-sm",
    ghost: "bg-transparent hover:bg-white/10 text-white",
    danger: "bg-red-550/80 hover:bg-red-550/95 text-white border border-red-500/35",
    success: "bg-emerald-550/80 hover:bg-emerald-550/95 text-white border border-emerald-500/35",
    outline: "bg-transparent border border-white/20 hover:bg-white/10 text-white",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 text-sm",
    lg: "h-10 px-5 text-sm",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
