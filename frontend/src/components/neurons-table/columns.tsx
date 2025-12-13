import type { ColumnDef } from "@tanstack/react-table"
import type { Neuron } from "@/api/neurons"
import { Badge } from "../ui/badge"
import { formatDateTime } from "@/lib/utils"

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
        header: "Created At",
        cell: ({ getValue }) => formatDateTime(getValue<string>())
    },
    {
        accessorKey: "last_connection",
        header: "Last Connection",
        cell: ({ getValue }) => formatDateTime(getValue<string>())
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
            const status = getValue<Neuron["status"]>()
            if (status === "online") {
                return <Badge variant="default" className="bg-green-600 text-white hover:bg-green-700">Online</Badge>
            }
            return <Badge variant="destructive">Offline</Badge>
        },
    }
]

