// app/api/recipe/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";

type Body = { product?: string; dishType?: string; dietary?: string };

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY missing" }, { status: 500 });
    }

    const { product, dishType, dietary }: Body = await req.json().catch(() => ({} as Body));
    if (!product || !dishType || !dietary) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey });

    const prompt = `Create a gourmet recipe using ${product}.
Dish type: ${dishType}.
Dietary preference: ${dietary}.
Return ONLY valid JSON with this shape:
{
  "title": string,
  "ingredients": [ { "item": string, "quantity": string } ],
  "steps": [ string ],
  "pairing": { "product": string, "description": string }
}`;

    const result = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // cheaper for demo; switch to gpt-4o-mini if available
      temperature: 0.7,
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const text = result.choices?.[0]?.message?.content?.trim() || "{}";

    let recipe;
    try {
      recipe = JSON.parse(text);
    } catch {
      recipe = { raw: text }; // fallback if AI gives bad JSON
    }

    return NextResponse.json({ recipe }, { status: 200 });
  } catch (err) {
    console.error("API ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
