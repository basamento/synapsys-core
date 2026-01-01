import type { ColumnDef } from "@tanstack/react-table"
import { type Neuron } from "@/api/neurons"
import { Badge } from "../ui/badge"
import { formatDateTime } from "@/lib/utils"
import { StartNeuronButton } from "./start-neuron-button"
import { StopNeuronButton } from "./stop-neuron-button"

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
        accessorKey: "lastTouch",
        header: "Last Touch",
        cell: ({ getValue }) => formatDateTime(getValue<string>())
    },
    {
        accessorKey: "type",
        header: "Type",
        cell: ({ getValue }) => {
            const type = getValue<Neuron["type"]>()
            return <Badge variant="default">
                {type === "endless" ? "Endless" : "Progressive"}
            </Badge>
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
            const status = getValue<Neuron["status"]>()
            if (status === "active") {
                return <Badge variant="default" className="bg-green-600 text-white hover:bg-green-700">Active</Badge>
            }
            return <Badge variant="destructive">Inactive</Badge>
        },
    },
    {
        accessorKey: "currentState",
        header: "State",
        cell: ({ getValue }) => {
            const state = getValue<Neuron["currentState"]>()
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
        // header: "Actions",
        cell: ({ row }) => (
            <div className="flex gap-2">
                <StartNeuronButton neuron={row.original} />
                <StopNeuronButton neuron={row.original} />
            </div>
        ),
    },
]

