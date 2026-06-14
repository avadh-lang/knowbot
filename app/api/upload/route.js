import { NextResponse } from "next/server";

export async function POST(req) {
  const webhookUrl = process.env.INGEST_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json({ error: "Ingest webhook not configured." }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // n8n expects the file field named "data"
    const upstream = new FormData();
    upstream.append("data", file, file.name);

    const res = await fetch(webhookUrl, { method: "POST", body: upstream });
    const text = await res.text();

    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    if (!res.ok) {
      return NextResponse.json({ error: json.error ?? "Upload failed" }, { status: res.status });
    }

    return NextResponse.json({ success: true, name: file.name, ...json });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
