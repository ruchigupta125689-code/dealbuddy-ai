import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { config } from "../config";
import { TOOL_SCHEMAS, type ToolId, type ToolOutput } from "../tools/schemas";
import { SYSTEM_PROMPTS, TOOL_RESULT_DESCRIPTIONS } from "./prompts";

export class AIError extends Error {
  constructor(
    public code: "not_configured" | "provider_error" | "invalid_output" | "rate_limited" | "timeout" | "overloaded",
    message: string,
  ) {
    super(message);
  }
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!config.anthropic.apiKey) throw new AIError("not_configured", "AI is not configured");
  if (!client) {
    client = new Anthropic({
      apiKey: config.anthropic.apiKey,
      baseURL: config.anthropic.baseURL,
      maxRetries: 2,
      timeout: 90_000,
    });
  }
  return client;
}

const schemaCache = new Map<ToolId, Record<string, unknown>>();
export function jsonSchemaFor(tool: ToolId): Record<string, unknown> {
  const cached = schemaCache.get(tool);
  if (cached) return cached;
  const js = z.toJSONSchema(TOOL_SCHEMAS[tool].output, { target: "draft-2020-12", io: "output" }) as Record<
    string,
    unknown
  >;
  delete js.$schema;
  schemaCache.set(tool, js);
  return js;
}

export interface GenerateOptions {
  tool: ToolId;
  userMessage: string;
  detailed?: boolean;
  priority?: boolean;
}

export interface GenerateResult<T extends ToolId> {
  output: ToolOutput[T];
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

export async function generateStructured<T extends ToolId>(opts: GenerateOptions & { tool: T }): Promise<GenerateResult<T>> {
  const anthropic = getClient();
  const model = (opts.priority && config.anthropic.proModel) || config.anthropic.model;
  const maxTokens = opts.detailed ? 4000 : 2500;
  const schema = TOOL_SCHEMAS[opts.tool].output;

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: opts.userMessage }];
  let lastIssue = "";

  for (let attempt = 0; attempt < 2; attempt++) {
    let res: Anthropic.Message;
    try {
      res = await anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        system: SYSTEM_PROMPTS[opts.tool],
        messages,
        tools: [
          {
            name: "submit_result",
            description: TOOL_RESULT_DESCRIPTIONS[opts.tool],
            input_schema: jsonSchemaFor(opts.tool) as Anthropic.Tool.InputSchema,
          },
        ],
        tool_choice: { type: "tool", name: "submit_result" },
      });
    } catch (err) {
      throw mapProviderError(err);
    }

    const toolUse = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (!toolUse) {
      lastIssue = "No structured result was returned.";
    } else {
      const parsed = schema.safeParse(toolUse.input);
      if (parsed.success) {
        return {
          output: parsed.data as ToolOutput[T],
          model: res.model,
          usage: { inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens },
        };
      }
      lastIssue = parsed.error.issues
        .slice(0, 6)
        .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("; ");
      // Give the model one chance to fix its own output.
      messages.push({ role: "assistant", content: res.content });
      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUse.id,
            is_error: true,
            content: `The result did not match the required schema: ${lastIssue}. Call submit_result again with a corrected, complete result.`,
          },
        ],
      });
      continue;
    }
    if (res.stop_reason === "max_tokens") lastIssue = "The response was too long and got cut off.";
  }
  console.error(`[ai] invalid output for ${opts.tool}: ${lastIssue}`);
  throw new AIError("invalid_output", "The AI returned an incomplete result. Please try again.");
}

function mapProviderError(err: unknown): AIError {
  if (err instanceof Anthropic.APIConnectionTimeoutError) return new AIError("timeout", "The AI took too long to respond. Please try again.");
  if (err instanceof Anthropic.APIConnectionError) return new AIError("provider_error", "Could not reach the AI service. Please try again.");
  if (err instanceof Anthropic.APIError) {
    console.error(`[ai] provider error status=${err.status} type=${(err as { type?: string }).type ?? ""}`);
    if (err.status === 429) return new AIError("rate_limited", "The AI service is busy. Please try again in a minute.");
    if (err.status === 529 || err.status === 503) return new AIError("overloaded", "The AI service is temporarily overloaded. Please try again shortly.");
    if (err.status === 401 || err.status === 403) return new AIError("provider_error", "AI service authentication failed. Check ANTHROPIC_API_KEY.");
    if (err.status === 404 || err.status === 400) return new AIError("provider_error", "AI request was rejected. Check ANTHROPIC_MODEL is a valid model.");
    return new AIError("provider_error", "The AI service returned an error. Please try again.");
  }
  console.error("[ai] unexpected error", err instanceof Error ? err.message : err);
  return new AIError("provider_error", "Could not reach the AI service. Please try again.");
}
