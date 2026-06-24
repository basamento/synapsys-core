import { Separator } from "@/components/ui/separator";
import { ProcessCard } from "@/components/process/process-card";
import { useNeurons } from "@/components/neurons/useNeurons";
import { ProcessesHeader } from "@/components/layout/processes-header";


export function ProcessesPage() {

	const { neurons } = useNeurons();

	return (
		<>
			<ProcessesHeader total={neurons.length} />
			<Separator className="my-4" />
			<div className="flex flex-col gap-3">
				{neurons.map((neuron) => (
					<ProcessCard key={neuron.id} worker={neuron} />
				))}
				{neurons.length === 0 && (
					<div className="text-sm text-muted-foreground py-10 text-center">
						No processes yet.
					</div>
				)}
			</div>
		</>
	);
}
