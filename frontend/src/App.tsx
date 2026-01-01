import { ThemeProvider } from "@/components/theme-provider"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useNeurons } from "./components/neurons/useNeurons"
import { TopBar } from "./components/top-bar"
import { StartNeuronButton } from "./components/neurons-table/start-neuron-button"
import { StopNeuronButton } from "./components/neurons-table/stop-neuron-button"
import { formatDateTime } from "./lib/utils"
import { SyncCountdown } from "./components/sync-countdown"

// If you want, you can replace these with lucide icons later.
function KeyLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
      {children}
    </span>
  )
}

function ValueText({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium">{children}</span>
}

function TypeBadge({ type }: { type: "endless" | "progressive" }) {
  return (
    <Badge variant="secondary" className="whitespace-nowrap">
      {type === "endless" ? "Endless" : "Progressive"}
    </Badge>
  )
}

function StatusBadge({ status }: { status: "active" | "inactive" }) {
  if (status === "active") {
    return (
      <Badge className="bg-green-600 text-white hover:bg-green-700 whitespace-nowrap">
        Active
      </Badge>
    )
  }
  return (
    <Badge variant="destructive" className="whitespace-nowrap">
      Inactive
    </Badge>
  )
}

function StateBadge({ state }: { state: "idle" | "running" | null }) {
  if (state === "idle") {
    return (
      <Badge className="bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap">
        Idle
      </Badge>
    )
  }
  if (state === "running") {
    return (
      <Badge className="bg-violet-600 text-white hover:bg-violet-700 whitespace-nowrap">
        Running
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="whitespace-nowrap">
      —
    </Badge>
  )
}

function App() {

  const { neurons } = useNeurons()

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen flex flex-col">
        <TopBar />

        <main className="flex-1 p-6">
          <div className="rounded-xl border bg-card">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-4 pr-2">
                <div>
                  <h1 className="text-lg font-semibold">Neurons</h1>
                  <p className="text-sm text-muted-foreground">
                    {neurons.length} total
                  </p>
                </div>
                <SyncCountdown />
              </div>

              <Separator className="my-4" />

              <div className="flex flex-col gap-3">
                {neurons.map((neuron) => (
                  <Card
                    key={neuron.id}
                    className="p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex flex-col gap-3">
                      {/* Top line: Name + badges + actions */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-semibold truncate">
                              {neuron.name}
                            </h2>

                            <div className="flex items-center gap-2 flex-wrap">
                              <TypeBadge type={neuron.type} />
                              <StatusBadge status={neuron.status} />
                              <StateBadge state={neuron.currentState ?? null} />
                            </div>
                          </div>

                          <div className="mt-1 text-xs text-muted-foreground">
                            ID:{" "}
                            <span className="font-mono text-foreground/90">
                              {neuron.id}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:justify-end">
                          <StartNeuronButton neuron={neuron} />
                          <StopNeuronButton neuron={neuron} />
                        </div>
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-lg bg-muted/40 p-3">
                          <div className="flex flex-col gap-1">
                            <KeyLabel>Last Touch</KeyLabel>
                            <ValueText>
                              {formatDateTime(neuron.lastTouch)}
                            </ValueText>
                          </div>
                        </div>

                        <div className="rounded-lg bg-muted/40 p-3">
                          <div className="flex flex-col gap-1">
                            <KeyLabel>Type</KeyLabel>
                            <ValueText>
                              {neuron.type === "endless"
                                ? "Endless"
                                : "Progressive"}
                            </ValueText>
                          </div>
                        </div>

                        <div className="rounded-lg bg-muted/40 p-3">
                          <div className="flex flex-col gap-1">
                            <KeyLabel>Status</KeyLabel>
                            <ValueText>
                              {neuron.status === "active" ? "Active" : "Inactive"}
                            </ValueText>
                          </div>
                        </div>

                        <div className="rounded-lg bg-muted/40 p-3">
                          <div className="flex flex-col gap-1">
                            <KeyLabel>State</KeyLabel>
                            <ValueText>
                              {neuron.currentState === "idle"
                                ? "Idle"
                                : neuron.currentState === "running"
                                  ? "Running"
                                  : "—"}
                            </ValueText>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                {neurons.length === 0 && (
                  <div className="text-sm text-muted-foreground py-10 text-center">
                    No neurons yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}

export default App
