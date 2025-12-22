import { ThemeProvider } from "@/components/theme-provider"
// import { NeuronsTable } from "./components/neurons-table/neurons-table"
// import { useNeurons } from "./hooks/useNeurons"
// import { columns } from "./components/neurons-table/columns"
import { TopBar } from "@/components/top-bar"

function App() {

  console.log("🚀 App render");

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <main className="flex-1 p-6">
          <div className="rounded-xl border bg-card">
            {/* <NeuronsTable columns={columns} data={data} /> */}
          </div>
        </main>

      </div>
    </ThemeProvider>
  )
}

export default App