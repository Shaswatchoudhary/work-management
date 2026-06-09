import { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({ open, onClose, title, children, size = "lg" }: ModalProps) {
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
  const sizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-md" onClick={onClose} />
      <div
        className={`relative w-full ${sizes[size]} max-h-[90vh] overflow-hidden rounded-2xl bg-white/[0.08] border border-white/15 backdrop-blur-[25px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] flex flex-col text-white`}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
          <h3 className="text-sm font-bold tracking-tight text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-xl leading-none cursor-pointer transition-colors"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 bg-transparent">{children}</div>
      </div>
    </div>
  );
}
