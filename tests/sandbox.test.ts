import { describe, it, expect } from "bun:test";
import { runJavaScript, runPython, type SandboxResult } from "../apps/api/src/sandbox";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  JavaScript Sandbox
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("runJavaScript", () => {
  // ─── Basics ────────────────────────────────────────────

  it("should run a simple twoSum function", async () => {
    const code = `function twoSum(nums, target) {
      const map = new Map();
      for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) return [map.get(complement), i];
        map.set(nums[i], i);
      }
    }`;
    const result = await runJavaScript(code, "[2,7,11,15], 9");
    expect(result.error).toBeUndefined();
    expect(result.result).toBe("[0,1]");
    expect(result.timeMs).toBeGreaterThanOrEqual(0);
  });

  it("should run reverseString (in-place mutation)", async () => {
    const code = `function reverseString(s) {
      let l = 0, r = s.length - 1;
      while (l < r) {
        [s[l], s[r]] = [s[r], s[l]];
        l++; r--;
      }
      return s;
    }`;
    const result = await runJavaScript(code, '["h","e","l","l","o"]');
    expect(result.error).toBeUndefined();
    expect(result.result).toBe('["o","l","l","e","h"]');
  });

  it("should run isPalindrome", async () => {
    const code = `function isPalindrome(s) {
      const clean = s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return clean === clean.split('').reverse().join('');
    }`;
    const result = await runJavaScript(code, '"A man, a plan, a canal: Panama"');
    expect(result.error).toBeUndefined();
    expect(result.result).toBe("true");
  });

  it("should run fizzBuzz", async () => {
    const code = `function fizzBuzz(n) {
      const res = [];
      for (let i = 1; i <= n; i++) {
        if (i % 15 === 0) res.push("FizzBuzz");
        else if (i % 3 === 0) res.push("Fizz");
        else if (i % 5 === 0) res.push("Buzz");
        else res.push(String(i));
      }
      return res;
    }`;
    const result = await runJavaScript(code, "3");
    expect(result.error).toBeUndefined();
    expect(result.result).toBe('["1","2","Fizz"]');
  });

  it("should run maxSubArray (Kadane's)", async () => {
    const code = `function maxSubArray(nums) {
      let max = nums[0], current = nums[0];
      for (let i = 1; i < nums.length; i++) {
        current = Math.max(nums[i], current + nums[i]);
        max = Math.max(max, current);
      }
      return max;
    }`;
    const result = await runJavaScript(code, "[-2,1,-3,4,-1,2,1,-5,4]");
    expect(result.error).toBeUndefined();
    expect(result.result).toBe("6");
  });

  it("should run isValid (parentheses)", async () => {
    const code = `function isValid(s) {
      const stack = [];
      const map = { ')': '(', ']': '[', '}': '{' };
      for (const c of s) {
        if ('({['.includes(c)) stack.push(c);
        else if (stack.pop() !== map[c]) return false;
      }
      return stack.length === 0;
    }`;
    const result = await runJavaScript(code, '"()[]{}"');
    expect(result.error).toBeUndefined();
    expect(result.result).toBe("true");
  });

  it("should run search (binary search)", async () => {
    const code = `function search(nums, target) {
      let l = 0, r = nums.length - 1;
      while (l <= r) {
        const m = (l + r) >> 1;
        if (nums[m] === target) return m;
        if (nums[m] < target) l = m + 1;
        else r = m - 1;
      }
      return -1;
    }`;
    const result = await runJavaScript(code, "[-1,0,3,5,9,12], 9");
    expect(result.error).toBeUndefined();
    expect(result.result).toBe("4");
  });

  // ─── Console output ───────────────────────────────────

  it("should capture console.log output", async () => {
    const code = `function twoSum(nums, target) {
      console.log("processing...");
      return [0, 1];
    }`;
    const result = await runJavaScript(code, "[2,7], 9");
    expect(result.stdout).toContain("processing...");
    expect(result.result).toBe("[0,1]");
  });

  it("should capture console.error output", async () => {
    const code = `function twoSum(nums, target) {
      console.error("debug info");
      return [0, 1];
    }`;
    const result = await runJavaScript(code, "[2,7], 9");
    expect(result.stderr).toContain("debug info");
  });

  // ─── Error handling ───────────────────────────────────

  it("should report error when no function found", async () => {
    const code = `const x = 42;`;
    const result = await runJavaScript(code, "[]");
    expect(result.error).toBeDefined();
    expect(result.error).toContain("fonksiyon bulunamadı");
  });

  it("should handle syntax errors gracefully", async () => {
    const code = `function twoSum( {{{`;
    const result = await runJavaScript(code, "[1], 1");
    expect(result.error).toBeDefined();
  });

  it("should handle runtime errors in user code", async () => {
    const code = `function twoSum(nums, target) {
      throw new Error("intentional error");
    }`;
    const result = await runJavaScript(code, "[1,2], 3");
    expect(result.error).toBeDefined();
    expect(result.error).toContain("intentional error");
  });

  it("should timeout on infinite loops", async () => {
    const code = `function twoSum(nums, target) {
      while(true) {}
    }`;
    const result = await runJavaScript(code, "[1], 1");
    expect(result.error).toBeDefined();
    expect(result.error).toContain("Zaman limiti");
  }, 10_000);

  // ─── Security ─────────────────────────────────────────

  it("should NOT have access to require/import", async () => {
    const code = `function twoSum() {
      try { require('fs'); return "FAIL"; } catch(e) { return "OK"; }
    }`;
    const result = await runJavaScript(code, "");
    // require should not exist in the sandbox
    expect(result.result).toBe('"OK"');
  });

  it("should NOT have access to process", async () => {
    const code = `function twoSum() {
      return typeof process;
    }`;
    const result = await runJavaScript(code, "");
    expect(result.result).toBe('"undefined"');
  });

  it("should NOT have access to fetch", async () => {
    const code = `function twoSum() {
      return typeof fetch;
    }`;
    const result = await runJavaScript(code, "");
    expect(result.result).toBe('"undefined"');
  });

  // ─── Edge cases ───────────────────────────────────────

  it("should handle function returning undefined", async () => {
    const code = `function twoSum() { /* no return */ }`;
    const result = await runJavaScript(code, "");
    // undefined is stringified
    expect(result.error).toBeUndefined();
  });

  it("should handle function returning null", async () => {
    const code = `function twoSum() { return null; }`;
    const result = await runJavaScript(code, "");
    expect(result.result).toBe("null");
  });

  it("should handle function returning an object", async () => {
    const code = `function twoSum() { return { a: 1, b: 2 }; }`;
    const result = await runJavaScript(code, "");
    expect(result.result).toBe('{"a":1,"b":2}');
  });

  it("should handle function returning a string", async () => {
    const code = `function twoSum() { return "hello"; }`;
    const result = await runJavaScript(code, "");
    expect(result.result).toBe('"hello"');
  });

  it("should handle empty input arguments", async () => {
    const code = `function fizzBuzz(n) { return n === undefined ? "no-arg" : "has-arg"; }`;
    // no args passed
    const result = await runJavaScript(code, "");
    expect(result.error).toBeUndefined();
  });

  it("should handle multiple arguments", async () => {
    const code = `function search(nums, target) { return nums.indexOf(target); }`;
    const result = await runJavaScript(code, "[10, 20, 30], 20");
    expect(result.result).toBe("1");
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Python Sandbox
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("runPython", () => {
  // ─── Basics ────────────────────────────────────────────

  it("should run a simple two_sum function", async () => {
    const code = `def two_sum(nums, target):
    d = {}
    for i, n in enumerate(nums):
        if target - n in d:
            return [d[target - n], i]
        d[n] = i`;
    const result = await runPython(code, "[2,7,11,15], 9");
    expect(result.result).toBe("[0, 1]");
    expect(result.timeMs).toBeGreaterThanOrEqual(0);
  });

  it("should run fizz_buzz function", async () => {
    const code = `def fizz_buzz(n):
    res = []
    for i in range(1, n + 1):
        if i % 15 == 0: res.append("FizzBuzz")
        elif i % 3 == 0: res.append("Fizz")
        elif i % 5 == 0: res.append("Buzz")
        else: res.append(str(i))
    return res`;
    const result = await runPython(code, "5");
    expect(result.result).toBe('["1", "2", "Fizz", "4", "Buzz"]');
  });

  it("should run is_palindrome function", async () => {
    const code = `def is_palindrome(s):
    clean = ''.join(c.lower() for c in s if c.isalnum())
    return clean == clean[::-1]`;
    const result = await runPython(code, '"A man, a plan, a canal: Panama"');
    expect(result.result).toBe("true");
  });

  it("should run max_sub_array function", async () => {
    const code = `def max_sub_array(nums):
    max_sum = current = nums[0]
    for n in nums[1:]:
        current = max(n, current + n)
        max_sum = max(max_sum, current)
    return max_sum`;
    const result = await runPython(code, "[-2,1,-3,4,-1,2,1,-5,4]");
    expect(result.result).toBe("6");
  });

  // ─── Console output ───────────────────────────────────

  it("should capture print output", async () => {
    const code = `def two_sum(nums, target):
    print("debugging")
    return [0, 1]`;
    const result = await runPython(code, "[2,7], 9");
    expect(result.stdout).toContain("debugging");
  });

  // ─── Error handling ───────────────────────────────────

  it("should handle runtime errors", async () => {
    const code = `def two_sum(nums, target):
    return 1 / 0`;
    const result = await runPython(code, "[1], 1");
    expect(result.stderr).toBeDefined();
    expect(result.stderr.length).toBeGreaterThan(0);
  });

  it("should handle syntax errors", async () => {
    const code = `def two_sum(nums, target)
    return [0, 1]`;
    const result = await runPython(code, "[1], 1");
    expect(result.stderr).toBeDefined();
    expect(result.stderr.length).toBeGreaterThan(0);
  });

  // ─── Edge cases ───────────────────────────────────────

  it("should handle function returning None", async () => {
    const code = `def two_sum(nums, target):
    pass`;
    const result = await runPython(code, "[1], 1");
    expect(result.result).toBe("null");
  });

  it("should handle function returning a dict", async () => {
    const code = `def two_sum(nums, target):
    return {"a": 1}`;
    const result = await runPython(code, "[1], 1");
    expect(result.result).toBe('{"a": 1}');
  });

  it("should handle function returning a boolean", async () => {
    const code = `def is_valid(s):
    return True`;
    const result = await runPython(code, '"()"');
    expect(result.result).toBe("true");
  });

  it("should handle multiple arguments", async () => {
    const code = `def search(nums, target):
    return nums.index(target) if target in nums else -1`;
    const result = await runPython(code, "[10, 20, 30], 20");
    expect(result.result).toBe("1");
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  normalizeOutput helper (tested via code route behavior)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("normalizeOutput (logic check)", () => {
  // normalizeOutput is not exported, but we can test the behavior it depends on
  it("JSON.parse + JSON.stringify normalizes whitespace", () => {
    const input = '[ 0 , 1 ]';
    expect(JSON.stringify(JSON.parse(input))).toBe("[0,1]");
  });

  it("JSON.parse + JSON.stringify normalizes nested objects", () => {
    const input = '{ "a" : 1,  "b":  2 }';
    expect(JSON.stringify(JSON.parse(input))).toBe('{"a":1,"b":2}');
  });

  it("non-JSON strings are returned trimmed", () => {
    const input = "  hello world  ";
    try {
      JSON.parse(input);
    } catch {
      // Falls back to trim
      expect(input.trim()).toBe("hello world");
    }
  });
});
