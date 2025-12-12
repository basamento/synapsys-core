import type { ColumnDef } from "@tanstack/react-table"
import type { Neuron } from "@/api/neurons"

export const columns: ColumnDef<Neuron>[] = [
    {
        accessorKey: "id",
        header: "ID",
    },
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "created_at",
        header: "Created At"
    },
    {
        accessorKey: "last_connection",
        header: "Last Connection"
    }
]

