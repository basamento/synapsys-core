import { workerListing } from "@/components/entities/worker-listing";
import { ListingView } from "@/components/listing/listing-view";
import { WorkerCoverage } from "@/components/entities/worker-coverage";
import { useAppData } from "@/state/use-app-data";

export function WorkersPage() {
  const { workers } = useAppData();

  return (
    <div className="flex flex-col gap-4">
      <ListingView definition={workerListing} rows={workers} />
      {workers.length > 0 && <WorkerCoverage workers={workers} />}
    </div>
  );
}
