interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input = ({ className = "", ...props }: InputProps) => (
  <input
    className={`h-9 w-full rounded-md bg-[#0f0f0f] border border-border px-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#4f6ef7] ${className}`}
    {...props}
  />
);

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export const Textarea = ({ className = "", ...props }: TextareaProps) => (
  <textarea
    className={`min-h-[80px] w-full rounded-md bg-[#0f0f0f] border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#4f6ef7] ${className}`}
    {...props}
  />
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  children: React.ReactNode;
}

export const Select = ({ className = "", children, ...props }: SelectProps) => (
  <select
    className={`h-9 w-full rounded-md bg-[#0f0f0f] border border-border px-2 text-sm text-foreground focus:outline-none focus:border-[#4f6ef7] ${className}`}
    {...props}
  >
    {children}
  </select>
);

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  className?: string;
}

export const Label = ({ children, className = "", ...props }: LabelProps) => (
  <label className={`text-xs font-medium text-muted-foreground mb-1 block ${className}`} {...props}>
    {children}
  </label>
);
