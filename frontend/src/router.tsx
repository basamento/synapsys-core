import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { SummaryPage } from "./pages/summary/summary-page";
import { WorkersPage } from "./pages/workers/workers-page";
import { ProcessesPage } from "./pages/processes/processes-page";
import { ExecutionsPage } from "./pages/executions/executions-page";
import { ActionsPage } from "./pages/actions/actions-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <SummaryPage />,
      },
      {
        path: "workers",
        element: <WorkersPage />,
      },
      {
        path: "processes",
        element: <ProcessesPage />,
      },
      {
        path: "executions",
        element: <ExecutionsPage />,
      },
      {
        path: "actions",
        element: <ActionsPage />,
      },
    ],
  },
]);
