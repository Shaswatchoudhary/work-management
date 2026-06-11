import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./styles/SignaturePad.scss";

interface SignaturePadProps {
  onSave?: (data: string) => void;
  initial?: string | null;
  label?: string;
}

export default function SignaturePad({
  onSave,
  initial,
  label = "Sign below",
}: SignaturePadProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [SC, setSC] = useState<any>(null);
  const ref = useRef<any>(null);
  const [saved, setSaved] = useState(initial || null);
  const [size, setSize] = useState({ w: 600, h: 180 });

  // Load react-signature-canvas dynamically
  useEffect(() => {
    let mounted = true;
    import("react-signature-canvas").then((m) => {
      if (mounted) setSC(() => m.default || m);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Handle responsive canvas sizing
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
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => ro.disconnect();
  }, [SC]);

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
    <div className="signaturePadContainer">
      <label className="label">{label}</label>

      <div
        ref={containerRef}
        className="canvasWrapper"
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
              className: "canvas",
              width: size.w,
              height: size.h,
            }}
          />
        ) : (
          <div className="loadingState">
            Loading signature pad…
          </div>
        )}
      </div>

      <div className="buttonGroup">
        <button
          className="btnSecondary"
          type="button"
          onClick={clear}
        >
          Clear
        </button>
        <button className="btnPrimary" type="button" onClick={save}>
          Save Signature
        </button>
        {saved && <span className="successMessage">Signature captured</span>}
      </div>
    </div>
  );
}