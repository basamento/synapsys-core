import { SyncCountdown } from "./sync-countdown";

type NeuronCardProps = {
    total: number;
}

export function NeuronsHeader({ total }: NeuronCardProps) {
    return (
        <div className="flex items-center justify-between gap-4 pr-2">
            <div>
                <h1 className="text-lg font-semibold">Processes</h1>
                <p className="text-sm text-muted-foreground">
                    {total} total
                </p>
            </div>
            <SyncCountdown />
        </div>
    )
}


