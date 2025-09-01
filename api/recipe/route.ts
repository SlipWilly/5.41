import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "OPENAI_API_KEY missing" });

  const { product, dishType, dietary } = req.body ?? {};
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const r = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{
      role: "user",
      content: `Create a gourmet recipe using ${product}. Dish: ${dishType}. Dietary: ${dietary}.
