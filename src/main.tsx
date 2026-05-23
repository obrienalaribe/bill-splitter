import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Side-effect imports: register verifiers and unit specs.
import "./verify/verifiers";
import "./verify/specs";

import { AddExpenseRoute, App, ClaimRoute, EventRoute, SettleRoute } from "./App";
import { Dashboard } from "./verify/harness/Dashboard";
import { UnitPage } from "./verify/harness/UnitPage";
import { installVerifyHandle } from "./verify/harness/handle";
import "./styles.css";
import "./features/settle/settle.css";
import "./features/create/create.css";
import "./features/claim/claim.css";
import "./features/home/home.css";

installVerifyHandle();

const router = createBrowserRouter(
  [
    { path: "/", element: <App /> },
    { path: "/e/:eventId", element: <EventRoute /> },
    { path: "/e/:eventId/add", element: <AddExpenseRoute /> },
    { path: "/e/:eventId/settle", element: <SettleRoute /> },
    { path: "/e/:eventId/claim", element: <ClaimRoute /> },
    { path: "/verify", element: <Dashboard /> },
    { path: "/verify/:unitId/:fixtureId", element: <UnitPage /> },
  ],
  { future: { v7_relativeSplatPath: true } }
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} future={{ v7_startTransition: true }} />
  </StrictMode>
);
