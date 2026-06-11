import React, {
  forwardRef,
  ForwardRefRenderFunction,
} from "react";
import "./SignatureBlock.scss";

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
 * Card component using classNames.
 */
const Card: React.FC<CardProps> = ({
  title,
  name,
  role,
  hash,
  headerColor,
}) => (
  <div className="signature-card">
    {/* Header bar (coloured) */}
    <div
      className="card-header"
      style={{ backgroundColor: headerColor }}
    >
      {title}
    </div>

    {/* Body */}
    <div className="card-body">
      {/* Name */}
      <div className="signer-name">
        {name}
      </div>

      {/* Role */}
      <div className="signer-role">
        {role}
      </div>

      {/* Mock cursive signature – Georgia italic */}
      <div className="drawn-look">
        {name.split(" ")[0]} {name.split(" ")[1] ? name.split(" ")[1][0] + "." : ""}
      </div>

      {/* Hash – monospace */}
      <div className="signer-hash">
        {hash}
      </div>

      {/* “PIN VERIFIED” badge */}
      <div className="badge-verified">
        PIN VERIFIED · DIGITALLY SIGNED
      </div>

      {/* Timestamp */}
      <div className="timestamp">
        {new Date().toLocaleString()}
      </div>
    </div>
  </div>
);

/**
 * Forward‑ref component – the parent passes a `ref` that points to the whole
 * 2 × 2 grid. `html2canvas` will capture this element.
 */
const SignatureBlockComponent: ForwardRefRenderFunction<HTMLDivElement, {}> = (
  _props,
  ref
) => (
  <div ref={ref} className="signature-block-grid">
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

export default forwardRef(SignatureBlockComponent);


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
