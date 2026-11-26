"use client";
import { ResourcePage } from "@/components/ResourcePage";

export default function WarehousesPage() {
  return (
    <ResourcePage
      title="Warehouses"
      subtitle="Locations where you keep stock."
      type="warehouse"
      noun="Warehouse"
      fields={[
        { key: "name", label: "Warehouse name", required: true },
        { key: "location", label: "Location / city" },
      ]}
      columns={[
        { key: "name", label: "Name" },
        { key: "location", label: "Location" },
      ]}
    />
  );
}
