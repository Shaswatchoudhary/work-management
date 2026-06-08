import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Button from "../ui/CustomButton.tsx";

interface SignaturePadProps {
  onSave?: (data: string) => void;
  initial?: string | null;
  label?: string;
}

export default function SignaturePad({ onSave, initial, label = "Sign below" }: SignaturePadProps) { // ye function signature pad ka hai
  const containerRef = useRef<HTMLDivElement>(null);
  const [SC, setSC] = useState<any>(null);
  const ref = useRef<any>(null);
  const [saved, setSaved] = useState(initial || null);
  const [size, setSize] = useState({ w: 600, h: 180 });

  useEffect(() => {
    let mounted = true;
    import("react-signature-canvas").then((m) => {
      if (mounted) setSC(() => m.default || m);
    });
    return () => {
      mounted = false;
    };
  }, []); // ye import karta hai react-signature-canvas 

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(200, Math.floor(rect.width));
      const h = 180;
      setSize({ w, h });
      const canvas = ref.current?.getCanvas?.();
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        const ctx = canvas.getContext("2d");
        ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
        ref.current?.clear();
      } // isme canvas ko resize karte hain ke jaha sign karne hai uska size
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [SC]); // or ye size change par update karta hai bina reload ke

  const clear = () => {
    ref.current?.clear();
    setSaved(null);
  };
  const save = () => {
    if (!ref.current || ref.current.isEmpty()) return;
    const data = ref.current.getCanvas().toDataURL("image/png");
    setSaved(data);
    onSave?.(data);
  };

  return (
    <div>
      <div className="text-xs text-muted-foreground mb-2">{label}</div>
      <div
        ref={containerRef}
        className="rounded-md border border-border bg-white overflow-hidden touch-none select-none"
        style={{ height: size.h }}
      >
        {SC ? (
          <SC
            ref={ref}
            penColor="#000"
            minWidth={1.2}
            maxWidth={2.4}
            velocityFilterWeight={0.6}
            throttle={8}
            canvasProps={{
              className: "block w-full h-full cursor-crosshair",
              width: size.w,
              height: size.h,
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-gray-500">
            Loading signature pad…
          </div>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <Button size="sm" variant="secondary" type="button" onClick={clear}>
          Clear
        </Button>
        <Button size="sm" type="button" onClick={save}>
          Save Signature
        </Button>
        {saved && <span className="text-xs text-emerald-400 self-center">Signature captured</span>}
      </div>
    </div>
  );
}
