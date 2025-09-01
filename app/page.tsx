"use client";
import { useState } from "react";

type Ingredient = { item: string; quantity: string };
type Pairing = { product: string; description: string };
type Recipe = { title: string; ingredients: Ingredient[]; steps: string[]; pairing: Pairing };

type ApiResponse =
  | { recipe: Recipe; error?: never }
  | { recipe?: never; error: string };

const SAMPLE_RECIPE: Recipe = {
  title: "Tuscan Herb Pasta with Roasted Tomatoes",
  ingredients: [
    { item: "Pasta", quantity: "12 oz" },
    { item: "Tuscan Herb Olive Oil", quantity: "3 tbsp" },
    { item: "Cherry Tomatoes", quantity: "2 cups" },
    { item: "Garlic", quantity: "2 cloves" },
    { item: "Salt & Pepper", quantity: "to taste" },
  ],
  steps: [
    "Boil pasta until al dente.",
    "Roast tomatoes tossed with olive oil at 425°F for 12–15 minutes.",
    "Sauté garlic, add pasta + tomatoes, season, and serve.",
  ],
  pairing: { product: "Lemon Olive Oil", description: "Perfect drizzle for brightness." },
};

// Safe extractor so we never use `any`
function errorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err && typeof (err as any).message === "string") {
    return (err as { message: string }).message;
  }
  return "Unexpected error";
}

export default function Home() {
  const [product, setProduct] = useState("Tuscan Herb Olive Oil");
  const [dishType, setDishType] = useState("pasta");
  const [dietary, setDietary] = useState("vegetarian");

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [demoMode, setDemoMode] = u
