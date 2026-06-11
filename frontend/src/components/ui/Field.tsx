interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  style?: React.CSSProperties;
}

export const Input = ({ className = "", style, ...props }: InputProps) => (
  <input
    className={className}
    style={{
      height: "36px",
      width: "100%",
      borderRadius: "6px",
      backgroundColor: "#0f0f0f",
      border: "0.5px solid var(--border)",
      padding: "0 12px",
      fontSize: "14px",
      color: "#ffffff",
      boxSizing: "border-box",
      outline: "none",
      transition: "border-color 0.15s ease",
      ...style,
    }}
    onFocus={(e) => (e.currentTarget.style.borderColor = "#4f6ef7")}
    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    {...props}
  />
);

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  style?: React.CSSProperties;
}

export const Textarea = ({ className = "", style, ...props }: TextareaProps) => (
  <textarea
    className={className}
    style={{
      minHeight: "80px",
      width: "100%",
      borderRadius: "6px",
      backgroundColor: "#0f0f0f",
      border: "0.5px solid var(--border)",
      padding: "8px 12px",
      fontSize: "14px",
      color: "var(--foreground)",
      boxSizing: "border-box",
      outline: "none",
      transition: "border-color 0.15s ease",
      ...style,
    }}
    onFocus={(e) => (e.currentTarget.style.borderColor = "#4f6ef7")}
    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    {...props}
  />
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Select = ({ className = "", children, style, ...props }: SelectProps) => (
  <select
    className={className}
    style={{
      height: "36px",
      width: "100%",
      borderRadius: "6px",
      backgroundColor: "#0f0f0f",
      border: "0.5px solid var(--border)",
      padding: "0 8px",
      fontSize: "14px",
      color: "var(--foreground)",
      boxSizing: "border-box",
      outline: "none",
      transition: "border-color 0.15s ease",
      ...style,
    }}
    onFocus={(e) => (e.currentTarget.style.borderColor = "#4f6ef7")}
    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    {...props}
  >
    {children}
  </select>
);

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Label = ({ children, className = "", style, ...props }: LabelProps) => (
  <label
    className={className}
    style={{
      fontSize: "12px",
      fontWeight: 500,
      color: "var(--muted-foreground)",
      marginBottom: "4px",
      display: "block",
      ...style,
    }}
    {...props}
  >
    {children}
  </label>
);
