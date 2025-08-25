"use client";

import React, { useState, createContext, useContext, useEffect } from "react";
import { africanLocations, Location } from "@/data/african-locations"; // Adjust path
import { ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Define interfaces
interface SelectedState {
  [country: string]: {
    checked: boolean;
    states: {
      [state: string]: {
        checked: boolean;
        lgas: {
          [lga: string]: boolean;
        };
      };
    };
  };
}

interface ExpandedState {
  [key: string]: boolean;
}

interface SelectedLocation {
  country: string;
  states: string[];
  lgas: string[];
}

// Create context for sharing selected data
interface LocationContextType {
  selected: SelectedState;
  getSelectedLocations: () => SelectedLocation[];
}

const LocationContext = createContext<LocationContextType | undefined>(
  undefined
);

// Custom hook to access selected data
export const useSelectedLocations = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error(
      "useSelectedLocations must be used within a LocationSelectorProvider"
    );
  }
  return context;
};

interface LocationSelectorProps {
  onSelectionChange?: (locations: SelectedLocation[]) => void; // New prop
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  onSelectionChange,
}) => {
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [selected, setSelected] = useState<SelectedState>({});

  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(getSelectedLocations());
    }
  }, [selected]); // Trigger whenever `selected` changes

  // Toggle expansion of a country or state
  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Handle checkbox selection
  const handleCheckboxChange = (
    level: "country" | "state" | "lga",
    country: string,
    state: string | null = null,
    lga: string | null = null
  ) => {
    setSelected((prev) => {
      const newSelected: SelectedState = { ...prev };

      if (level === "country") {
        newSelected[country] = {
          checked: !prev[country]?.checked || false,
          states: {},
        };
      } else if (level === "state" && state) {
        newSelected[country] = {
          ...prev[country],
          checked: true,
          states: {
            ...prev[country]?.states,
            [state]: {
              checked: !prev[country]?.states?.[state]?.checked || false,
              lgas: {},
            },
          },
        };
      } else if (level === "lga" && state && lga) {
        newSelected[country] = {
          ...prev[country],
          checked: true,
          states: {
            ...prev[country]?.states,
            [state]: {
              ...prev[country]?.states?.[state],
              checked: true,
              lgas: {
                ...prev[country]?.states?.[state]?.lgas,
                [lga]: !prev[country]?.states?.[state]?.lgas?.[lga] || false,
              },
            },
          },
        };
      }

      return newSelected;
    });
  };

  // Utility to get selected locations in a structured format
  const getSelectedLocations = (): SelectedLocation[] => {
    return Object.keys(selected).reduce((acc: SelectedLocation[], country) => {
      if (
        !selected[country]?.checked &&
        !Object.keys(selected[country]?.states || {}).length
      ) {
        return acc;
      }
      const states = Object.keys(selected[country]?.states || {}).filter(
        (state) => selected[country].states[state].checked
      );
      const lgas = Object.keys(selected[country]?.states || {}).flatMap(
        (state) =>
          Object.keys(selected[country].states[state].lgas || {}).filter(
            (lga) => selected[country].states[state].lgas[lga]
          )
      );
      return [...acc, { country, states, lgas }];
    }, []);
  };

  return (
    <LocationContext.Provider value={{ selected, getSelectedLocations }}>
      <div className="p-4 border rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Select Locations
        </h2>
        <div className="flex max-h-96 overflow-y-auto space-y-2 items-start flex-col">
          {africanLocations.map((countryData: Location) => {
            const countryKey = countryData.country;
            const isCountryExpanded = expanded[countryKey];

            return (
              <div key={countryKey} className="mb-2 w-full">
                <div className="flex items-center py-1.5 px-2 bg-white rounded-md hover:bg-gray-100 transition-colors">
                  <Checkbox
                    id={`country-${countryKey}`}
                    className="h-3.5 w-3.5 mr-2"
                    checked={selected[countryKey]?.checked || false}
                    onCheckedChange={() =>
                      handleCheckboxChange("country", countryKey)
                    }
                    aria-label={`Select ${countryKey}`}
                  />
                  <button
                    type="button"
                    className="flex items-center flex-1 text-base font-medium text-gray-800 hover:text-blue-600"
                    onClick={() => toggleExpand(countryKey)}
                    aria-expanded={isCountryExpanded}
                    aria-label={`Expand ${countryKey}`}
                  >
                    {isCountryExpanded ? (
                      <ChevronDown className="h-4 w-4 mr-1" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-1" />
                    )}
                    {countryKey}
                  </button>
                </div>
                {isCountryExpanded && (
                  <div className="ml-4 mt-1">
                    {countryData.states.map((stateData) => {
                      const stateKey = stateData.state;
                      const isStateExpanded =
                        expanded[`${countryKey}-${stateKey}`];

                      return (
                        <div key={stateKey} className="mb-1.5">
                          <div className="flex items-center py-1 px-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                            <Checkbox
                              id={`state-${countryKey}-${stateKey}`}
                              className="h-3.5 w-3.5 mr-2"
                              checked={
                                selected[countryKey]?.states?.[stateKey]
                                  ?.checked || false
                              }
                              onCheckedChange={() =>
                                handleCheckboxChange(
                                  "state",
                                  countryKey,
                                  stateKey
                                )
                              }
                              aria-label={`Select ${stateKey}`}
                            />
                            <button
                              type="button"
                              className="flex items-center flex-1 text-sm font-medium text-gray-700 hover:text-blue-600"
                              onClick={() =>
                                toggleExpand(`${countryKey}-${stateKey}`)
                              }
                              aria-expanded={isStateExpanded}
                              aria-label={`Expand ${stateKey}`}
                            >
                              {isStateExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 mr-1" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 mr-1" />
                              )}
                              {stateKey}
                            </button>
                          </div>
                          {isStateExpanded && (
                            <div className="ml-6 mt-1">
                              {stateData.lgas.map((lga) => (
                                <div key={lga} className="my-1">
                                  <label
                                    className="flex items-center py-0.5 px-2 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                                    htmlFor={`lga-${countryKey}-${stateKey}-${lga}`}
                                  >
                                    <Checkbox
                                      id={`lga-${countryKey}-${stateKey}-${lga}`}
                                      className="h-3.5 w-3.5 mr-2"
                                      checked={
                                        selected[countryKey]?.states?.[stateKey]
                                          ?.lgas?.[lga] || false
                                      }
                                      onCheckedChange={() =>
                                        handleCheckboxChange(
                                          "lga",
                                          countryKey,
                                          stateKey,
                                          lga
                                        )
                                      }
                                      aria-label={`Select ${lga}`}
                                    />
                                    <span className="text-xs text-gray-600">
                                      {lga}
                                    </span>
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
    </LocationContext.Provider>
  );
};

export default LocationSelector;
