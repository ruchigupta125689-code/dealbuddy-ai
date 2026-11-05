/**
 * Mock of the Anthropic Messages API for end-to-end tests. Returns a forced
 * tool_use result that matches each tool's schema, plus failure modes
 * triggered by markers in the user message.
 */
import { createServer } from "node:http";
import { writeFileSync } from "node:fs";
import { DEMO_OUTPUTS, EXAMPLE_INPUTS, templateRateOutput } from "../../src/lib/demo";
import { estimateRate } from "../../src/lib/rates";
import { rateInput } from "../../src/lib/tools/schemas";

const rate = templateRateOutput(estimateRate(rateInput.parse(EXAMPLE_INPUTS["rate-calculator"])), { paidAds: true, rawFootage: false, exclusivity: "none" });
const byDescription: [RegExp, unknown][] = [
  [/brand email reply/, DEMO_OUTPUTS.reply],
  [/negotiation assessment/, DEMO_OUTPUTS.negotiate],
  [/risk review/, DEMO_OUTPUTS["risk-check"]],
  [/brand pitch/, DEMO_OUTPUTS.pitch],
  [/calculated estimate/, rate],
];

let calls = 0;
const port = Number(process.env.MOCK_PORT ?? 4010);
createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    calls++;
    const json = JSON.parse(body || "{}");
    writeFileSync("/tmp/mock-last-request.json", JSON.stringify({ headers: req.headers, body: json, calls }, null, 2));
    const first = String(json.messages?.[0]?.content ?? "");
    const isRetry = (json.messages?.length ?? 0) > 1;
    const send = (status: number, payload: unknown) => {
      res.writeHead(status, { "content-type": "application/json", "request-id": `req_${calls}` });
      res.end(JSON.stringify(payload));
    };
    if (first.includes("FORCE_500")) return send(500, { type: "error", error: { type: "api_error", message: "boom" } });
    if (first.includes("FORCE_429")) return send(429, { type: "error", error: { type: "rate_limit_error", message: "slow" } });
    const desc: string = json.tools?.[0]?.description ?? "";
    const match = byDescription.find(([re]) => re.test(desc));
    let input: unknown = match ? structuredClone(match[1]) : {};
    if (first.includes("FORCE_INVALID_ALWAYS") || (first.includes("FORCE_INVALID_ONCE") && !isRetry)) input = { body: 42 };
    send(200, {
      id: `msg_${calls}`,
      type: "message",
      role: "assistant",
      model: json.model,
      stop_reason: "tool_use",
      stop_sequence: null,
      content: [{ type: "tool_use", id: `toolu_${calls}`, name: "submit_result", input }],
      usage: { input_tokens: 100, output_tokens: 200 },
    });
  });
}).listen(port, () => console.log(`mock anthropic on ${port}`));
