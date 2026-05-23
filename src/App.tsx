import { Link, useParams } from "react-router-dom";
import { CreateEventScreen } from "./features/create/CreateEventScreen";
import { ClaimNameScreen } from "./features/claim/ClaimNameScreen";
import { SettleScreen } from "./features/settle/SettleScreen";
import { readEvent } from "./lib/eventStore";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <nav className="app-nav">
        <Link to="/">
          <strong>Splittr</strong>
        </Link>
        <Link to="/verify">→ verification dashboard</Link>
      </nav>
      {children}
      <footer className="app-foot">
        <p>
          No accounts. Just a link. Every screen emits a <code>data-verify-*</code>{" "}
          DOM contract — open <code>/verify</code> to see what an agent observes.
        </p>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <Shell>
      <CreateEventScreen />
    </Shell>
  );
}

export function EventRoute() {
  const { eventId = "" } = useParams();
  const event = readEvent(eventId);
  if (!event) {
    return (
      <Shell>
        <section className="settle-screen" data-verify-unit="EventNotFound">
          <header className="settle-header">
            <h1>EVENT NOT FOUND</h1>
            <p className="settle-sub">id: {eventId}</p>
          </header>
          <Link to="/" className="mark-paid">← BACK TO CREATE</Link>
        </section>
      </Shell>
    );
  }
  return (
    <Shell>
      <SettleScreen event={event} />
    </Shell>
  );
}

export function ClaimRoute() {
  const { eventId = "" } = useParams();
  const event = readEvent(eventId);
  if (!event) {
    return (
      <Shell>
        <section className="settle-screen" data-verify-unit="EventNotFound">
          <header className="settle-header">
            <h1>EVENT NOT FOUND</h1>
            <p className="settle-sub">id: {eventId}</p>
          </header>
          <Link to="/" className="mark-paid">← BACK TO CREATE</Link>
        </section>
      </Shell>
    );
  }
  return (
    <Shell>
      <ClaimNameScreen event={event} />
    </Shell>
  );
}
