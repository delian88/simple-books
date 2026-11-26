"use client";
import { ResourcePage } from "@/components/ResourcePage";

export default function ProductsPage() {
  return (
    <ResourcePage
      title="Products & Items"
      subtitle="Your catalog of products with costs, prices and reorder levels."
      type="product"
      noun="Product"
      fields={[
        { key: "name", label: "Product name", required: true },
        { key: "sku", label: "SKU" },
        { key: "unit", label: "Unit (pcs, box...)", default: "pcs" },
        { key: "cost_price", label: "Cost price", type: "number" },
        { key: "sale_price", label: "Sale price", type: "number" },
        { key: "reorder_level", label: "Reorder level", type: "number" },
      ]}
      columns={[
        { key: "name", label: "Name" },
        { key: "sku", label: "SKU" },
        { key: "unit", label: "Unit" },
        { key: "cost_price", label: "Cost", kind: "money", right: true },
        { key: "sale_price", label: "Price", kind: "money", right: true },
        { key: "reorder_level", label: "Reorder at", right: true },
      ]}
    />
  );
}
