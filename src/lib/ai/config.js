export const AI_LIMITS = {
  maxRequestsPerMinute: 20,
  maxMessages: 12,
  maxMessageLength: 2000,
  maxResponseTokens: 700,
  maxToolCalls: 4,
  maxToolRows: 100,
  timeoutMs: 30000,
};

export function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  return { apiKey, model };
}

export function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > AI_LIMITS.maxMessages) {
    throw new Error(`Send between 1 and ${AI_LIMITS.maxMessages} messages`);
  }
  return messages.map((message) => {
    if (!["user", "assistant"].includes(message?.role) || typeof message.content !== "string") {
      throw new Error("Invalid message format");
    }
    const content = message.content.trim();
    if (!content || content.length > AI_LIMITS.maxMessageLength) {
      throw new Error(`Each message must be 1-${AI_LIMITS.maxMessageLength} characters`);
    }
    return { role: message.role, content };
  });
}

export function isDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function boundedDateRange(args = {}, defaultDays = 30) {
  const end = isDate(args.end_date) ? args.end_date : new Date().toISOString().slice(0, 10);
  const start = isDate(args.start_date) ? args.start_date : new Date(Date.parse(`${end}T12:00:00Z`) - defaultDays * 86400000).toISOString().slice(0, 10);
  if (start > end) throw new Error("Start date must be before end date");
  const span = (Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / 86400000;
  if (span > 366) throw new Error("Date range cannot exceed one year");
  return { start, end };
}
