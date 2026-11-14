import { AI_LIMITS, getGeminiConfig } from "@/lib/ai/config";

export async function generateGemini({ system, contents, tools }) {
  const { apiKey, model } = getGeminiConfig();
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_LIMITS.timeoutMs);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          tools: [{ functionDeclarations: tools }],
          generationConfig: { maxOutputTokens: AI_LIMITS.maxResponseTokens, temperature: 0.2 },
        }),
      });
      if (!response.ok) {
        let detail = "";
        try {
          const payload = await response.json();
          detail = payload?.error?.message || "";
        } catch {
          // Keep the stable status error when the provider does not return JSON.
        }
        if ([429, 500, 503].includes(response.status) && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 750));
          continue;
        }
        throw new Error(`Gemini request failed (${response.status})${detail ? `: ${detail}` : ""}`);
      }
      const payload = await response.json();
      if (!payload?.candidates?.[0]?.content) throw new Error("Gemini returned no answer");
      return payload.candidates[0].content;
    } catch (error) {
      if (error?.name === "AbortError") throw new Error("AI request timed out");
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
