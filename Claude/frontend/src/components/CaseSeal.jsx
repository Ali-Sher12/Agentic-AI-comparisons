// The signature element of the app: a rubber-stamp-style circular seal
// that marks an item's status. Used consistently on cards and detail pages
// so "the case file has been stamped" reads as a single visual idea.

const VARIANTS = {
  unclaimed: {
    label: "Unclaimed",
    border: "border-seal text-seal",
    rotate: "-rotate-6",
  },
  returned: {
    label: "Returned",
    border: "border-sage text-sage",
    rotate: "rotate-3",
  },
  pending: {
    label: "Pending Review",
    border: "border-brass text-brass-dark",
    rotate: "-rotate-3",
  },
};

export default function CaseSeal({ status = "unclaimed", size = "md", className = "" }) {
  const variant = VARIANTS[status] || VARIANTS.unclaimed;
  const sizeClasses = size === "sm" ? "w-16 h-16 text-[0.55rem]" : "w-20 h-20 text-[0.65rem]";

  return (
    <div
      className={`seal-stamp ${sizeClasses} ${variant.border} ${variant.rotate} ${className}`}
      style={{ borderStyle: "double", borderWidth: "3px" }}
      aria-label={`Status: ${variant.label}`}
    >
      <span className="px-1 text-center leading-tight">{variant.label}</span>
    </div>
  );
}
