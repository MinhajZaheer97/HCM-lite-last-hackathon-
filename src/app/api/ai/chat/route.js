import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AI_LIMITS, validateMessages } from "@/lib/ai/config";
import { generateGemini } from "@/lib/ai/gemini";
import { systemPrompt } from "@/lib/ai/prompts";
import { executeTool, toolsForRole } from "@/lib/ai/tools";

export const dynamic = "force-dynamic";
const requestCounts = new Map();

function enforceRateLimit(userId) {
  const now = Date.now();
  const current = requestCounts.get(userId);
  if (!current || now - current.startedAt >= 60000) {
    requestCounts.set(userId, { startedAt: now, count: 1 });
    return;
  }
  if (current.count >= AI_LIMITS.maxRequestsPerMinute) {
    throw new Error("Too many AI requests. Please wait a minute and try again.");
  }
  current.count += 1;
}

function toGeminiContents(messages) {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
}

function safeSources(toolNames) {
  return toolNames.map((name) => ({ type: name, label: name.replaceAll("_", " ") }));
}

export async function POST(request) {
  try {
    const { user, profile } = await getCurrentProfile();
    if (!user || !profile?.is_active || !profile.company_id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    enforceRateLimit(user.id);
    const body = await request.json();
    const messages = validateMessages(body.messages);
    const db = await createClient();
    const contents = toGeminiContents(messages);
    const toolNames = [];
    for (let round = 0; round < AI_LIMITS.maxToolCalls; round += 1) {
      const content = await generateGemini({ system: systemPrompt(profile), contents, tools: toolsForRole(profile.role) });
      contents.push(content);
      const calls = (content.parts ?? []).filter((part) => part.functionCall);
      if (!calls.length) {
        const answer = (content.parts ?? []).filter((part) => part.text).map((part) => part.text).join("\n").trim();
        return NextResponse.json({ answer: answer || "I could not produce an answer from the available data.", sources: safeSources(toolNames) });
      }
      for (const part of calls) {
        const name = part.functionCall.name;
        const result = await executeTool(name, part.functionCall.args, { db, profile });
        toolNames.push(name);
        contents.push({ role: "user", parts: [{ functionResponse: { name, response: { result } } }] });
      }
    }
    return NextResponse.json({ error: "The assistant reached its tool-call limit. Please ask a narrower question." }, { status: 422 });
  } catch (error) {
    console.error("AI chat failed", error);
    const message = error instanceof Error ? error.message : "Unable to answer right now";
    const status = /required|invalid|between|characters|range|format|configured/i.test(message) ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
