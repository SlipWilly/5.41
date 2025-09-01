"use client";
import { useState } from "react";

export default function Home() {
  const [product, setProduct] = useState("Tuscan Herb Olive Oil");
  const [dishType, setDishType] = useState("pasta");
  const [dietary, setDietary] = useState("vegetarian");
  const [out, setOut] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setOut("Generating…");
    const r = await fetch("/api/recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product, dishType, dietary })
    });
    if (!r.ok) return setOut(`Error ${r.status}`);
    const data = await r.json();
    setOut(data.recipe || "No text returned");
  }

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Recipe Builder</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product" />
        <input value={dishType} onChange={e=>setDishType(e.target.value)} placeholder="Dish Type" />
        <input value={dietary} onChange={e=>setDietary(e.target.value)} placeholder="Dietary" />
        <button type="submit">Generate</button>
      </form>
      <pre style={{ whiteSpace: "pre-wrap", marginTop: 20 }}>{out}</pre>
    </main>
  );
}
