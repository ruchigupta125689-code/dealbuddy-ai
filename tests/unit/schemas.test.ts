import { describe, expect, it } from "vitest";
import { z } from "zod";
import { DEMO_OUTPUTS, EXAMPLE_INPUTS, templateRateOutput } from "@/lib/demo";
import { estimateRate } from "@/lib/rates";
import { TOOL_IDS, TOOL_SCHEMAS, fieldErrors } from "@/lib/tools/schemas";

describe("tool schemas", () => {
  it("accepts every example input", () => {
    for (const id of TOOL_IDS) {
      const r = TOOL_SCHEMAS[id].input.safeParse(EXAMPLE_INPUTS[id]);
      expect(r.success, `${id}: ${r.success ? "" : JSON.stringify(r.error.issues)}`).toBe(true);
    }
  });

  it("every demo output matches its output schema", () => {
    for (const id of ["reply", "negotiate", "risk-check", "pitch"] as const) {
      const r = TOOL_SCHEMAS[id].output.safeParse(DEMO_OUTPUTS[id]);
      expect(r.success, `${id}: ${r.success ? "" : JSON.stringify(r.error.issues)}`).toBe(true);
    }
    const i = TOOL_SCHEMAS["rate-calculator"].input.parse(EXAMPLE_INPUTS["rate-calculator"]);
    const t = templateRateOutput(estimateRate(i), i);
    expect(TOOL_SCHEMAS["rate-calculator"].output.safeParse(t).success).toBe(true);
  });

  it("demo risk output covers all 12 areas", () => {
    const r = DEMO_OUTPUTS["risk-check"] as { areas: unknown[] };
    expect(r.areas).toHaveLength(12);
  });

  it("rejects empty submissions with friendly field errors", () => {
    const reply = TOOL_SCHEMAS.reply.input.safeParse({ brandEmail: "", tone: "professional", goal: "accept" });
    expect(reply.success).toBe(false);
    if (!reply.success) expect(fieldErrors(reply.error).brandEmail).toMatch(/Paste/);

    const neg = TOOL_SCHEMAS.negotiate.input.safeParse({});
    expect(neg.success).toBe(false);
    if (!neg.success) expect(Object.keys(fieldErrors(neg.error))).toEqual(expect.arrayContaining(["proposedPayment", "followers", "niche"]));

    const risk = TOOL_SCHEMAS["risk-check"].input.safeParse({ text: "too short" });
    expect(risk.success).toBe(false);

    const pitch = TOOL_SCHEMAS.pitch.input.safeParse({ tone: "friendly", collabType: "ugc" });
    expect(pitch.success).toBe(false);
    if (!pitch.success) expect(Object.keys(fieldErrors(pitch.error))).toEqual(expect.arrayContaining(["creatorName", "brandName", "followers"]));
  });

  it("requires at least one deliverable", () => {
    const r = TOOL_SCHEMAS["rate-calculator"].input.safeParse({ ...EXAMPLE_INPUTS["rate-calculator"], reels: 0, stories: 0, posts: 0 });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).reels).toMatch(/deliverable/);
  });

  it("rejects oversized and malformed values", () => {
    expect(TOOL_SCHEMAS.reply.input.safeParse({ ...EXAMPLE_INPUTS.reply, brandEmail: "x".repeat(8001) }).success).toBe(false);
    expect(TOOL_SCHEMAS.reply.input.safeParse({ ...EXAMPLE_INPUTS.reply, tone: "rude" }).success).toBe(false);
    expect(TOOL_SCHEMAS.negotiate.input.safeParse({ ...EXAMPLE_INPUTS.negotiate, followers: -5 }).success).toBe(false);
    expect(TOOL_SCHEMAS.negotiate.input.safeParse({ ...EXAMPLE_INPUTS.negotiate, reels: 1.5 }).success).toBe(false);
  });

  it("produces an object JSON schema for every tool output (for Claude tool use)", () => {
    for (const id of TOOL_IDS) {
      const js = z.toJSONSchema(TOOL_SCHEMAS[id].output, { target: "draft-2020-12", io: "output" }) as { type: string; required: string[] };
      expect(js.type).toBe("object");
      expect(js.required.length).toBeGreaterThan(1);
    }
  });
});
