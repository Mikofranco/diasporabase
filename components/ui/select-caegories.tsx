"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Control, useController } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Define the shape of each category item
interface CategoryItem {
  id: string;
  label: string;
}

// Props interface for the component
interface CategoryCheckBoxProps {
  control: Control<any>; // Parent form control from react-hook-form
  name: string; // Field name in the parent form (e.g., "focus_areas")
  items: CategoryItem[]; // List of categories to display
  label?: string; // Optional custom label
  description?: string; // Optional custom description
  onSelectionChange?: (selectedItems: string[]) => void; // Callback for parent
  showToast?: boolean; // Optional flag to show toast notifications
}

// Validation schema for the field
const FormSchema = z.object({
  items: z.array(z.string()).min(1, "You have to select at least one item."),
});

export function CategoryCheckBox({
  control,
  name,
  items,
  label = "Categories",
  description = "Select the categories you want to include.",
  onSelectionChange,
  showToast = false,
}: CategoryCheckBoxProps) {
  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({
    name,
    control,
    rules: { validate: (value) => FormSchema.shape.items.safeParse(value).success || "You have to select at least one item." },
    defaultValue: [],
  });

  // Handle checkbox change
  const handleCheckboxChange = (checked: boolean, itemId: string) => {
    const updatedItems = checked
      ? [...(value || []), itemId]
      : (value || []).filter((id: string) => id !== itemId);

    // Update form state
    onChange(updatedItems);

    // Notify parent of the updated selection
    if (onSelectionChange) {
      onSelectionChange(updatedItems);
    }

    // Show toast if enabled
    if (showToast) {
      toast("Current selection:", {
        description: (
          <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
            <code className="text-white">{JSON.stringify({ items: updatedItems }, null, 2)}</code>
          </pre>
        ),
      });
    }
  };

  return (
    <FormItem>
      <div className="mb-4">
        <FormLabel className="text-base">{label}</FormLabel>
        <FormDescription>{description}</FormDescription>
      </div>
      {items.map((item) => (
        <FormItem key={item.id} className="flex flex-row items-center gap-2">
          <FormControl>
            <Checkbox
              checked={value?.includes(item.id)}
              onCheckedChange={(checked) => handleCheckboxChange(checked as boolean, item.id)}
            />
          </FormControl>
          <FormLabel className="text-sm font-normal">{item.label}</FormLabel>
        </FormItem>
      ))}
      <FormMessage>{error?.message}</FormMessage>
    </FormItem>
  );
}