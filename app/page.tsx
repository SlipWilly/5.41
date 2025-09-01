"use client";
import { useState } from "react";

type Ingredient = { item: string; quantity: string };
type Pairing = { product: string; description: string };
type Recipe = { title: string; ingredients: Ingredient[]; steps: string[]; pairing: Pairing };

type ApiResponse = { recipe?: Recipe; error?: string };

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

export default function Home() {
  const [product, setProduct] = useState("Tuscan Herb Olive Oil");
  const [dishType, setDishType] = useState("pasta");
  const [dietary, setDietary] = useState("vegetarian");

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setRecipe(null);
    setErr(null);

    if (demoMode) {
      setRecipe(SAMPLE_RECIPE);
      return;
    }

    try {
      setLoading(true);
      const r = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, dishType, dietary }),
      });
      const data: ApiResponse = await r.json();
      if (!r.ok || !data.recipe) {
        throw new Error(data.error || `Error ${r.status}`);
      }
      setRecipe(data.recipe);
    } catch (e: any) {
      setErr(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 880, margin: "40px auto", fontFamily: "system-ui", padding: "0 16px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h1>Recipe Builder (Demo)</h1>
        <label style={{ fontSize: 14 }}>
          <input type="checkbox" checked={demoMode} onChange={e => setDemoMode(e.target.checked)} /> Demo mode
        </label>
      </header>

      <form onSubmit={submit} style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr 1fr auto", marginBottom: 16 }}>
        <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product" />
        <input value={dishType} onChange={e=>setDishType(e.target.value)} placeholder="Dish Type" />
        <input value={dietary} onChange={e=>setDietary(e.target.value)} placeholder="Dietary" />
        <button type="submit" disabled={loading}>{loading ? "Generating…" : "Generate"}</button>
      </form>

      {err && <div style={{ background: "#ffe8e8", padding: 12, borderRadius: 8 }}>{err}</div>}

      {recipe && (
        <article style={{ background: "#f9f9f9", padding: 16, borderRadius: 8 }}>
          <h2>{recipe.title}</h2>

          <h3>Ingredients</h3>
          <ul>
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>
                {ing.quantity} {ing.item}
              </li>
            ))}
          </ul>

          <h3>Steps</h3>
          <ol>
            {recipe.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>

          <h3>Pairing</h3>
          <p>
            <b>{recipe.pairing.product}:</b> {recipe.pairing.description}
          </p>
        </article>
      )}

      {!recipe && !loading && !err && <p style={{ color: "#888" }}>Your recipe will appear here…</p>}
    </main>
  );
}
