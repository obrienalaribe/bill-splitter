import { Link } from "react-router-dom";
import { SettleScreen } from "./features/settle/SettleScreen";
import type { SettleEvent } from "./features/settle/types";

const DEMO_EVENT: SettleEvent = {
  id: "sat-night-out",
  title: "Saturday Night Out",
  currency: "USD",
  participants: [
    { id: "alex", name: "Alex" },
    { id: "sam", name: "Sam" },
    { id: "jordan", name: "Jordan" },
    { id: "riley", name: "Riley" },
  ],
  debts: [
    { id: "d1", fromId: "riley", toId: "alex", amountCents: 7500, status: "open" },
    { id: "d2", fromId: "jordan", toId: "alex", amountCents: 3000, status: "open" },
    { id: "d3", fromId: "jordan", toId: "sam", amountCents: 500, status: "paid", paidAt: "02:14" },
  ],
};

export function App() {
  return (
    <div className="app-shell">
      <nav className="app-nav">
        <strong>Splittr</strong>
        <Link to="/verify">→ verification dashboard</Link>
      </nav>
      <SettleScreen event={DEMO_EVENT} />
      <footer className="app-foot">
        <p>
          Every screen emits a <code>data-verify-*</code> DOM contract.
          Open <code>/verify</code> or call <code>window.__verify</code> in the
          console to see how an agent observes this app.
        </p>
      </footer>
    </div>
  );
}
