import { NextResponse } from "next/server";

export async function POST(req) {
  const webhookUrl = process.env.CHAT_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json({ error: "Chat webhook not configured." }, { status: 500 });
  }

  try {
    const body = await req.json();
    if (!body.question?.trim()) {
      return NextResponse.json({ error: "No question provided." }, { status: 400 });
    }

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatInput: body.question.trim(),   // n8n "When chat message received" expects chatInput
        sessionId: body.session_id ?? "default",
      }),
    });

    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { answer: text }; }

    if (!res.ok) {
      console.error("[chat] n8n returned", res.status, JSON.stringify(json));
      // Give a human-readable hint for the most common n8n errors
      let hint = "";
      const msg = JSON.stringify(json);
      if (msg.includes("tool call validation failed")) {
        hint = " — HINT: Pinecone Vector Store node is not connected to the AI Agent's Tool slot in n8n, or the tool name doesn't match. Open the workflow, wire Pinecone → AI Agent (bottom slot), Save + Publish.";
      } else if (msg.includes("Error in workflow")) {
        hint = " — HINT: Check n8n Executions for the exact error inside the workflow.";
      }
      return NextResponse.json({ error: `n8n error ${res.status}: ${JSON.stringify(json)}${hint}` }, { status: res.status });
    }

    console.log("[chat] n8n response:", JSON.stringify(json));

    // n8n AI Agent returns { output }, basic LLM returns { text }, fallback to raw
    const answer = json.output ?? json.answer ?? json.text ?? json.message ?? JSON.stringify(json);
    const sources = json.sources ?? [];

    return NextResponse.json({ answer, sources });
  } catch (err) {
    console.error("[chat]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
