import { createElement } from "react";
import { z } from "zod";
import { registerUnit } from "../core/registry";
import type { CreateEventScreenProps } from "../../features/create/CreateEventScreen";
import { CreateEventScreen } from "../../features/create/CreateEventScreen";

const PropsSchema = z.object({
  onCreate: z.function().optional(),
});

registerUnit<CreateEventScreenProps>({
  id: "CreateEventScreen",
  title: "CreateEventScreen",
  description: "New-event form: title, currency, comma-separated participants.",
  kind: "feature",
  render: (props) => createElement(CreateEventScreen, props),
  propsSchema: PropsSchema,
  fixtures: [
    {
      id: "empty",
      description: "Pristine form, no input yet — submit must be disabled.",
      props: {},
    },
    {
      id: "happy-path",
      description: "Valid title + 4 unique participants — submit clickable.",
      props: {},
      act: async ({ type }) => {
        await type('[data-verify-field="title"]', "Saturday Night Out");
        await type('[data-verify-field="participants"]', "Alex, Sam, Jordan, Riley");
      },
    },
    {
      id: "single-participant",
      probe: true,
      description: "Probe: only one participant — invariant 'enough-people' should fail (button stays disabled).",
      props: {},
      act: async ({ type }) => {
        await type('[data-verify-field="title"]', "Lonely Dinner");
        await type('[data-verify-field="participants"]', "Alex");
      },
    },
    {
      id: "duplicate-participants",
      probe: true,
      description: "Probe: duplicate names — invariant 'no-duplicate' should fail (data-verify-has-duplicate=true).",
      props: {},
      act: async ({ type }) => {
        await type('[data-verify-field="title"]', "Bad Event");
        await type('[data-verify-field="participants"]', "Alex, alex, Sam");
      },
    },
    {
      id: "whitespace-title",
      probe: true,
      description: "Probe: title is only whitespace — submit must stay disabled (titleValid false).",
      props: {},
      act: async ({ type }) => {
        await type('[data-verify-field="title"]', "   ");
        await type('[data-verify-field="participants"]', "Alex, Sam");
      },
    },
  ],
  invariants: [
    {
      id: "submit-disabled-when-invalid",
      description: "Create button must be disabled exactly when data-verify-valid='false'.",
      check: ({ root, contract }) => {
        const btn = root.querySelector<HTMLButtonElement>('[data-verify-action="create"]');
        if (!btn) return "no create button";
        const declaredValid = contract.valid === "true";
        const enabled = !btn.disabled;
        return (
          declaredValid === enabled ||
          `valid=${declaredValid} but button.disabled=${btn.disabled}`
        );
      },
    },
    {
      id: "participant-count-matches-contract",
      description: "data-verify-participant-count equals the number of comma-separated non-empty tokens entered.",
      check: ({ root, contract }) => {
        const input = root.querySelector<HTMLInputElement>('[data-verify-field="participants"]');
        if (!input) return "no participants input";
        const rendered = input.value
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0).length;
        return (
          Number(contract["participant-count"]) === rendered ||
          `contract=${contract["participant-count"]} but parsed=${rendered}`
        );
      },
    },
    {
      id: "duplicate-flag-renders-error",
      description: "When has-duplicate=true the duplicate error element is present.",
      onlyFixtures: ["duplicate-participants"],
      check: ({ root, contract }) => {
        if (contract["has-duplicate"] !== "true") return `expected has-duplicate=true, got ${contract["has-duplicate"]}`;
        const err = root.querySelector('[data-verify-error="duplicate"]');
        return !!err || "missing [data-verify-error='duplicate'] element";
      },
    },
    {
      id: "submit-enabled-on-happy-path",
      description: "happy-path fixture must end with valid=true and an enabled button.",
      onlyFixtures: ["happy-path"],
      check: ({ root, contract }) => {
        if (contract.valid !== "true") return `valid=${contract.valid}, expected true`;
        const btn = root.querySelector<HTMLButtonElement>('[data-verify-action="create"]');
        if (!btn) return "no create button";
        return !btn.disabled || "button is disabled despite valid=true";
      },
    },
  ],
});
