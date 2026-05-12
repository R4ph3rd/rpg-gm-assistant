import Groq from "groq-sdk";

export function getGroqClient(apiKey: string) {
  return new Groq({ apiKey });
}

export const MODEL = "llama-3.3-70b-versatile";

export async function chat(apiKey: string, system: string, user: string): Promise<string> {
  const groq = getGroqClient(apiKey);
  const res = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.8,
    max_tokens: 2048,
  });
  return res.choices[0]?.message?.content ?? "";
}
