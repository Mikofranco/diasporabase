"use client";

import React, {
  useState,
  createContext,
  useContext,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { expertiseData } from "@/data/expertise"; // your data import

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

export interface Skill {
  id: string;
  label: string;
}

export interface SubCategory {
  id: string;
  label: string;
  subChildren: Skill[];
}

export interface SkillCategory {
  id: string;
  label: string;
  children: SubCategory[];
}

interface SelectedSkillsState {
  [categoryId: string]: {
    checked: boolean;
    indeterminate?: boolean;
    subCategories: {
      [subCatId: string]: {
        checked: boolean;
        indeterminate?: boolean;
        skills: { [skillId: string]: boolean };
      };
    };
  };
}

interface ExpandedState {
  [key: string]: boolean;
}

export interface SelectedSkillsData {
  selectedCategories: string[];
  selectedSubCategories: string[];
  selectedSkills: string[];
}

interface SkillsContextType {
  selected: SelectedSkillsState;
  getSelectedData: () => SelectedSkillsData;
}

const SkillsContext = createContext<SkillsContextType | undefined>(undefined);

export const useSelectedSkills = () => {
  const context = useContext(SkillsContext);
  if (!context) {
    throw new Error("useSelectedSkills must be used within SkillsSelectorProvider");
  }
  return context;
};

// ────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────

export interface SkillsSelectorHandle {
  setSelected: (data: SelectedSkillsData) => void;
  clear: () => void;
}

interface SkillsSelectorProps {
  onSelectionChange?: (data: SelectedSkillsData) => void;
}

const SkillsSelector = forwardRef<SkillsSelectorHandle, SkillsSelectorProps>(
  ({ onSelectionChange }, ref) => {
    const [expanded, setExpanded] = useState<ExpandedState>({});
    const [selected, setSelected] = useState<SelectedSkillsState>({});

    // Helpers
    const allTrue = (obj: Record<string, boolean>) =>
      Object.keys(obj).length > 0 && Object.values(obj).every(Boolean);

    const anyTrue = (obj: Record<string, boolean>) => Object.values(obj).some(Boolean);

    const updateParentsUpward = useCallback(
      (state: SelectedSkillsState, categoryId: string, changedSubCatId?: string) => {
        const cat = state[categoryId];
        if (!cat) return;

        // Update subcategory if a skill changed
        if (changedSubCatId) {
          const sub = cat.subCategories[changedSubCatId];
          if (sub) {
            const allSkills = allTrue(sub.skills);
            const anySkill = anyTrue(sub.skills);
            sub.checked = allSkills;
            sub.indeterminate = !allSkills && anySkill;
          }
        }

        // Update category based on subcategories
        const subs = cat.subCategories;
        const subIds = Object.keys(subs);

        const allSubsChecked = subIds.length > 0 && subIds.every((id) => subs[id].checked);
        const anySubActive =
          subIds.some((id) => subs[id].checked || subs[id].indeterminate) || false;

        cat.checked = allSubsChecked;
        cat.indeterminate = !allSubsChecked && anySubActive;

        // Cleanup empty category
        if (!cat.checked && !cat.indeterminate) {
          delete state[categoryId];
        }
      },
      []
    );

    // Build state from flat selected data
    const buildSelectedState = useCallback((data: SelectedSkillsData): SelectedSkillsState => {
      const newState: SelectedSkillsState = {};

      // Add selected skills
      data.selectedSkills.forEach((skillId) => {
        for (const cat of expertiseData) {
          for (const sub of cat.children) {
            if (sub.subChildren.some((s) => s.id === skillId)) {
              if (!newState[cat.id]) newState[cat.id] = { checked: false, subCategories: {} };
              if (!newState[cat.id].subCategories[sub.id]) {
                newState[cat.id].subCategories[sub.id] = { checked: false, skills: {} };
              }
              newState[cat.id].subCategories[sub.id].skills[skillId] = true;
              updateParentsUpward(newState, cat.id, sub.id);
              break;
            }
          }
        }
      });

      // Add selected subcategories (override if partial skills already set)
      data.selectedSubCategories.forEach((subId) => {
        for (const cat of expertiseData) {
          const sub = cat.children.find((s) => s.id === subId);
          if (sub) {
            if (!newState[cat.id]) newState[cat.id] = { checked: false, subCategories: {} };
            newState[cat.id].subCategories[subId] = {
              checked: true,
              indeterminate: false,
              skills: Object.fromEntries(sub.subChildren.map((s) => [s.id, true])),
            };
            updateParentsUpward(newState, cat.id);
            break;
          }
        }
      });

      // Add selected categories
      data.selectedCategories.forEach((catId) => {
        if (!newState[catId]) {
          newState[catId] = { checked: true, indeterminate: false, subCategories: {} };
        } else {
          newState[catId].checked = true;
          newState[catId].indeterminate = false;
        }
      });

      return newState;
    }, [updateParentsUpward]);

    useImperativeHandle(ref, () => ({
      setSelected: (data: SelectedSkillsData) => {
        setSelected(buildSelectedState(data));
      },
      clear: () => {
        setSelected({});
        toast.info("Skills selection cleared");
      },
    }), [buildSelectedState]);

    useEffect(() => {
      onSelectionChange?.(getSelectedData());
    }, [selected, onSelectionChange]);

    const toggleExpand = (key: string) => {
      setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleCheckboxChange = (
      level: "category" | "subcategory" | "skill",
      categoryId: string,
      subCatId?: string,
      skillId?: string
    ) => {
      setSelected((prev) => {
        const next = structuredClone(prev); // deep copy

        if (level === "skill" && subCatId && skillId) {
          // Ensure structure exists
          if (!next[categoryId]) next[categoryId] = { checked: false, subCategories: {} };
          if (!next[categoryId].subCategories[subCatId]) {
            next[categoryId].subCategories[subCatId] = { checked: false, skills: {} };
          }

          const skillsMap = next[categoryId].subCategories[subCatId].skills;
          skillsMap[skillId] = !skillsMap[skillId] ?? true;

          // Cleanup
          if (!anyTrue(skillsMap)) {
            delete next[categoryId].subCategories[subCatId];
          }
          if (!Object.keys(next[categoryId].subCategories).length) {
            delete next[categoryId];
          }

          updateParentsUpward(next, categoryId, subCatId);
        } 
        else if (level === "subcategory" && subCatId) {
          if (!next[categoryId]) next[categoryId] = { checked: false, subCategories: {} };

          const subMap = next[categoryId].subCategories;
          const wasChecked = subMap[subCatId]?.checked ?? false;

          if (wasChecked) {
            delete subMap[subCatId];
          } else {
            const catData = expertiseData.find((c) => c.id === categoryId);
            const subData = catData?.children.find((s) => s.id === subCatId);
            if (subData) {
              subMap[subCatId] = {
                checked: true,
                indeterminate: false,
                skills: Object.fromEntries(subData.subChildren.map((s) => [s.id, true])),
              };
            }
          }

          updateParentsUpward(next, categoryId);
        } 
        else if (level === "category") {
          const cat = next[categoryId];
          const willCheck = !(cat?.checked ?? false);

          if (willCheck) {
            const catData = expertiseData.find((c) => c.id === categoryId);
            if (catData) {
              next[categoryId] = {
                checked: true,
                indeterminate: false,
                subCategories: Object.fromEntries(
                  catData.children.map((sub) => [
                    sub.id,
                    {
                      checked: true,
                      indeterminate: false,
                      skills: Object.fromEntries(sub.subChildren.map((s) => [s.id, true])),
                    },
                  ])
                ),
              };
            }
          } else {
            delete next[categoryId];
          }
        }

        return next;
      });
    };

    const getSelectedData = useCallback((): SelectedSkillsData => {
      const categories: string[] = [];
      const subCategories: string[] = [];
      const skills: string[] = [];

      Object.entries(selected).forEach(([catId, catData]) => {
        if (catData.checked) categories.push(catId);

        Object.entries(catData.subCategories).forEach(([subId, subData]) => {
          if (subData.checked) subCategories.push(subId);

          Object.entries(subData.skills).forEach(([skillId, checked]) => {
            if (checked) skills.push(skillId);
          });
        });
      });

      return {
        selectedCategories: categories,
        selectedSubCategories: subCategories,
        selectedSkills: skills,
      };
    }, [selected]);

    const clearSelection = () => {
      setSelected({});
      toast.success("Selection cleared");
    };

    return (
  <SkillsContext.Provider value={{ selected, getSelectedData }}>
    <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-gray-900">
          Select Skills & Expertise
        </h2>
        <Button variant="outline" size="sm" onClick={clearSelection}>
          Clear all
        </Button>
      </div>

      <div className="max-h-[520px] overflow-y-auto pr-3 space-y-3">
        {expertiseData.map((category) => {
          const catId = category.id;
          const isCatExpanded = expanded[catId] ?? false;

          return (
            <div key={catId} className="mb-3">
              {/* Category level - larger */}
              <div className="flex items-center py-2.5 px-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <Checkbox
                  id={`cat-${catId}`}
                  className="h-5 w-5 mr-3 data-[state=indeterminate]:bg-blue-500"
                  checked={selected[catId]?.checked || false}
                  indeterminate={selected[catId]?.indeterminate || false}
                  onCheckedChange={() => handleCheckboxChange("category", catId)}
                />
                <button
                  type="button"
                  className="flex items-center flex-1 text-base font-semibold text-gray-900 hover:text-blue-700"
                  onClick={() => toggleExpand(catId)}
                >
                  {isCatExpanded ? (
                    <ChevronDown className="h-5 w-5 mr-2.5 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-5 w-5 mr-2.5 text-gray-600" />
                  )}
                  {category.label}
                </button>
              </div>

              {isCatExpanded && (
                <div className="ml-6 mt-2 space-y-2">
                  {category.children.map((subCat) => {
                    const subId = subCat.id;
                    const isSubExpanded = expanded[`${catId}-${subId}`] ?? false;

                    return (
                      <div key={subId} className="mb-1.5">
                        {/* Subcategory level - medium */}
                        <div className="flex items-center py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <Checkbox
                            id={`sub-${catId}-${subId}`}
                            className="h-4.5 w-4.5 mr-3 data-[state=indeterminate]:bg-blue-500"
                            checked={
                              selected[catId]?.subCategories?.[subId]?.checked || false
                            }
                            indeterminate={
                              selected[catId]?.subCategories?.[subId]?.indeterminate || false
                            }
                            onCheckedChange={() =>
                              handleCheckboxChange("subcategory", catId, subId)
                            }
                          />
                          <button
                            type="button"
                            className="flex items-center flex-1 text-sm font-medium text-gray-800 hover:text-blue-600"
                            onClick={() => toggleExpand(`${catId}-${subId}`)}
                          >
                            {isSubExpanded ? (
                              <ChevronDown className="h-4 w-4 mr-2 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 mr-2 text-gray-500" />
                            )}
                            {subCat.label}
                          </button>
                        </div>

                        {isSubExpanded && (
                          <div className="ml-8 mt-1 space-y-0.5">
                            {/* Skill level (sub sub) - smallest */}
                            {subCat.subChildren.map((skill) => (
                              <label
                                key={skill.id}
                                htmlFor={`skill-${catId}-${subId}-${skill.id}`}
                                className="flex items-center py-1 px-2 hover:bg-gray-50 rounded-md cursor-pointer text-xs text-gray-700"
                              >
                                <Checkbox
                                  id={`skill-${catId}-${subId}-${skill.id}`}
                                  className="h-3.5 w-3.5 mr-2.5 border-gray-400 data-[state=checked]:bg-blue-600"
                                  checked={
                                    selected[catId]?.subCategories?.[subId]?.skills?.[
                                      skill.id
                                    ] || false
                                  }
                                  onCheckedChange={() =>
                                    handleCheckboxChange("skill", catId, subId, skill.id)
                                  }
                                />
                                {skill.label}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  </SkillsContext.Provider>

    );
  }
);

SkillsSelector.displayName = "SkillsSelector";

export default SkillsSelector;