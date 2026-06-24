import { Separator } from "@/components/ui/separator";
import { WorkerCard } from "@/components/worker/worker-card";
import { WorkersHeader } from "@/components/layout/workers-header";
import { useAppData } from "@/state/use-app-data";


export function WorkersPage() {

	const { workers, status, error } = useAppData();

	return (
		<>
			<WorkersHeader total={workers.length} />
			<Separator className="my-4" />
			<div className="flex flex-col gap-3">
				{workers.map((worker) => (
					<WorkerCard key={worker.id} worker={worker} />
				))}
				{status === "error" && (
					<div className="py-10 text-center text-sm text-destructive">
						{error ?? "Failed to load workers."}
					</div>
				)}
				{workers.length === 0 && status !== "error" && (
					<div className="text-sm text-muted-foreground py-10 text-center">
						{status === "loading" ? "Loading workers..." : "No workers yet."}
					</div>
				)}
			</div>
		</>
	);
}
