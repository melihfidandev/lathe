import { cn } from "../lib/cn";

/** Parça başlığı: kod + ad. Numara süs değil, sayfanın gerçek parça sırası. */
export default function TrackHead({ code, title, className, ...rest }) {
  return (
    <p
      data-anim="track-head"
      className={cn("flex items-baseline gap-3 font-display text-small", className)}
      {...rest}
    >
      <span className="tabular-nums opacity-60">{code}</span>
      <span className="font-[600]">{title}</span>
    </p>
  );
}
