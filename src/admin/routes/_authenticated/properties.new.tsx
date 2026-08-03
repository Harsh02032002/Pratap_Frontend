import { createFileRoute } from "@tanstack/react-router";
import { PropertyForm } from "@/components/property/PropertyForm";

export const Route = createFileRoute("/_authenticated/properties/new")({
  head: () => ({
    meta: [
      { title: "Add New Property — Roomhy Admin" },
      { name: "description", content: "Create a new property listing on Roomhy." },
    ],
  }),
  component: () => <PropertyForm mode="create" initialName="ABC Residency" />,
});