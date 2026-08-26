import { actionListing } from "@/components/entities/action-listing";
import { ListingView } from "@/components/listing/listing-view";
import { useAppData } from "@/state/use-app-data";

export function ActionsPage() {
  const { actions } = useAppData();
  return <ListingView definition={actionListing} rows={actions} />;
}
