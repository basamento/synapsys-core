import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { HomePage } from "./pages/neurons/neurons-page";
import { WorkersPage } from "./pages/workers/workers-page";
import { ProcessesPage } from "./pages/processes/processes-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "workers",
        element: <WorkersPage />,
      },
      {
        path: "processes",
        element: <ProcessesPage />,
      },
    ],
  },
]);
