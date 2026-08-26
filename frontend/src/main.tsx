import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import "./index.css";
import { router } from "./router";
import { AppDataProvider } from "./state/app-data-provider";
import { AuthProvider } from "./state/auth-provider";
import { AuthGate } from "./components/auth/auth-gate";
import { ThemeProvider } from "./components/layout/theme-provider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AuthGate>
          <AppDataProvider>
            <RouterProvider router={router} />
          </AppDataProvider>
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
