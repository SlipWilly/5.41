"use client";
import { useState } from "react";

type Ingredient = { item: string; quantity: string };
type Pairing = { product: string; description: string };
type Recipe = { title: string; ingredients: Ingredient[]; steps: string[]; pairing: Pairing };

type ApiResponse =
  | { recipe: Recipe; error?: never }
  | { recipe?: never; error: string };

// Safe extractor (no `any`)
function errorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  return "Unexpected error";
}

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

      const data: ApiResponse = await r.json().catch(() => ({ error: "Invalid JSON from server" }));

      // Type guard to ensure we only proceed when recipe exists
      const hasRecipe = (d: ApiResponse): d is { recipe: Recipe } =>
        d !== null &&
        typeof d === "object" &&
        "recipe" in d &&
        typeof (d as Record<string, unknown>).recipe === "object" &&
        (d as { recipe: Recipe }).recipe !== undefined;

      if (!r.ok || !hasRecipe(data)) {
        const msg = ("error" in data && data.error) ? data.error : `Error ${r.status}`;
        throw new Error(msg);
      }

      setRecipe(data.recipe);
    } catch (e: unknown) {
      setErr(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 880,
        margin: "0 auto",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        padding: "32px 16px 64px",
        color: "#111",            // force readable text
        background: "#f4f4f4",    // light backdrop for contrast
        minHeight: "100vh",
      }}
    >
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16
      }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Recipe Builder (Demo)</h1>
        <label style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={demoMode}
            onChange={(e) => setDemoMode(e.target.checked)}
          />
          Demo mode (no API)
        </label>
      </header>

      <form
        onSubmit={submit}
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "1fr 1fr 1fr auto",
          alignItems: "end",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 12, color: "#333" }}>Product</label>
          <input
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="Product"
            style={{
              height: 36, padding: "0 10px", borderRadius: 6,
              border: "1px solid #d9d9d9", background: "#fff", color: "#111"
            }}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 12, color: "#333" }}>Dish Type</label>
          <input
            value={dishType}
            onChange={(e) => setDishType(e.target.value)}
            placeholder="Dish Type"
            style={{
              height: 36, padding: "0 10px", borderRadius: 6,
              border: "1px solid #d9d9d9", background: "#fff", color: "#111"
            }}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 12, color: "#333" }}>Dietary</label>
          <input
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
            placeholder="Dietary"
            style={{
              height: 36, padding: "0 10px", borderRadius: 6,
              border: "1px solid #d9d9d9", background: "#fff", color: "#111"
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            height: 36,
            padding: "0 16px",
            borderRadius: 6,
            border: "none",
            background: loading ? "#6aa8ff" : "#0070f3",
            color: "#fff",
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "Generating…" : "Generate"}
        </button>
      </form>

      {err && (
        <div style={{
          background: "#ffe8e8",
          color: "#b00020",
          padding: 12,
          borderRadius: 8,
          marginBottom: 12,
          border: "1px solid #f5c2c2",
        }}>
          {err}
        </div>
      )}

      {recipe ? (
        <article
          style={{
            background: "#ffffff",
            color: "#222",
            padding: 20,
            borderRadius: 12,
            border: "1px solid #e6e6e6",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>{recipe.title}</h2>

          <h3 style={{ marginBottom: 6 }}>Ingredients</h3>
          <ul style={{ marginTop: 0, paddingLeft: 18, lineHeight: 1.6 }}>
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>
                <span style={{ fontWeight: 600 }}>{ing.quantity}</span>{" "}
                <span>{ing.item}</span>
              </li>
            ))}
          </ul>

          <h3 style={{ marginBottom: 6, marginTop: 18 }}>Steps</h3>
          <ol style={{ marginTop: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {recipe.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>

          <h3 style={{ marginBottom: 6, marginTop: 18 }}>Pairing</h3>
          <p style={{ marginTop: 0 }}>
            <b>{recipe.pairing.product}:</b> {recipe.pairing.description}
          </p>
        </article>
      ) : (
        !loading &&
        !err && (
          <p style={{ color: "#555", marginTop: 8 }}>
            Your recipe will appear here…
          </p>
        )
      )}
    </main>
  );
}
