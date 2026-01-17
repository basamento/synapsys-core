import { Separator } from "@/components/ui/separator"
import { useNeurons } from "./components/neurons/useNeurons"
import { NeuronCard } from "./components/neurons/neuron-card"
import { NeuronsHeader } from "./components/layout/neurons-header"
import { ThemeProvider } from "./components/layout/theme-provider"
import { TopBar } from "./components/layout/top-bar"


function App() {

  const { neurons } = useNeurons()

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <main className="flex-1 p-6">
          <div className="rounded-xl border bg-card">
            <div className="p-4 sm:p-6">
              <NeuronsHeader total={neurons.length} />
              <Separator className="my-4" />
              <div className="flex flex-col gap-3">
                {neurons.map((neuron) => (
                  <NeuronCard neuron={neuron} />
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
