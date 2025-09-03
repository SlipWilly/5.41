// Shared product type used across the app.
// Prices are parsed but not displayed in the UI.

export interface Product {
  id: string;
  name: string;
  category?: string;
  tags?: string[];     // derived from category/description or provided in CSV
  prices?: number[];   // optional; parsed but NOT shown
  sizes?: string[];    // e.g., 200ml, 375ml, 750ml
  description?: string;
  available?: boolean; // default true if CSV doesn’t include it
}
