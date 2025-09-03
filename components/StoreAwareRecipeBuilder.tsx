"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingBasket, PlusCircle, Sparkles, Printer, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { Product } from "@/types/product";

/* ===== Theme ===== */
const BRAND = {
  bg: "bg-[#f7f5f0]",
  card: "bg-white",
  primary: "#2f4a2d",
  accent: "#a88d5d",
  text: "#111827",
  serif: "'Cormorant Garamond', ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
  sans: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji'",
};

interface RecipeOutput {
  title: string;
  steps: string[];
  ingredients: string[];
  dietary: string[];
  dishType: string;
  pairing?: Product | null;
}

/* ===== CSV helpers (quote-aware) ===== */
function splitCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "", inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === "," && !inQuotes) { out.push(cur); cur = ""; }
    else { cur += ch; }
  }
  out.push(cur);
  return out;
}

/* ===== CSV ingest (only NAME + CATEGORY + PRICE, no tags/desc) ===== */
function parseSmartCSV(csv: string): Product[] {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];

  const headers = splitCSVLine(lines[0]).map(h => h.trim());
  const lower = headers.map(h => h.toLowerCase());
  const col = (k: string) => lower.findIndex(h => h === k.toLowerCase());

  const nameI = col("name"), catI = col("category"), priceI = col("price");

  return lines.slice(1).map((row, i) => {
    const c = splitCSVLine(row);
    while (c.length < headers.length) c.push("");

    const name = (c[nameI] ?? `Item ${i+1}`).trim();
    const category = (catI >= 0 ? c[catI] : "").trim();
    const price = priceI >= 0 ? Number((c[priceI] || "").replace(/[^0-9.]/g, "")) : NaN;

    return {
      id: String(i+1),
      name,
      category,
      prices: Number.isNaN(price) ? undefined : [price],
      available: true,
    } as Product;
  });
}

/* ===== Pairing ===== */
function pickPairing(products: Product[], usedNames: string[]): Product | null {
  const available = products.filter(p => p.available !== false);
  const notUsed = available.filter(p => !usedNames.some(u => u.toLowerCase() === p.name.toLowerCase()));
  const priority = ["olive oil","extra virgin","gourmet oil","balsamic","vinegar","spice","seasoning","salt","sauce","condiment","finishing oil"];
  return notUsed.find(p =>
    priority.some(c => (p.category || "").toLowerCase().includes(c))
  ) || notUsed[0] || null;
}

/* ===== Placeholder recipe generator ===== */
function generateRecipe(ingredients: string[], dietary: string[], dishType: string): RecipeOutput {
  const title = `${dishType} • ${ingredients[0] ? ingredients[0][0].toUpperCase() + ingredients[0].slice(1) : "Chef's Choice"}`;
  const steps = [
    "Prep: wash, chop, and measure your ingredients.",
    "Base: warm a pan and build aromatics within dietary rules.",
    `Cook: add main ingredients (${ingredients.join(", ")}) and bring to doneness.`,
    "Finish: season thoughtfully and plate with a garnish.",
  ];
  return { title, steps, ingredients, dietary, dishType, pairing: null };
}

const DIETARY_OPTIONS = ["None","Vegan","Vegetarian","Gluten-Free","Dairy-Free","Keto","Paleo","Low-Sodium","Nut-Free"];
const DISH_TYPES = ["Appetizer","Main","Side","Salad","Soup","Dessert","Breakfast","Marinade","Dip"];

function Pill({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full border text-sm transition ${active ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50 text-black"}`}
      style={{ borderColor: "#d1d5db" }}
    >
      {label}
    </button>
  );
}

export default function StoreAwareRecipeBuilder() {
  const [csvProducts, setCsvProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedDiet, setSelectedDiet] = useState<string>("None");
  const [selectedDish, setSelectedDish] = useState<string>("Main");
  const [chosen, setChosen] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<RecipeOutput[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);

  const recipesRef = useRef<HTMLDivElement>(null);

  const availableProducts = useMemo(() => csvProducts.filter(p => p.available !== false), [csvProducts]);

  // Search filter (NAME ONLY)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return availableProducts;
    return availableProducts.filter(p => p.name.toLowerCase().includes(q));
  }, [search, availableProducts]);

  const toShow = filtered.slice(0, visibleCount);

  /* -------- File upload: CSV and XLSX -------- */
  const onUpload = (file: File) => {
    const reader = new FileReader();

    // XLSX
    if (/\.(xlsx|xlsm|xlsb)$/i.test(file.name)) {
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const csv = XLSX.utils.sheet_to_csv(sheet, { strip: true });
        setCsvProducts(parseSmartCSV(csv));
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    // CSV (or text)
    reader.onload = () => setCsvProducts(parseSmartCSV(String(reader.result || "")));
    reader.readAsText(file);
  };

  const toggleChoose = (name: string) =>
    setChosen(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);

  const buildRecipe = () => {
    const recipe = generateRecipe(chosen, selectedDiet === "None" ? [] : [selectedDiet], selectedDish);
    recipe.pairing = pickPairing(availableProducts, recipe.ingredients);
    setRecipes(prev => [recipe, ...prev]);
  };

  const printRecipes = () => {
    const node = recipesRef.current;
    if (!node) return;
    const html = `
      <html>
        <head>
          <title>Recipes</title>
          <style>
            body { font-family: ${BRAND.sans}; margin: 24px; color: #111; }
            h1,h2,h3,h4 { font-family: ${BRAND.serif}; }
            .card { border: 1px solid #d1d5db; border-radius: 16px; padding: 16px; margin-bottom: 16px; }
            ul, ol { margin-left: 18px; }
          </style>
        </head>
        <body>
          ${node.innerHTML}
          <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };</script>
        </body>
      </html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
  };

  return (
    <div className={`${BRAND.bg} min-h-screen`}>
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <h1 className="text-4xl" style={{ fontFamily: BRAND.serif, color: BRAND.primary }}>Recipe Builder</h1>
        <p className="mt-2 text-sm text-gray-700" style={{ fontFamily: BRAND.sans }}>
          Find the perfect recipe.
        </p>

        {/* Product (searchable) — FIRST */}
        <div className="mt-8">
          <h3 className="mb-3 text-lg" style={{ color: BRAND.text }}>Pick Ingredients from Store Inventory</h3>

          {/* Search (name only) */}
          <div className="flex items-center gap-2 border rounded-xl bg-white px-3 py-2 mb-3 text-black" style={{ borderColor: "#d1d5db" }}>
            <Search className="w-4 h-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none placeholder-gray-600 text-black"
              placeholder="Search by product name"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {toShow.map((p) => (
              <button
                key={p.id}
                onClick={() => toggleChoose(p.name)}
                className={`text-left rounded-2xl p-4 border ${BRAND.card} hover:shadow-md transition relative ${chosen.includes(p.name) ? "ring-2" : ""}`}
                style={{ borderColor: "#d1d5db" }}
              >
                <div className="font-medium text-black">{p.name}</div>
                <div className="text-xs text-black">{p.category || "Uncategorized"}</div>
                {chosen.includes(p.name) && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs text-white px-2 py-1 rounded-full" style={{ background: BRAND.primary }}>
                    <PlusCircle className="w-3 h-3" /> Added
                  </span>
                )}
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-sm text-gray-700 mt-2">No matching products. Upload your CSV/XLSX or try a different search.</div>
          )}

          {filtered.length > visibleCount && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setVisibleCount((n) => n + 5)}
                className="px-4 py-2 rounded-xl border bg-white text-sm hover:bg-gray-50 text-black"
                style={{ borderColor: "#d1d5db" }}
              >
                Show more ({filtered.length - visibleCount})
              </button>
            </div>
          )}
        </div>

        {/* Controls — Dish Type + Dietary */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className={`${BRAND.card} rounded-2xl p-5 shadow-sm text-black`} style={{ borderColor: "#d1d5db" }}>
            <h2 className="font-medium mb-3" style={{ color: BRAND.text }}>Dish Type</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {DISH_TYPES.map((dt) => (
                <Pill key={dt} label={dt} active={selectedDish === dt} onClick={() => setSelectedDish(dt)} />
              ))}
            </div>
          </div>

          <div className={`${BRAND.card} rounded-2xl p-5 shadow-sm text-black`} style={{ borderColor: "#d1d5db" }}>
            <h2 className="font-medium mb-3" style={{ color: BRAND.text }}>Dietary</h2>
            <select
              value={selectedDiet}
              onChange={(e) => setSelectedDiet(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 bg-white text-black"
              style={{ borderColor: "#d1d5db" }}
            >
              {DIETARY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={buildRecipe}
            disabled={chosen.length === 0 || availableProducts.length === 0}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-white shadow disabled:text-gray-100 disabled:bg-gray-500"
            style={{ background: BRAND.primary }}
          >
            <Sparkles className="w-4 h-4" /> Generate Recipe
          </button>
          <button
            onClick={printRecipes}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border bg-white text-black hover:bg-gray-50"
            style={{ borderColor: "#d1d5db" }}
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>

        {/* Results */}
        <div ref={recipesRef} className="mt-10 grid md:grid-cols-2 gap-6">
          <AnimatePresence>
            {recipes.map((r, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
                className={`${BRAND.card} rounded-2xl p-6 shadow-sm border text-black`}
                style={{ borderColor: "#d1d5db" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-2xl" style={{ fontFamily: BRAND.serif, color: BRAND.text }}>{r.title}</h4>
                    <div className="mt-1 text-xs text-black">{[...r.dietary, r.dishType].filter(Boolean).join(" • ")}</div>
                  </div>
                  <ShoppingBasket className="w-6 h-6" style={{ color: BRAND.accent }} />
                </div>

                <div className="mt-4">
                  <div className="text-sm font-medium mb-1">Ingredients</div>
                  <ul className="list-disc ml-5 text-sm">
                    {r.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                  </ul>
                </div>

                <div className="mt-4">
                  <div className="text-sm font-medium mb-1">Steps</div>
                  <ol className="list-decimal ml-5 text-sm space-y-1">
                    {r.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating, subtle uploader (bottom-right) */}
      <label
        aria-label="Upload Products (CSV/XLSX)"
        className="fixed bottom-4 right-4 z-50 group cursor-pointer"
      >
        <div
          className="rounded-full border bg-white p-3 shadow-sm opacity-20 group-hover:opacity-80 transition"
          style={{ borderColor: "#d1d5db" }}
        >
          <Upload className="w-4 h-4 text-black" />
        </div>
        <input
          type="file"
          accept=".csv,.xlsx,.xlsm,.xlsb"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[1] || e.target.files?.[0];
            if (f) onUpload(f);
          }}
        />
      </label>
    </div>
  );
}
