import { Outlet } from "react-router-dom";

import { ThemeProvider } from "@/components/layout/theme-provider";
import { TopBar } from "@/components/layout/top-bar";
import { SideBar } from "@/components/layout/side-bar";
import { TabBar } from "@/components/layout/tab-bar";
import { useIsMobile } from "@/hooks/use-layout";

/**
 * The shell every view sits in.
 *
 * Desktop: full-bleed top bar, then a sidebar column and a fluid content
 * column. Mobile: top bar, scrolling content, bottom tab bar. The switch is
 * one breakpoint — there is no third layout.
 */
function App() {
  return (
    <ThemeProvider>
      <Shell />
    </ThemeProvider>
  );
}

function Shell() {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-canvas">
      <TopBar />

      <div className="flex min-h-0 flex-1 gap-(--shell-gap) overflow-y-auto px-4 py-4 sm:px-(--shell-pad-x) sm:py-(--shell-pad-y)">
        {!isMobile && <SideBar />}
        <main className="min-w-0 grow pb-1.5">
          <Outlet />
        </main>
      </div>

      {isMobile && <TabBar />}
    </div>
  );
}

export default App;
