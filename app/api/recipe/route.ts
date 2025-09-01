import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY missing" }, { status: 500 });
  }

  const { product, dishType, dietary } = await req.json();
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const result = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Create a gourmet recipe using ${product}.
Dish: ${dishType}. Dietary: ${dietary}.
Return title, ingredients with quantities, and step-by-step instructions.
Suggest one pairing with another Saratoga Olive Oil product.`
        }
      ]
    });

    const recipe = result.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ recipe });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate recipe" }, { status: 500 });
  }
}

