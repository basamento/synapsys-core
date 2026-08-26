import { processListing } from "@/components/entities/process-listing";
import { ListingView } from "@/components/listing/listing-view";
import { useAppData } from "@/state/use-app-data";

export function ProcessesPage() {
  const { processOverviews } = useAppData();
  return <ListingView definition={processListing} rows={processOverviews} />;
}
