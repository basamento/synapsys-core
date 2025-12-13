import type { ColumnDef } from "@tanstack/react-table"
import { type Neuron } from "@/api/neurons"
import { Badge } from "../ui/badge"
import { formatDateTime } from "@/lib/utils"
import { StartNeuronButton } from "./start-neuron-button"

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
    },
    {
        accessorKey: "desired_state",
        header: "State",
        cell: ({ getValue }) => {
            const state = getValue<Neuron["desired_state"]>()
            if (state === "idle") {
                return (
                    <Badge className="bg-blue-600 text-white hover:bg-blue-700">
                        Idle
                    </Badge>
                )
            }
            if (state === "running") {
                return (
                    <Badge className="bg-violet-600 text-white hover:bg-violet-700">
                        Running
                    </Badge>
                )
            }
            return null
        },
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
            <StartNeuronButton neuron={row.original} />
        ),
    },
]

