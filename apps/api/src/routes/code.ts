import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import { z } from "zod";
import { runJavaScript, runPython } from "../sandbox";
import type { TestResult, CodeExecutionResult } from "@ffh/types";

export const codeRoutes = new Hono();

// ─── Helpers ─────────────────────────────────────────────

function normalizeOutput(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value));
  } catch {
    return value.trim();
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  POST /code/execute — Run code in sandbox
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

codeRoutes.post(
  "/execute",
  describeRoute({
    tags: ["Code"],
    summary: "Execute code against test cases in an isolated sandbox (isolated-vm for JS/TS, subprocess for Python)",
    responses: {
      200: { description: "Execution results" },
      400: { description: "Invalid input" },
    },
  }),
  validator(
    "json",
    z.object({
      code: z.string().min(1).max(50_000),
      language: z.enum(["javascript", "typescript", "python"]),
      testCases: z.array(
        z.object({
          input: z.string(),
          expectedOutput: z.string(),
        }),
      ),
    }),
  ),
  async (c) => {
    const { code, language, testCases } = c.req.valid("json");

    const results: TestResult[] = [];
    let totalStdout = "";
    let totalStderr = "";
    let totalTimeMs = 0;
    let executionError: string | undefined;

    for (const tc of testCases) {
      const isJS = language === "javascript" || language === "typescript";
      const execution = isJS
        ? await runJavaScript(code, tc.input)
        : await runPython(code, tc.input);

      totalTimeMs += execution.timeMs;

      if (execution.error) {
        executionError = execution.error;
        results.push({
          input: tc.input,
          expected: tc.expectedOutput,
          actual: "Error",
          passed: false,
        });
        if (execution.stderr) totalStderr += execution.stderr + "\n";
        continue;
      }

      if (execution.stdout) totalStdout += execution.stdout + "\n";
      if (execution.stderr) totalStderr += execution.stderr + "\n";

      const normalizedActual = normalizeOutput(execution.result);
      const normalizedExpected = normalizeOutput(tc.expectedOutput);
      const passed = normalizedActual === normalizedExpected;

      results.push({
        input: tc.input,
        expected: tc.expectedOutput,
        actual: execution.result || "(no output)",
        passed,
      });
    }

    const response: CodeExecutionResult = {
      results,
      stdout: totalStdout.trim(),
      stderr: totalStderr.trim(),
      executionTimeMs: totalTimeMs,
      error: executionError,
    };

    return c.json(response);
  },
);
