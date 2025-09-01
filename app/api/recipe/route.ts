// app/api/recipe/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, message: "Recipe API is live." });
}

type Body = {
  product?: string;
  dishType?: string;
  dietary?: string;
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY missing (set it in Vercel → Project → Settings → Environment Variables)." },
        { status: 500 }
      );
    }

    const { product, dishType, dietary }: Body = await req.json().catch(() => ({} as Body));
    if (!product || !dishType || !dietary) {
      return NextResponse.json(
        { error: "Missing required fields. Send JSON: { product, dishType, dietary }" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });

    // ✅ Build the prompt from an array and join with "\n" to avoid multi-line string issues
    const lines = [
      "Create a gourmet recipe using " + product + ".",
      "Dish type: " + dishType + ".",
      "Dietary preference: " + dietary + ".",
      "Return: a title, ingredients with quantities (US measurements), and step-by-step instructions.",
      "Also suggest one pairing with another Saratoga Olive Oil product."
    ];
    const prompt = lines.join("\n");

    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",      // EDIT if you prefer another available model
      temperature: 0.7,          // EDIT for creativity
      max_tokens: 800,           // EDIT to control output length
      messages: [{ role: "user", content: prompt }]
    });

    const recipe = result.choices?.[0]?.message?.content?.trim() || "";
    if (!recipe) {
      return NextResponse.json(
        { error: "The model returned no content. Try again or adjust the prompt." },
        { status: 502 }
      );
    }

    return NextResponse.json({ recipe }, { status: 200 });
  } catch (err: unknown) {
    const e = err as { status?: number; code?: string; type?: string; message?: string };
    const status = typeof e?.status === "number" ? e.status : 500;
    const code = e?.code || e?.type || "internal_error";
    const message = typeof e?.message === "string" ? e.message : "Failed to generate recipe";
    console.error("API ERROR", { status, code, message });
    return NextResponse.json({ error: message, code }, { status });
  }
}
