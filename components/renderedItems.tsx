"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface Item {
  id: string;
  label: string;
  children?: Item[];
  subChildren?: Item[];
}

interface CheckboxReactHookFormMultipleProps {
  onChange?: (selectedItems: string[]) => void;
  items: Item[];
  initialValues?: string[];
}

const FormSchema = z.object({
  items: z.array(z.string()).refine((value) => value.length > 0, {
    message: "You have to select at least one item.",
  }),
});

export function CheckboxReactHookFormMultiple({
  onChange,
  items,
  initialValues = [],
}: CheckboxReactHookFormMultipleProps) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      items: initialValues,
    },
  });

  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  // Watch the items field and pass changes to parent
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      if (onChange && value.items) {
        // console.log("Selected items:", value.items);
        //@ts-ignore
        onChange(value.items);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  // Initialize expansion state based on initialValues
  React.useEffect(() => {
    if (initialValues.length > 0) {
      const newExpanded: Record<string, boolean> = {};
      const expandItems = (items: Item[]) => {
        items.forEach((item) => {
          if (initialValues.includes(item.id)) {
            newExpanded[item.id] = true;
            if (item.children) {
              item.children.forEach((child) => {
                if (child.subChildren) {
                  newExpanded[child.id] = true;
                }
              });
            }
          }
          if (item.children) {
            expandItems(item.children);
          }
          if (item.subChildren) {
            expandItems(item.subChildren);
          }
        });
      };
      expandItems(items);
      setExpanded(newExpanded);
    }
  }, [initialValues, items]);

  // Collect all descendant IDs for an item
  const getDescendantIds = (item: Item): string[] => {
    const ids: string[] = [];
    if (item.children) {
      ids.push(...item.children.map((child) => child.id));
      for (const child of item.children) {
        if (child.subChildren) {
          ids.push(...child.subChildren.map((subChild) => subChild.id));
        }
      }
    }
    if (item.subChildren) {
      ids.push(...item.subChildren.map((subChild) => subChild.id));
    }
    return ids;
  };

  // Collect all descendant IDs that have subChildren (for collapsing)
  const getDescendantIdsWithSubChildren = (item: Item): string[] => {
    const ids: string[] = [];
    if (item.children) {
      item.children.forEach((child) => {
        if (child.subChildren) {
          ids.push(child.id);
        }
      });
    }
    return ids;
  };

  // Get the full path for an item (for tooltip)
  const getItemPath = (id: string, items: Item[]): string => {
    const findItem = (items: Item[], path: string[] = []): string | null => {
      for (const item of items) {
        if (item.id === id) return [...path, item.label].join(" > ");
        if (item.children) {
          const found = findItem(item.children, [...path, item.label]);
          if (found) return found;
          if (item.children.some((child) => child.subChildren)) {
            for (const child of item.children) {
              if (child.subChildren) {
                const foundSub = findItem(child.subChildren, [
                  ...path,
                  item.label,
                  child.label,
                ]);
                if (foundSub) return foundSub;
              }
            }
          }
        }
        if (item.subChildren) {
          const foundSub = findItem(item.subChildren, [...path, item.label]);
          if (foundSub) return foundSub;
        }
      }
      return null;
    };
    return findItem(items) || id;
  };

  // Handle item click to toggle expansion
  const handleItemClick = (item: Item) => {
    if (item.children || item.subChildren) {
      setExpanded((prev) => ({
        ...prev,
        [item.id]: !prev[item.id],
      }));
    }
  };

  // Handle checkbox selection
  const handleSelect = (item: Item, field: any) => {
    // console.log(`Handling select for: ${item.label} (${item.id})`);
    const descendantIds = getDescendantIds(item);
    const isSelected = field.value.includes(item.id);

    let newValue: string[];
    if (isSelected) {
      newValue = field.value.filter(
        (id: string) => id !== item.id && !descendantIds.includes(id)
      );
      console.log(`Deselecting ${item.id} and descendants:`, descendantIds);
    } else {
      newValue = [...new Set([...field.value, item.id, ...descendantIds])];
      console.log(`Selecting ${item.id} and descendants:`, descendantIds);
    }

    field.onChange(newValue);

    // Update expansion state
    setExpanded((prev) => {
      const newExpanded = { ...prev };
      if (isSelected) {
        newExpanded[item.id] = false;
        if (item.subChildren) {
          item.subChildren.forEach((subChild) => {
            newExpanded[subChild.id] = false;
          });
        } else if (item.children) {
          getDescendantIdsWithSubChildren(item).forEach((id) => {
            newExpanded[id] = false;
          });
        }
      } else {
        newExpanded[item.id] = true;
        if (item.subChildren) {
          item.subChildren.forEach((subChild) => {
            newExpanded[subChild.id] = true;
          });
        } else if (item.children) {
          getDescendantIdsWithSubChildren(item).forEach((id) => {
            newExpanded[id] = true;
          });
        }
      }
      return newExpanded;
    });

    // Update parent selection state
    const parent = items
      .flatMap((i) => [
        i,
        ...(i.children || []),
        ...(i.children?.flatMap((c) => c.subChildren || []) || []),
      ])
      .find(
        (i) =>
          i.children?.some((child) => child.id === item.id) ||
          i.subChildren?.some((subChild) => subChild.id === item.id)
      );
    if (parent) {
      const allChildrenSelected = parent.children
        ? parent.children.every((child) => newValue.includes(child.id))
        : parent.subChildren?.every((subChild) =>
            newValue.includes(subChild.id)
          );
      const someChildrenSelected = parent.children
        ? parent.children.some((child) => newValue.includes(child.id))
        : parent.subChildren?.some((subChild) =>
            newValue.includes(subChild.id)
          );
      if (allChildrenSelected && !newValue.includes(parent.id)) {
        newValue = [...new Set([...newValue, parent.id])];
      } else if (!someChildrenSelected && newValue.includes(parent.id)) {
        newValue = newValue.filter((id) => id !== parent.id);
      }
      field.onChange(newValue);
    }
  };

  // Handle badge removal
  const handleRemove = (id: string, field: any) => {
    console.log(`Removing: ${id}`);
    const newValue = field.value.filter((val: string) => val !== id);
    field.onChange(newValue);
  };

  // Render items recursively with checkboxes
  const renderItems = React.useCallback(
    (items: Item[], level: number = 0) => {
      return items.map((item) => (
        <div key={item.id} className="flex flex-col">
          <FormField
            control={form.control}
            name="items"
            render={({ field }) => (
              <FormItem
                onClick={() => handleItemClick(item)}
                className={`flex flex-row items-center gap-1.5 py-1 px-2 rounded-md transition-all duration-200 cursor-pointer ${
                  field.value?.includes(item.id)
                    ? "bg-white"
                    : level === 0
                    ? "bg-white"
                    : level === 1
                    ? "bg-gray-100"
                    : "bg-gray-200"
                } hover:bg-gray-200 active:scale-[0.98]`}
                style={{ paddingLeft: `${level * 18}px` }}
              >
                {(item.children || item.subChildren) && (
                  <span
                    className="text-gray-600 hover:text-gray-800 transition-transform duration-300"
                    aria-expanded={expanded[item.id]}
                  >
                    {expanded[item.id] ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </span>
                )}
                <FormControl>
                  <Checkbox
                    id={item.id}
                    checked={field.value?.includes(item.id)}
                    onCheckedChange={() => handleSelect(item, field)}
                    onClick={(e) => e.stopPropagation()} // Prevent item click from triggering
                    className="border-gray-400 focus:ring-2 focus:ring-offset-1 h-4 w-4 transition-all duration-200 hover:border-gray-600"
                    aria-checked={field.value?.includes(item.id)}
                  />
                </FormControl>
                <FormLabel
                  htmlFor={item.id}
                  className={`text-sm cursor-pointer transition-colors duration-200 ${
                    field.value?.includes(item.id)
                      ? "font-medium"
                      : "text-gray-700"
                  } hover:text-gray-900`}
                  onClick={(e) => e.stopPropagation()} // Prevent label click from triggering item click
                >
                  {item.label}
                </FormLabel>
              </FormItem>
            )}
          />
          {(item.children || item.subChildren) && expanded[item.id] && (
            <div className="ml-2.5">
              {item.children && renderItems(item.children, level + 1)}
              {item.children?.some((child) => child.subChildren) &&
                item.children.map(
                  (child) =>
                    child.subChildren &&
                    expanded[child.id] && (
                      <div key={child.id} className="ml-2.5">
                        {renderItems(child.subChildren, level + 2)}
                      </div>
                    )
                )}
              {item.subChildren && renderItems(item.subChildren, level + 1)}
            </div>
          )}
        </div>
      ));
    },
    [form, expanded]
  );

  return (
    <Form {...form}>
      <div className="space-y-3 p-3 bg-white rounded-lg shadow-sm max-w-full">
        <FormField
          control={form.control}
          name="items"
          render={({ field }) => (
            <FormItem>
              <div className="mb-2">
                <FormLabel className="text-base font-semibold text-gray-800">
                  Skills & Interests
                </FormLabel>
                <FormDescription className="text-xs text-gray-500 mt-0.5">
                  Select your skills and interests. Click to expand or collapse
                  sub-items.
                </FormDescription>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {field.value.length > 0 ? (
                  field.value
                    .filter((id) => {
                      const item = items
                        .flatMap((i) => [
                          i,
                          ...(i.children || []),
                          ...(i.children?.flatMap((c) => c.subChildren || []) ||
                            []),
                        ])
                        .find((i) => i.id === id);
                      return !item?.children && !item?.subChildren;
                    })
                    .map((id) => {
                      const item = items
                        .flatMap((i) => [
                          i,
                          ...(i.children || []),
                          ...(i.children?.flatMap((c) => c.subChildren || []) ||
                            []),
                        ])
                        .find((i) => i.id === id);
                      return (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="text-gray-800 text-[10px] px-1.5 py-0.25 rounded-full shadow-sm transition-all duration-200 active:scale-95 animate-fade-in"
                          title={getItemPath(id, items)}
                          aria-label={`Remove ${item?.label || id}`}
                        >
                          {item?.label || id}
                          <X
                            className="h-2.5 w-2.5 ml-0.5 cursor-pointer hover:text-gray-900 transition-colors duration-200"
                            onClick={() => handleRemove(id, field)}
                          />
                        </Badge>
                      );
                    })
                ) : (
                  <span className="text-xs text-gray-500">
                    No skills selected
                  </span>
                )}
              </div>
              <div className="border border-gray-200 rounded-lg p-2.5 max-h-72 overflow-y-auto">
                {renderItems(items)}
              </div>
              <FormMessage className="text-red-500 text-xs mt-1" />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}