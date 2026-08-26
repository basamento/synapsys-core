import { executionListing } from "@/components/entities/execution-listing";
import { ListingView } from "@/components/listing/listing-view";
import { useAppData } from "@/state/use-app-data";

export function ExecutionsPage() {
  const { executions } = useAppData();
  return <ListingView definition={executionListing} rows={executions} />;
}
