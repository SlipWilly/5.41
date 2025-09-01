import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log("HAS_KEY", !!process.env.OPENAI_API_KEY); // should be true on Vercel
    const { product, dishType, dietary } = await req.json();

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    const result = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: `Create a gourmet recipe using ${product}.
Dish: ${dishType}. Dietary: ${dietary}.
Return title, ingredients with quantities, and step-by-step instructions.
Suggest one pairing with another Saratoga Olive Oil product.`
      }]
    });

    return NextResponse.json({ recipe: result.choices?.[0]?.message?.content ?? "" });
  } catch (err: any) {
    console.error("API ERROR", err?.message || err);
    return NextResponse.json({ error: err?.message || "Failed to generate recipe" }, { status: 500 });
  }
}
