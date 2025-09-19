// components/CategorySelect.tsx
import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategorySelectProps {
  onCategoryChange?: (category: string) => void; // Callback to return selected category
  defaultValue?: string; // Optional default category
}

const categories = [
  { value: "Environmental", label: "Environmental" },
  { value: "Education", label: "Education" },
  { value: "Health", label: "Health" },
  { value: "Community Development", label: "Community Development" },
];

const CategorySelect: React.FC<CategorySelectProps> = ({
  onCategoryChange,
  defaultValue,
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>(
    defaultValue || ""
  );

  const handleChange = (value: string) => {
    setSelectedCategory(value);
    if (onCategoryChange) {
      onCategoryChange(value); // Pass the selected category to the parent
    }
  };

  return (
    <Select
      value={selectedCategory}
      onValueChange={handleChange}
      defaultValue={defaultValue}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category.value} value={category.value}>
            {category.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CategorySelect;