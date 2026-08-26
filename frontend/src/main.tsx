import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import "./index.css";
import { router } from "./router";
import { AppDataProvider } from "./state/app-data-provider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppDataProvider>
      <RouterProvider router={router} />
    </AppDataProvider>
  </StrictMode>,
);
