import { CheckCircle2, Play, PlusCircle, RadioTower, Square } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { IconSquare } from "@/components/cortex/panel";
import type { ActionType } from "@/types/entities";

/**
 * One icon per action type. Icons are never coloured by status — the badge
 * beside them carries that.
 */
const ACTION_ICONS: Record<ActionType, LucideIcon> = {
  create: PlusCircle,
  start: Play,
  stop: Square,
  heartbeat: RadioTower,
  ack: CheckCircle2,
};

export function ActionIcon({ type, size = 14 }: { type: ActionType; size?: number }) {
  const Icon = ACTION_ICONS[type] ?? PlusCircle;
  return <Icon aria-hidden style={{ width: size, height: size }} />;
}

export function ActionIconSquare({
  type,
  className,
  size = 14,
}: {
  type: ActionType;
  className?: string;
  size?: number;
}) {
  return (
    <IconSquare className={className}>
      <ActionIcon type={type} size={size} />
    </IconSquare>
  );
}
