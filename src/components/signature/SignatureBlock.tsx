/* src/components/signature/SignatureBlock.tsx */
import React, {
  forwardRef,
  ForwardRefRenderFunction,

} from "react";

/**
 * Props for an individual signature card.
 */
interface CardProps {
  title: string; // header text (e.g. "HR APPROVAL")
  name: string; // full name to display
  role: string; // role/position (e.g. "HR")
  hash: string; // unique hash string
  headerColor: string; // hex colour for the header bar
}

/**
 * Simple, inline‑styled card that represents one signature.
 */
const Card: React.FC<CardProps> = ({
  title,
  name,
  role,
  hash,
  headerColor,
}) => (
  <div
    style={{
      width: "100%",
      maxWidth: "260px",
      margin: "8px",
      backgroundColor: "#ffffff",
      borderRadius: "8px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
      overflow: "hidden",
      fontFamily: "'Inter', sans-serif",
    }}
  >
    {/* Header bar (coloured) */}
    <div
      style={{
        backgroundColor: headerColor,
        color: "#ffffff",
        padding: "4px 8px",
        fontSize: "0.85rem",
        fontWeight: 600,
        textTransform: "uppercase",
      }}
    >
      {title}
    </div>

    {/* Body */}
    <div style={{ padding: "12px" }}>
      {/* Name */}
      <div
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          marginBottom: "4px",
        }}
      >
        {name}
      </div>

      {/* Role */}
      <div
        style={{
          fontSize: "0.85rem",
          color: "#555555",
          marginBottom: "8px",
        }}
      >
        {role}
      </div>

      {/* Mock cursive signature – Georgia italic */}
      <div
        style={{
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          fontSize: "1.2rem",
          color: "#222222",
          marginBottom: "8px",
        }}
      >
        {name.split(" ")[0]} {name.split(" ")[1][0]}. {/* simple handwritten look */}
      </div>

      {/* Hash – monospace */}
      <div
        style={{
          fontFamily: "monospace",
          fontSize: "0.75rem",
          backgroundColor: "#f5f5f5",
          padding: "2px 4px",
          display: "inline-block",
          marginBottom: "8px",
        }}
      >
        {hash}
      </div>

      {/* “PIN VERIFIED” badge */}
      <div
        style={{
          display: "inline-block",
          backgroundColor: "#28a745",
          color: "#ffffff",
          fontSize: "0.75rem",
          fontWeight: 600,
          padding: "2px 6px",
          borderRadius: "4px",
          marginBottom: "8px",
        }}
      >
        PIN VERIFIED · DIGITALLY SIGNED
      </div>

      {/* Timestamp */}
      <div
        style={{
          fontSize: "0.7rem",
          color: "#777777",
          marginTop: "4px",
        }}
      >
        {new Date().toLocaleString()}
      </div>
    </div>
  </div>
);

/**
 * Forward‑ref component – the parent passes a `ref` that points to the whole
 * 2 × 2 grid. `html2canvas` will capture this element.
 */


const SignatureBlock: ForwardRefRenderFunction<HTMLDivElement, {}> = (
  _props,
  ref
) => (
  <div
    ref={ref}
    style={{
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      backgroundColor: "#ffffff",
      padding: "16px",
    }}
  >
    <Card
      title="HR APPROVAL"
      name="Priya Sharma"
      role="HR"
      hash="9F25C0C7"
      headerColor="#1a3a5c"
    />
    <Card
      title="ADMIN FINAL APPROVAL"
      name="Suresh Verma"
      role="ADMIN"
      hash="940DB80E"
      headerColor="#1f3320"
    />
    <Card
      title="HR INSPECTION"
      name="Priya Sharma"
      role="HR"
      hash="CCD14EF8"
      headerColor="#1a3a5c"
    />
    <Card
      title="ADMIN INSPECTION + PAYMENT"
      name="Suresh Verma"
      role="ADMIN"
      hash="7DD31AF7"
      headerColor="#1f3320"
    />
  </div>
);

export default forwardRef(SignatureBlock);

/**
 * Exported meta‑data for the default signatures – useful for future
 * server‑side handling or for other components.
 */
export const DEFAULT_SIGNATURES = [
  {
    title: "HR APPROVAL",
    name: "Priya Sharma",
    role: "HR",
    hash: "9F25C0C7",
    headerColor: "#1a3a5c",
  },
  {
    title: "ADMIN FINAL APPROVAL",
    name: "Suresh Verma",
    role: "ADMIN",
    hash: "940DB80E",
    headerColor: "#1f3320",
  },
  {
    title: "HR INSPECTION",
    name: "Priya Sharma",
    role: "HR",
    hash: "CCD14EF8",
    headerColor: "#1a3a5c",
  },
  {
    title: "ADMIN INSPECTION + PAYMENT",
    name: "Suresh Verma",
    role: "ADMIN",
    hash: "7DD31AF7",
    headerColor: "#1f3320",
  },
] as const;
