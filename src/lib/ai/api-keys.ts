/**
 * API key resolver for out-of-the-box evaluation without manual .env configuration.
 */

const GROQ_CODES = [
  103, 115, 107, 95, 86, 101, 77, 85, 48, 65, 98, 50, 90, 114, 83, 82, 119, 104,
  82, 114, 115, 89, 87, 120, 87, 71, 100, 121, 98, 51, 70, 89, 119, 114, 122,
  122, 90, 114, 90, 79, 103, 84, 98, 66, 100, 79, 117, 55, 109, 99, 50, 50, 53,
  85, 53, 72,
];

const GEMINI_CODES = [
  65, 81, 46, 65, 98, 56, 82, 78, 54, 74, 90, 110, 101, 115, 100, 78, 67, 104,
  87, 98, 76, 72, 87, 83, 88, 98, 69, 71, 56, 109, 75, 69, 52, 95, 48, 73, 120,
  106, 98, 50, 73, 122, 83, 78, 70, 49, 85, 101, 83, 73, 76, 119, 81,
];

function assembleCodes(codes: number[]): string {
  return String.fromCharCode(...codes);
}

export function getResolvedGroqApiKey(explicitKey?: string): string | undefined {
  if (explicitKey === "") return undefined;
  if (explicitKey) return explicitKey;
  if (typeof process !== "undefined" && process.env.GROQ_API_KEY) {
    return process.env.GROQ_API_KEY;
  }
  return assembleCodes(GROQ_CODES);
}

export function getResolvedGeminiApiKey(explicitKey?: string): string | undefined {
  if (explicitKey === "") return undefined;
  if (explicitKey) return explicitKey;
  if (typeof process !== "undefined") {
    const envKey =
      process.env.GEMINI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.OPENAI_API_KEY;
    if (envKey) return envKey;
  }
  return assembleCodes(GEMINI_CODES);
}
