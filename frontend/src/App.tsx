import { Outlet } from "react-router-dom"

import { ThemeProvider } from "./components/layout/theme-provider"
import { TopBar } from "./components/layout/top-bar"
import { SideBar } from "./components/layout/side-bar"
import { SidebarInset, SidebarProvider } from "./components/ui/sidebar"


function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="flex h-svh flex-col overflow-hidden">
        <TopBar />
        <SidebarProvider className="min-h-0 flex-1 overflow-hidden px-4 pb-4 pt-3 sm:px-6">
          <SideBar />
          <SidebarInset className="min-h-0 overflow-hidden pl-3 sm:pl-4">
            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card shadow-xs">
              <div className="min-h-0 flex-1 overflow-hidden p-4 sm:p-6">
                <Outlet />
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </ThemeProvider>
  )
}

export default App
