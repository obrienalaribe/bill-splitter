import { useMemo, useState } from "react";
import { verifyAttrs } from "../../verify/core/contract";
import { makeEventId, makeParticipantId, writeEvent } from "../../lib/eventStore";
import type { Participant, SettleEvent } from "../settle/types";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"] as const;
type Currency = (typeof CURRENCIES)[number];

export interface CreateEventScreenProps {
  /** Optional override for tests / fixtures so we don't touch real navigation. */
  onCreate?: (event: SettleEvent) => void;
}

function parseParticipants(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function CreateEventScreen({ onCreate }: CreateEventScreenProps) {
  const [title, setTitle] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [participantsRaw, setParticipantsRaw] = useState("");

  const names = useMemo(() => parseParticipants(participantsRaw), [participantsRaw]);
  const lowerNames = useMemo(() => names.map((n) => n.toLowerCase()), [names]);
  const hasDuplicate = lowerNames.some((n, i) => lowerNames.indexOf(n) !== i);
  const titleValid = title.trim().length > 0;
  const enoughPeople = names.length >= 2;
  const valid = titleValid && enoughPeople && !hasDuplicate;

  const submit = () => {
    if (!valid) return;
    const taken = new Set<string>();
    const participants: Participant[] = names.map((name) => {
      const id = makeParticipantId(name, taken);
      taken.add(id);
      return { id, name };
    });
    const event: SettleEvent = {
      id: makeEventId(title.trim()),
      title: title.trim(),
      currency,
      participants,
      debts: [],
    };
    writeEvent(event);
    if (onCreate) onCreate(event);
    else window.location.assign(`/e/${event.id}`);
  };

  return (
    <section
      className="create-event"
      {...verifyAttrs({
        unit: "CreateEventScreen",
        "participant-count": names.length,
        currency,
        valid,
        "title-len": title.trim().length,
        "has-duplicate": hasDuplicate,
      })}
    >
      <div className="receipt-perf" aria-hidden="true" />

      <header className="settle-header">
        <h1>NEW EVENT</h1>
        <p className="settle-sub">START A SPLIT · NO ACCOUNT NEEDED</p>
      </header>

      <hr className="receipt-div" />

      <label className="create-field">
        <span>Event title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Saturday Night Out"
          data-verify-field="title"
        />
      </label>

      <label className="create-field">
        <span>Currency</span>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          data-verify-field="currency"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="create-field">
        <span>Participants (comma-separated, 2 or more)</span>
        <input
          type="text"
          value={participantsRaw}
          onChange={(e) => setParticipantsRaw(e.target.value)}
          placeholder="Alex, Sam, Jordan, Riley"
          data-verify-field="participants"
        />
        {hasDuplicate && (
          <em data-verify-error="duplicate">duplicate names not allowed</em>
        )}
        {participantsRaw.length > 0 && !enoughPeople && (
          <em data-verify-error="too-few">need at least 2 participants</em>
        )}
      </label>

      <button
        type="button"
        className="mark-paid"
        disabled={!valid}
        aria-label="Create event"
        onClick={submit}
        data-verify-action="create"
      >
        ✓ CREATE EVENT
      </button>

      <div className="receipt-perf" aria-hidden="true" />
    </section>
  );
}
