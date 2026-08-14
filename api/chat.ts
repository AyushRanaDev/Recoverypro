import type { VercelRequest, VercelResponse } from "@vercel/node";

type ChatBody = {
  message?: string;
  role?: "person" | "caregiver";
  mode?: string;
  supportName?: string;
  supportPhone?: string;
  history?: Array<{ from: "user" | "assistant"; text: string }>;
};

const crisisTerms = [
  "overdose",
  "suicide",
  "kill myself",
  "can't breathe",
  "unconscious",
  "chest pain",
  "violence",
];

function buildSystemPrompt(body: ChatBody) {
  const support = body.supportName
    ? `Trusted support: ${body.supportName}${body.supportPhone ? ` (${body.supportPhone})` : ""}.`
    : "No trusted support contact has been saved.";

  return [
    "You are a recovery and prevention companion for substance use disorder support.",
    "You are not a doctor, therapist, emergency dispatcher, or substitute for professional care.",
    "Keep replies concise, calm, and voice-friendly. Prefer short numbered steps.",
    "When cognitive load is high, reduce typing: offer scripts the user can say out loud.",
    "If there is immediate danger, overdose risk, suicidal intent, severe withdrawal, or violence, instruct the user to call local emergency services immediately.",
    "Never shame the user. Use motivational interviewing: affirm, reflect, ask one gentle question only if needed.",
    "Do not provide instructions for obtaining, hiding, combining, or using substances.",
    `User role: ${body.role ?? "person"}. Current support mode: ${body.mode ?? "urge"}. ${support}`,
  ].join("\n");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = req.body as ChatBody;
  const message = body.message?.trim();

  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const lower = message.toLowerCase();
  const crisis = crisisTerms.some((term) => lower.includes(term));
  const crisisPrefix = crisis
    ? "Safety first: if anyone may be in immediate danger, call local emergency services now. "
    : "";

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(200).json({
      reply:
        crisisPrefix +
        "The AI key is not configured yet. For this moment: move away from triggers, slow your breathing, sip water if safe, and contact a trusted person or emergency services if safety is uncertain.",
    });
    return;
  }

  const history =
    body.history?.slice(-8).map((item) => ({
      role: item.from === "assistant" ? "assistant" : "user",
      content: item.text,
    })) ?? [];

  const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.35,
      max_tokens: 450,
      messages: [
        { role: "system", content: buildSystemPrompt(body) },
        ...history,
        { role: "user", content: message },
      ],
    }),
  });

  if (!groqResponse.ok) {
    const text = await groqResponse.text();
    res.status(502).json({ error: "Groq request failed", detail: text.slice(0, 300) });
    return;
  }

  const data = await groqResponse.json();
  const reply = data.choices?.[0]?.message?.content?.trim();
  res.status(200).json({
    reply:
      crisisPrefix +
      (reply ??
        "I am here with you. Take one slow breath, move away from immediate triggers, and tell me the safest next tiny step."),
  });
}
