import { formatDateTime } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import type { Neuron } from "@/api/neurons";
import { StartNeuronButton } from "./start-neuron-button";
import { StopNeuronButton } from "./stop-neuron-button";

type NeuronCardProps = {
    neuron: Neuron;
};

export function NeuronCard({ neuron }: NeuronCardProps) {
    return (
        <Card
            key={neuron.id}
            className="p-4 transition-colors hover:bg-muted/40"
        >
            <div className="flex flex-col gap-3">
                {/* Top line: Name + badges + actions */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-semibold truncate">
                                {neuron.name}
                            </h2>

                            <div className="flex items-center gap-2 flex-wrap">
                                <TypeBadge type={neuron.type} />
                                <StatusBadge status={neuron.status} />
                                <StateBadge state={neuron.currentState ?? null} />
                            </div>
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground">
                            ID:{" "}
                            <span className="font-mono text-foreground/90">
                                {neuron.id}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:justify-end">
                        <StartNeuronButton neuron={neuron} />
                        <StopNeuronButton neuron={neuron} />
                    </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-muted/40 p-3">
                        <div className="flex flex-col gap-1">
                            <KeyLabel>Last Touch</KeyLabel>
                            <ValueText>
                                {formatDateTime(neuron.lastTouch)}
                            </ValueText>
                        </div>
                    </div>

                    <div className="rounded-lg bg-muted/40 p-3">
                        <div className="flex flex-col gap-1">
                            <KeyLabel>Type</KeyLabel>
                            <ValueText>
                                {neuron.type === "endless"
                                    ? "Endless"
                                    : "Progressive"}
                            </ValueText>
                        </div>
                    </div>

                    <div className="rounded-lg bg-muted/40 p-3">
                        <div className="flex flex-col gap-1">
                            <KeyLabel>Status</KeyLabel>
                            <ValueText>
                                {neuron.status === "active" ? "Active" : "Inactive"}
                            </ValueText>
                        </div>
                    </div>

                    <div className="rounded-lg bg-muted/40 p-3">
                        <div className="flex flex-col gap-1">
                            <KeyLabel>State</KeyLabel>
                            <ValueText>
                                {neuron.currentState === "idle"
                                    ? "Idle"
                                    : neuron.currentState === "running"
                                        ? "Running"
                                        : "—"}
                            </ValueText>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    )
}

// If you want, you can replace these with lucide icons later.
function KeyLabel({ children }: { children: React.ReactNode }) {
    return (
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {children}
        </span>
    )
}

function ValueText({ children }: { children: React.ReactNode }) {
    return <span className="text-sm font-medium">{children}</span>
}

function TypeBadge({ type }: { type: "endless" | "progressive" }) {
    return (
        <Badge variant="secondary" className="whitespace-nowrap">
            {type === "endless" ? "Endless" : "Progressive"}
        </Badge>
    )
}

function StatusBadge({ status }: { status: "active" | "inactive" }) {
    if (status === "active") {
        return (
            <Badge className="bg-green-600 text-white hover:bg-green-700 whitespace-nowrap">
                Active
            </Badge>
        )
    }
    return (
        <Badge variant="destructive" className="whitespace-nowrap">
            Inactive
        </Badge>
    )
}

function StateBadge({ state }: { state: "idle" | "running" | null }) {
    if (state === "idle") {
        return (
            <Badge className="bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap">
                Idle
            </Badge>
        )
    }
    if (state === "running") {
        return (
            <Badge className="bg-violet-600 text-white hover:bg-violet-700 whitespace-nowrap">
                Running
            </Badge>
        )
    }
    return (
        <Badge variant="outline" className="whitespace-nowrap">
            —
        </Badge>
    )
}