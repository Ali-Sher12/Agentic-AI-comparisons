import { Link } from "react-router-dom";
import CaseSeal from "./CaseSeal";
import { categoryLabel, conditionLabel, formatDate } from "../lib/constants";

const CATEGORY_ICONS = {
  ELECTRONICS: "📱",
  DOCUMENTS: "📄",
  JEWELRY: "💍",
  CLOTHING: "👕",
  BAGS_WALLETS: "👜",
  VEHICLE: "🏍️",
  KEYS: "🔑",
  MONEY: "💵",
  OTHER: "📦",
};

export default function ItemCard({ item, policeView = false, basePath = "/items" }) {
  const status = item.isReturned ? "returned" : "unclaimed";

  return (
    <Link to={`${basePath}/${item.id}`} className="case-card group flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl" aria-hidden="true">
            {CATEGORY_ICONS[item.category] || "📦"}
          </span>
          <div>
            <div className="font-display text-base font-semibold text-ink">
              {categoryLabel(item.category)}
            </div>
            <div className="text-xs text-ink/50">Case ref: {item.id.slice(0, 8).toUpperCase()}</div>
          </div>
        </div>
        <CaseSeal status={status} size="sm" />
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink/80">
        {item.description}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <div>
          <dt className="text-ink/45">Color</dt>
          <dd className="font-medium text-ink/80">{item.color}</dd>
        </div>
        <div>
          <dt className="text-ink/45">Condition</dt>
          <dd className="font-medium text-ink/80">{conditionLabel(item.condition)}</dd>
        </div>
        <div>
          <dt className="text-ink/45">Recovered from</dt>
          <dd className="truncate font-medium text-ink/80">{item.recoveredFrom}</dd>
        </div>
        <div>
          <dt className="text-ink/45">Holding HQ</dt>
          <dd className="font-medium text-ink/80">{item.holdingHq?.name || "—"}</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3 text-[0.7rem] text-ink/45">
        <span>Logged {formatDate(item.uploadDate)}</span>
        {policeView && item.pendingClaimCount > 0 && (
          <span className="rounded-full bg-brass/15 px-2 py-0.5 font-semibold text-brass-dark">
            {item.pendingClaimCount} pending claim{item.pendingClaimCount > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </Link>
  );
}
