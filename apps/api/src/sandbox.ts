import vm from "node:vm";

// ─── Config ──────────────────────────────────────────────

const SANDBOX = {
  timeoutMs: 5_000,
  maxOutputLen: 10_000,
} as const;

// ─── Types ───────────────────────────────────────────────

export interface SandboxResult {
  stdout: string;
  stderr: string;
  result: string;
  timeMs: number;
  error?: string;
}

// ─── JS/TS Runner (node:vm — no fs, no require, no network) ─

export async function runJavaScript(
  userCode: string,
  testInput: string,
): Promise<SandboxResult> {
  const start = performance.now();

  const logs: string[] = [];
  const errors: string[] = [];

  // Build a minimal context — only console, nothing else.
  // No require, no process, no Bun, no fetch, no setTimeout, no import.
  const context = vm.createContext({
    console: {
      log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
      error: (...args: unknown[]) => errors.push(args.map(String).join(" ")),
      warn: (...args: unknown[]) => errors.push(args.map(String).join(" ")),
      info: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
    },
    // Basic globals needed for algorithms
    Array,
    Object,
    Map,
    Set,
    String,
    Number,
    Boolean,
    Math,
    JSON,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Infinity,
    NaN,
    undefined,
    null: null,
    Error,
    TypeError,
    RangeError,
    SyntaxError,
    RegExp,
    Date,
    Symbol,
    WeakMap,
    WeakSet,
    Promise,
    Float32Array,
    Float64Array,
    Int8Array,
    Int16Array,
    Int32Array,
    Uint8Array,
    Uint16Array,
    Uint32Array,
  });

  try {
    // Step 1: Run user code (defines functions)
    vm.runInContext(userCode, context, { timeout: SANDBOX.timeoutMs });

    // Step 2: Auto-detect & call the function, return result
    // Convert newline-separated args to comma-separated for JS array literal
    const argsStr = testInput
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .join(",");

    const harness = `
      (function() {
        // Auto-detect user-defined functions (skip builtins)
        const __builtins = new Set([
          "console","Array","Object","Map","Set","String","Number","Boolean",
          "Math","JSON","parseInt","parseFloat","isNaN","isFinite","Infinity",
          "NaN","undefined","Error","TypeError","RangeError","SyntaxError",
          "RegExp","Date","Symbol","WeakMap","WeakSet","Promise",
          "Float32Array","Float64Array","Int8Array","Int16Array","Int32Array",
          "Uint8Array","Uint16Array","Uint32Array",
        ]);
        let __fn = null;
        const __keys = Object.getOwnPropertyNames(this).filter(n => !n.startsWith("__") && !__builtins.has(n));
        for (const n of __keys) {
          try { const v = eval(n); if (typeof v === "function") { __fn = v; break; } } catch {}
        }
        if (!__fn) return "__NO_FN__";
        try {
          const __args = [${argsStr}];
          const __result = __fn(...__args);
          return JSON.stringify(__result);
        } catch (e) {
          return "__ERR__:" + (e.message || String(e));
        }
      })();
    `;

    const rawResult = vm.runInContext(harness, context, { timeout: SANDBOX.timeoutMs });
    const timeMs = Math.round(performance.now() - start);

    const resultStr = String(rawResult ?? "undefined");

    if (resultStr === "__NO_FN__") {
      return { stdout: join(logs), stderr: join(errors), result: "", timeMs, error: "Çalıştırılabilir fonksiyon bulunamadı" };
    }
    if (resultStr.startsWith("__ERR__:")) {
      const errMsg = resultStr.slice("__ERR__:".length);
      return { stdout: join(logs), stderr: errMsg, result: "", timeMs, error: errMsg };
    }

    return { stdout: join(logs), stderr: join(errors), result: resultStr, timeMs };
  } catch (err) {
    const timeMs = Math.round(performance.now() - start);
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes("Script execution timed out")) {
      return { stdout: join(logs), stderr: "", result: "", timeMs, error: "Zaman limiti aşıldı (5s)" };
    }

    return { stdout: join(logs), stderr: message, result: "", timeMs, error: message };
  }
}

function join(arr: string[]): string {
  return arr.join("\n").slice(0, SANDBOX.maxOutputLen).trim();
}

// ─── Python Runner (subprocess — only option) ────────────

export async function runPython(
  userCode: string,
  testInput: string,
): Promise<SandboxResult> {
  const start = performance.now();
  const { mkdtemp, rm } = await import("fs/promises");
  const { join: pathJoin } = await import("path");
  const { tmpdir } = await import("os");

  const dir = await mkdtemp(pathJoin(tmpdir(), "ffh-py-"));
  const filePath = pathJoin(dir, "code.py");

  // Convert newline-separated args to comma-separated for Python list
  const pyArgsStr = testInput
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join(",");

  const wrapped = `
import json, sys

${userCode}

__fn = None
for __name in list(dir()):
    __obj = eval(__name)
    if (
        callable(__obj)
        and not __name.startswith("_")
        and not isinstance(__obj, type)
        and __name not in ("json", "sys", "print", "input", "open", "exec", "eval", "compile", "__import__")
    ):
        __fn = __obj
        break

try:
    __args = [${pyArgsStr}]
    if __fn:
        __result = __fn(*__args)
        print("__RESULT__:" + json.dumps(__result))
    else:
        print("__RESULT__:undefined")
except Exception as e:
    print(str(e), file=sys.stderr)
`;

  await Bun.write(filePath, wrapped);

  try {
    const isMac = process.platform === "darwin";
    const limits = [
      "ulimit -t 5",
      ...(!isMac ? ["ulimit -v 262144"] : []),
      "ulimit -f 1024",
    ];
    const shellCmd = [...limits, `exec python3 "${filePath}"`].join(" && ");

    const proc = Bun.spawn(["bash", "-c", shellCmd], {
      stdout: "pipe",
      stderr: "pipe",
      env: {
        PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin",
        HOME: "/tmp",
        LANG: "en_US.UTF-8",
      },
      cwd: "/tmp",
    });

    const timeout = setTimeout(() => proc.kill(), SANDBOX.timeoutMs);

    const [stdoutRaw, stderrRaw] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);

    clearTimeout(timeout);
    await proc.exited;
    const timeMs = Math.round(performance.now() - start);

    const stdout = stdoutRaw.slice(0, SANDBOX.maxOutputLen);
    const stderr = stderrRaw.slice(0, SANDBOX.maxOutputLen);

    let result = "";
    const cleanLines: string[] = [];
    for (const line of stdout.split("\n")) {
      if (line.startsWith("__RESULT__:")) {
        result = line.slice("__RESULT__:".length).trim();
      } else {
        cleanLines.push(line);
      }
    }

    return {
      stdout: cleanLines.join("\n").trim(),
      stderr: stderr.trim(),
      result,
      timeMs,
    };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
