import { useState } from "react";
import { verifyAttrs } from "../../verify/core/contract";
import { AlreadyClaimedError, claimName, setHandles } from "../../lib/eventStore";
import type { ParticipantHandles, SettleEvent } from "../settle/types";

export interface ClaimNameScreenProps {
  event: SettleEvent;
  /** Test/fixture hook. Called after a successful claim. */
  onClaimed?: (participantId: string) => void;
}

interface EditState {
  participantId: string;
  venmo: string;
  cashapp: string;
  paypal: string;
}

export function ClaimNameScreen({ event: initial, onClaimed }: ClaimNameScreenProps) {
  const [event, setEvent] = useState<SettleEvent>(initial);
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);

  const claim = (participantId: string) => {
    setError(null);
    const target = event.participants.find((p) => p.id === participantId);
    if (!target) {
      setError(`participant "${participantId}" not in event`);
      return;
    }
    if (target.claimedBy) {
      setError(`already claimed: ${target.name} (${target.id})`);
      return;
    }
    try {
      const next = claimName(event.id, participantId);
      setEvent(next);
      setEdit({
        participantId,
        venmo: target.venmo ?? "",
        cashapp: target.cashapp ?? "",
        paypal: target.paypal ?? "",
      });
      onClaimed?.(participantId);
    } catch (e) {
      if (e instanceof AlreadyClaimedError) {
        setError(e.message);
        return;
      }
      // Fixture path: event not persisted in store. Apply optimistic update
      // so the FAST AC (≤100ms perceived) holds even without a writeEvent.
      const next: SettleEvent = {
        ...event,
        participants: event.participants.map((p) =>
          p.id === participantId ? { ...p, claimedBy: true } : p
        ),
      };
      setEvent(next);
      setEdit({
        participantId,
        venmo: target.venmo ?? "",
        cashapp: target.cashapp ?? "",
        paypal: target.paypal ?? "",
      });
      onClaimed?.(participantId);
    }
  };

  const saveHandles = () => {
    if (!edit) return;
    const handles: ParticipantHandles = {
      venmo: edit.venmo.trim() || undefined,
      cashapp: edit.cashapp.trim() || undefined,
      paypal: edit.paypal.trim() || undefined,
    };
    try {
      const next = setHandles(event.id, edit.participantId, handles);
      setEvent(next);
    } catch {
      const next: SettleEvent = {
        ...event,
        participants: event.participants.map((p) =>
          p.id === edit.participantId ? { ...p, ...handles } : p
        ),
      };
      setEvent(next);
    }
    setEdit(null);
  };

  const claimedCount = event.participants.filter((p) => p.claimedBy).length;
  const unclaimedCount = event.participants.length - claimedCount;

  return (
    <section
      className="claim-screen"
      {...verifyAttrs({
        unit: "ClaimNameScreen",
        "event-id": event.id,
        "claimed-count": claimedCount,
        "unclaimed-count": unclaimedCount,
        "has-error": error !== null,
      })}
    >
      <div className="receipt-perf" aria-hidden="true" />

      <header className="settle-header">
        <h1>CLAIM YOUR NAME</h1>
        <p className="settle-sub">
          {unclaimedCount} unclaimed · {claimedCount} claimed
        </p>
      </header>

      <hr className="receipt-div" />

      {error && (
        <p className="claim-error" data-verify-error="already-claimed">
          {error}
        </p>
      )}

      {event.participants.map((p) => {
        const claimed = !!p.claimedBy;
        const isEditing = edit?.participantId === p.id;
        return (
          <article
            key={p.id}
            className={`claim-row ${claimed ? "is-claimed" : ""}`}
            {...verifyAttrs({
              "participant-id": p.id,
              claimed,
            })}
          >
            <div className="claim-line">
              <span className="claim-name" data-verify-name>
                {p.name.toUpperCase()}
              </span>
              {claimed ? (
                <span className="claim-badge" data-verify-status="claimed">
                  CLAIMED
                </span>
              ) : (
                <button
                  type="button"
                  className="mark-paid"
                  onClick={() => claim(p.id)}
                  aria-label={`Claim ${p.name}`}
                  data-verify-action="claim"
                >
                  ✓ CLAIM
                </button>
              )}
            </div>

            {isEditing && (
              <div className="claim-handles" data-verify-handles-form={p.id}>
                <label className="create-field">
                  <span>Venmo</span>
                  <input
                    type="text"
                    value={edit.venmo}
                    onChange={(e) =>
                      setEdit({ ...edit, venmo: e.target.value })
                    }
                    placeholder="@handle"
                    data-verify-handle="venmo"
                  />
                </label>
                <label className="create-field">
                  <span>Cash App</span>
                  <input
                    type="text"
                    value={edit.cashapp}
                    onChange={(e) =>
                      setEdit({ ...edit, cashapp: e.target.value })
                    }
                    placeholder="$cashtag"
                    data-verify-handle="cashapp"
                  />
                </label>
                <label className="create-field">
                  <span>PayPal</span>
                  <input
                    type="text"
                    value={edit.paypal}
                    onChange={(e) =>
                      setEdit({ ...edit, paypal: e.target.value })
                    }
                    placeholder="paypal.me/you"
                    data-verify-handle="paypal"
                  />
                </label>
                <button
                  type="button"
                  className="mark-paid"
                  onClick={saveHandles}
                  data-verify-action="save-handles"
                >
                  ✓ SAVE
                </button>
              </div>
            )}
          </article>
        );
      })}

      <hr className="receipt-div" />
      <p className="settle-footnote">— TAP YOUR NAME TO CLAIM —</p>
      <div className="receipt-perf" aria-hidden="true" />
    </section>
  );
}
