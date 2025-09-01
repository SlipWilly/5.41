// app/api/recipe/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";

// (Optional) If you ever move this to Edge, uncomment the next line and
// switch to the REST fetch pattern instead of the official SDK.
// export const runtime = "edge";

export async function GET() {
  // Basic health check so you can open /api/recipe in the browser and see JSON
  return NextResponse.json({ ok: true, message: "Recipe API is live." });
}

type Body = {
  product?: string;
  dishType?: string;
  dietary?: string;
};

export async function POST(req: Request) {
  try {
    // 1) Make sure the API key exists (Vercel -> Project -> Settings -> Environment Variables)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY missing (set it in Vercel Environment Variables)." },
        { status: 500 }
      );
    }

    // 2) Parse and validate the incoming JSON
    const { product, dishType, dietary }: Body = await req.json().catch(() => ({} as Body));

    if (!product || !dishType || !dietary) {
      return NextResponse.json(
        {
          error:
            "Missing required fields. Please send JSON with { product, dishType, dietary }."
        },
        { status: 400 }
      );
    }

    // 3) Create OpenAI client
    const openai = new OpenAI({ apiKey });

    // 4) Build the prompt (EDIT THIS if you want a different style/format)
    const prompt =
      `Create a gourmet recipe using ${product}.\n` +
      `Dish type: ${dishType}.\n` +
      `Dietary preference: ${dietary}.\n` +
      `Return: a title, ingredients with quantities (US measurements), and step-by-step instructions.\n` +
      `Also suggest one pairing with another Saratoga Olive Oil product.`;

    // 5) Call OpenAI (EDIT model/temperature/max_tokens as you like)
    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",       // <-- EDIT: pick a model you have access to
      temperature: 0.7,           // <-- EDIT: higher = more creative
      max_tokens: 800,            // <-- EDIT: cap output length
      messages: [{ role: "user", content: prompt }]
    });

    const recipe = result.choices?.[0]?.message?.content?.trim() || "";

    if (!recipe) {
      // Defensive: if the SDK returned an empty message for any reason
      return NextResponse.json(
        { error: "The model returned no content. Try again or adjust the prompt." },
        { status: 502 }
      );
    }

    // 6) Success
    return NextResponse.json({ recipe }, { status: 200 });
  } catch (err: any) {
    // Surface useful details without leaking secrets
    const status = Number(err?.status) || 500;
    const code = err?.code || err?.type;
    const message =
      err?.message ||
      (typeof err === "string" ? err : "Failed to generate recipe");

    // This logs to Vercel Function logs (Project → Functions → api/recipe → Logs)
    console.error("API ERROR", { status, code, message });

    return NextResponse.json(
      { error: message, code: code || "internal_error" },
      { status }
    );
  }
}
