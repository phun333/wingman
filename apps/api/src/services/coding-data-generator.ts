/**
 * Generates starter code templates and test cases for LeetCode problems using LLM.
 * Results are cached in Convex `leetcodeCodingData` table.
 */

import { ENV } from "@ffh/env";
import { convex } from "@ffh/db";
import { api } from "../../../../convex/_generated/api";

interface CodingData {
  starterCode: {
    javascript: string;
    python: string;
    typescript: string;
  };
  testCases: {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }[];
  solutionCode?: {
    javascript?: string;
    python?: string;
    typescript?: string;
  };
}

const GENERATION_PROMPT = `You are a coding interview platform assistant. Given a LeetCode problem, generate:

1. **Starter code templates** for JavaScript, Python, and TypeScript
2. **Test cases** extracted from the problem examples + 2-3 edge cases
3. **Solution code** for JavaScript (optimal approach)

RULES:
- Starter code must be a **function** that takes parameters and returns a value
- The function name must match LeetCode's convention (e.g., \`twoSum\`, \`addTwoNumbers\`)
- Use camelCase for JS/TS, snake_case for Python
- Include JSDoc/docstring with param types and return type
- Test case \`input\` must be valid JS expression(s) that can be passed to the function, separated by newlines
- Test case \`expectedOutput\` must be valid JSON
- Mark example test cases as \`isHidden: false\`, edge cases as \`isHidden: true\`
- For array outputs where order doesn't matter, sort them
- Solution should be concise and optimal

IMPORTANT: The test runner works like this:
- For JS/TS: The user's code is evaluated, then the function is called with parsed input args
- Input format: Each line is one argument, parsed via JSON.parse()
- Output: The return value is JSON.stringify'd and compared to expectedOutput

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "starterCode": {
    "javascript": "...",
    "python": "...",
    "typescript": "..."
  },
  "testCases": [
    { "input": "[2,7,11,15]\\n9", "expectedOutput": "[0,1]", "isHidden": false },
    ...
  ],
  "solutionCode": {
    "javascript": "..."
  }
}`;

/**
 * Get or generate coding data for a LeetCode problem.
 * Returns cached data if available, otherwise generates via LLM.
 */
export async function getCodingData(leetcodeId: number): Promise<CodingData | null> {
  // 1. Check cache
  const cached = await convex.query(api.leetcodeCodingData.getByLeetcodeId, { leetcodeId });
  if (cached) {
    return {
      starterCode: cached.starterCode,
      testCases: cached.testCases,
      solutionCode: cached.solutionCode,
    };
  }

  // 2. Get the problem details
  const problem = await convex.query(api.leetcodeProblems.getByLeetcodeId, { leetcodeId });
  if (!problem) return null;

  // 3. Generate via LLM
  console.log(`[coding-data] Generating for #${leetcodeId}: ${problem.title}`);
  const codingData = await generateWithLLM(problem.title, problem.description, problem.relatedTopics);
  if (!codingData) return null;

  // 4. Cache in Convex
  try {
    await convex.mutation(api.leetcodeCodingData.upsert, {
      leetcodeId,
      starterCode: codingData.starterCode,
      testCases: codingData.testCases,
      solutionCode: codingData.solutionCode,
    });
    console.log(`[coding-data] Cached for #${leetcodeId}`);
  } catch (err) {
    console.error(`[coding-data] Failed to cache for #${leetcodeId}:`, err);
  }

  return codingData;
}

async function generateWithLLM(
  title: string,
  description: string,
  topics: string[],
): Promise<CodingData | null> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": ENV.SITE_URL,
        "X-Title": "Wingman AI Interview",
      },
      body: JSON.stringify({
        model: ENV.OPENROUTER_MODEL,
        messages: [
          { role: "system", content: GENERATION_PROMPT },
          {
            role: "user",
            content: `Problem: ${title}\nTopics: ${topics.join(", ")}\n\nDescription:\n${description}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error(`[coding-data] LLM error ${response.status}:`, await response.text());
      return null;
    }

    const data = (await response.json()) as any;
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    // Parse JSON — handle possible markdown fences
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonStr) as CodingData;

    // Validate structure
    if (!parsed.starterCode?.javascript || !parsed.starterCode?.python || !parsed.starterCode?.typescript) {
      console.error("[coding-data] Invalid starterCode structure");
      return null;
    }
    if (!Array.isArray(parsed.testCases) || parsed.testCases.length === 0) {
      console.error("[coding-data] Invalid testCases");
      return null;
    }

    // Sanitize test cases — ensure all fields are strings (LLM sometimes returns numbers)
    parsed.testCases = parsed.testCases.map((tc) => ({
      input: String(tc.input),
      expectedOutput: typeof tc.expectedOutput === "string"
        ? tc.expectedOutput
        : JSON.stringify(tc.expectedOutput),
      isHidden: !!tc.isHidden,
    }));

    return parsed;
  } catch (err) {
    console.error("[coding-data] Generation failed:", err);
    return null;
  }
}
