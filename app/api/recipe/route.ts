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

    // ✅ No backticks at all to avoid template literal issues
    const prompt =
      "Create a gourmet recipe using " + product + ".\n" +
      "Dish type: " + dishType + ".\n" +
      "Dietary preferenc
