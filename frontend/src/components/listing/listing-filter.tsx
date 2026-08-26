import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-layout";
import { cn } from "@/lib/utils";
import { FilterCount } from "./filter-count";
import type { FilterOption } from "./listing-definition";
import { PageSizeControl } from "./page-size-control";

/**
 * How a listing is narrowed, in whichever surface the viewport calls for: an
 * anchored popover on desktop, a bottom sheet on mobile.
 *
 * Both wrap the same controls, so the two are one filter presented twice rather
 * than two filtering mechanisms that could drift apart.
 */
export function ListingFilter({
  title,
  facetLabel,
  options,
  selected,
  pageSize,
  onSelectedChange,
  onPageSizeChange,
}: FilterControlsProps & { title: string }) {
  const isMobile = useIsMobile();
  const controls = (
    <FilterControls
      facetLabel={facetLabel}
      options={options}
      selected={selected}
      pageSize={pageSize}
      onSelectedChange={onSelectedChange}
      onPageSizeChange={onPageSizeChange}
    />
  );

  if (isMobile) {
    return (
      <MobileFilter title={title} count={selected.length} facetLabel={facetLabel}>
        {controls}
        <div className="flex gap-2.25">
          <ResetButton size="lg" onReset={() => onSelectedChange([])} />
          <ConfirmButton options={options} selected={selected} />
        </div>
      </MobileFilter>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" aria-label={`Filter by ${facetLabel.toLowerCase()}`}>
          {facetLabel}
          {selected.length > 0 && <FilterCount count={selected.length} />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-72 flex-col gap-4">
        {controls}
        <ResetButton size="sm" onReset={() => onSelectedChange([])} />
      </PopoverContent>
    </Popover>
  );
}

function MobileFilter({
  title,
  count,
  facetLabel,
  children,
}: {
  title: string;
  count: number;
  facetLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" aria-label={`Filter by ${facetLabel.toLowerCase()}`}>
          <SlidersHorizontal aria-hidden />
          {count > 0 ? <FilterCount count={count} /> : "Filter"}
        </Button>
      </SheetTrigger>
      <SheetContent aria-describedby={undefined}>
        <SheetTitle>Filter {title.toLowerCase()}</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}

type FilterControlsProps = {
  facetLabel: string;
  options: FilterOption[];
  selected: string[];
  pageSize: number;
  onSelectedChange: (values: string[]) => void;
  onPageSizeChange: (pageSize: number) => void;
};

/**
 * The facet toggles and the page size — everything that narrows a listing,
 * independent of the surface it is shown in.
 */
function FilterControls({
  facetLabel,
  options,
  selected,
  pageSize,
  onSelectedChange,
  onPageSizeChange,
}: FilterControlsProps) {
  function toggle(value: string) {
    onSelectedChange(
      selected.includes(value) ? selected.filter((entry) => entry !== value) : [...selected, value],
    );
  }

  return (
    <>
      <fieldset className="flex flex-col gap-2.25">
        <legend className="type-eyebrow uppercase text-faint">{facetLabel}</legend>
        <div className="flex flex-wrap gap-2 pt-2.25">
          {options.map((option) => {
            const on = selected.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(option.value)}
                className={cn(
                  "inline-flex h-9.5 items-center gap-1.75 rounded-full border px-3.5 type-body-md font-semibold transition-colors",
                  on
                    ? cn("border-transparent", FACET_TONE[option.value] ?? "bg-sunken text-body")
                    : "border-edge text-muted-foreground hover:text-body",
                )}
              >
                {option.dotClass && (
                  <span aria-hidden className={cn("size-1.75 rounded-full", option.dotClass)} />
                )}
                {option.label.toLowerCase()}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2.25">
        <span className="type-eyebrow uppercase text-faint">Page size</span>
        <PageSizeControl value={pageSize} onChange={onPageSizeChange} size="lg" />
      </div>
    </>
  );
}

function ResetButton({ size, onReset }: { size: "sm" | "lg"; onReset: () => void }) {
  return (
    <Button size={size} variant="outline" className="flex-1" onClick={onReset}>
      Reset
    </Button>
  );
}

/** Mobile confirms and closes; the popover applies as you go and needs no button. */
function ConfirmButton({ options, selected }: { options: FilterOption[]; selected: string[] }) {
  // Choosing every value narrows nothing, so it is reported as "all" rather
  // than listing four options back at the reader.
  const summary =
    selected.length === 0 || selected.length === options.length
      ? "all"
      : options
          .filter((option) => selected.includes(option.value))
          .map((option) => option.label.toLowerCase())
          .join(" + ");

  return (
    <SheetClose asChild>
      <Button size="lg" className="flex-2">
        Show {summary}
      </Button>
    </SheetClose>
  );
}

/**
 * A selected chip is tinted with its own state colour. Facet values that are
 * not states — frameworks, action types — fall back to the sunken plane.
 */
const FACET_TONE: Record<string, string> = {
  idle: "bg-idle-bg text-idle-fg",
  running: "bg-running-bg text-running-fg",
  stopping: "bg-stopping-bg text-stopping-fg",
  failed: "bg-failed-bg text-failed-fg",
  active: "bg-running-bg text-running-fg",
  inactive: "bg-sunken text-body",
};
