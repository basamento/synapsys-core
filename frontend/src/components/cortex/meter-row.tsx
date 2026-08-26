import { Progress, type MeterTone } from "@/components/ui/progress";
import { STATE_DOT } from "./tones";

/**
 * A labelled count with an optional 4px bar. Used two ways: with a dot and no
 * bar as the donut's legend, and with a bar and no dot as the framework mix.
 */
export function MeterRow({
  label,
  value,
  total,
  tone = "brand",
  dot = false,
  bar = true,
}: {
  label: string;
  value: number;
  total: number;
  tone?: MeterTone;
  dot?: boolean;
  bar?: boolean;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2.75">
        {dot && <span aria-hidden className={`size-2 shrink-0 rounded-full ${DOT[tone]}`} />}
        <span className="type-body-md grow text-body">{label}</span>
        <span className="type-mono-md text-heading">{value}</span>
      </div>
      {bar && <Progress value={percent} tone={tone} aria-label={label} />}
    </div>
  );
}

/** The brand tone has no state behind it, so it is the one entry added here. */
const DOT: Record<MeterTone, string> = { brand: "bg-brand", ...STATE_DOT };
