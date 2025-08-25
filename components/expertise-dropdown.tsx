"use client";
import React, { useState, createContext, useContext } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { expertiseData } from '@/data/expertise';

// Define interfaces
interface SelectedState {
  [domain: string]: {
    checked: boolean;
    categories: {
      [category: string]: {
        checked: boolean;
        skills: {
          [skill: string]: boolean;
        };
      };
    };
  };
}

interface ExpandedState {
  [key: string]: boolean;
}

interface SelectedExpertise {
  domain: string;
  categories: string[];
  skills: string[];
}

// Create context for sharing selected data
interface ExpertiseContextType {
  selected: SelectedState;
  getSelectedExpertise: () => SelectedExpertise[];
}

const ExpertiseContext = createContext<ExpertiseContextType | undefined>(undefined);

// Custom hook to access selected data
export const useSelectedExpertise = () => {
  const context = useContext(ExpertiseContext);
  if (!context) {
    throw new Error('useSelectedExpertise must be used within an ExpertiseSelectorProvider');
  }
  return context;
};

const ExpertiseSelector: React.FC = () => {
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [selected, setSelected] = useState<SelectedState>({});

  // Toggle expansion of a domain or category
  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Handle checkbox selection
  const handleCheckboxChange = (
    level: 'domain' | 'category' | 'skill',
    domain: string,
    category: string | null = null,
    skill: string | null = null
  ) => {
    setSelected((prev) => {
      const newSelected: SelectedState = { ...prev };

      if (level === 'domain') {
        newSelected[domain] = { checked: !prev[domain]?.checked || false, categories: {} };
      } else if (level === 'category' && category) {
        newSelected[domain] = {
          ...prev[domain],
          checked: true,
          categories: {
            ...prev[domain]?.categories,
            [category]: { checked: !prev[domain]?.categories?.[category]?.checked || false, skills: {} },
          },
        };
      } else if (level === 'skill' && category && skill) {
        newSelected[domain] = {
          ...prev[domain],
          checked: true,
          categories: {
            ...prev[domain]?.categories,
            [category]: {
              ...prev[domain]?.categories?.[category],
              checked: true,
              skills: {
                ...prev[domain]?.categories?.[category]?.skills,
                [skill]: !prev[domain]?.categories?.[category]?.skills?.[skill] || false,
              },
            },
          },
        };
      }

      return newSelected;
    });
  };

  // Utility to get selected expertise in a structured format
  const getSelectedExpertise = (): SelectedExpertise[] => {
    return Object.keys(selected).reduce((acc: SelectedExpertise[], domain) => {
      if (!selected[domain]?.checked && !Object.keys(selected[domain]?.categories || {}).length) {
        return acc;
      }
      const categories = Object.keys(selected[domain]?.categories || {}).filter(
        (category) => selected[domain].categories[category].checked
      );
      const skills = Object.keys(selected[domain]?.categories || {}).flatMap((category) =>
        Object.keys(selected[domain].categories[category].skills || {}).filter(
          (skill) => selected[domain].categories[category].skills[skill]
        )
      );
      return [...acc, { domain, categories, skills }];
    }, []);
  };

  return (
    <ExpertiseContext.Provider value={{ selected, getSelectedExpertise }}>
      <div className="p-4 border rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Select Expertise</h2>
        <div className="max-h-96 overflow-y-auto space-y-2 flex flex-col items-start">
          {expertiseData.map((domainData) => {
            const domainKey = domainData.id;
            const isDomainExpanded = expanded[domainKey];

            return (
              <div key={domainKey} className="mb-2 w-full">
                <div className="flex items-center py-1.5 px-2 bg-white rounded-md hover:bg-gray-100 transition-colors">
                  <Checkbox
                    id={`domain-${domainKey}`}
                    className="h-3.5 w-3.5 mr-2"
                    checked={selected[domainKey]?.checked || false}
                    onCheckedChange={() => handleCheckboxChange('domain', domainKey)}
                    aria-label={`Select ${domainData.label}`}
                  />
                  <button
                    type="button"
                    className="flex items-center flex-1 text-base font-medium text-gray-800 hover:text-blue-600"
                    onClick={() => toggleExpand(domainKey)}
                    aria-expanded={isDomainExpanded}
                    aria-label={`Expand ${domainData.label}`}
                  >
                    {isDomainExpanded ? (
                      <ChevronDown className="h-4 w-4 mr-1" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-1" />
                    )}
                    {domainData.label}
                  </button>
                </div>
                {isDomainExpanded && (
                  <div className="ml-4 mt-1">
                    {domainData.children.map((categoryData) => {
                      const categoryKey = categoryData.id;
                      const isCategoryExpanded = expanded[`${domainKey}-${categoryKey}`];

                      return (
                        <div key={categoryKey} className="mb-1.5">
                          <div className="flex items-center py-1 px-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                            <Checkbox
                              id={`category-${domainKey}-${categoryKey}`}
                              className="h-3.5 w-3.5 mr-2"
                              checked={selected[domainKey]?.categories?.[categoryKey]?.checked || false}
                              onCheckedChange={() => handleCheckboxChange('category', domainKey, categoryKey)}
                              aria-label={`Select ${categoryData.label}`}
                            />
                            <button
                              type="button"
                              className="flex items-center flex-1 text-sm font-medium text-gray-700 hover:text-blue-600"
                              onClick={() => toggleExpand(`${domainKey}-${categoryKey}`)}
                              aria-expanded={isCategoryExpanded}
                              aria-label={`Expand ${categoryData.label}`}
                            >
                              {isCategoryExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 mr-1" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 mr-1" />
                              )}
                              {categoryData.label}
                            </button>
                          </div>
                          {isCategoryExpanded && (
                            <div className="ml-6 mt-1">
                              {categoryData.subChildren.map((skillData) => (
                                <div key={skillData.id} className="my-1">
                                  <label
                                    className="flex items-center py-0.5 px-2 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                                    htmlFor={`skill-${domainKey}-${categoryKey}-${skillData.id}`}
                                  >
                                    <Checkbox
                                      id={`skill-${domainKey}-${categoryKey}-${skillData.id}`}
                                      className="h-3.5 w-3.5 mr-2"
                                      checked={
                                        selected[domainKey]?.categories?.[categoryKey]?.skills?.[skillData.id] || false
                                      }
                                      onCheckedChange={() =>
                                        handleCheckboxChange('skill', domainKey, categoryKey, skillData.id)
                                      }
                                      aria-label={`Select ${skillData.label}`}
                                    />
                                    <span className="text-xs text-gray-600">{skillData.label}</span>
                                  </label>
                                </div>
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
    </ExpertiseContext.Provider>
  );
};

export default ExpertiseSelector;