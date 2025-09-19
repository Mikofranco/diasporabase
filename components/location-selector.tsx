"use client";

import React, { useState, createContext, useContext, useEffect } from "react";
import { africanLocations, Location } from "@/data/african-locations"; // Adjust path
import { ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Define interfaces
interface SelectedState {
  [country: string]: {
    checked: boolean;
    states: {
      [state: string]: {
        checked: boolean;
        lgas: { [lga: string]: boolean };
      };
    };
  };
}

interface ExpandedState {
  [key: string]: boolean;
}

interface SelectedData {
  selectedCountries: string[];
  selectedStates: string[];
  selectedLgas: string[];
}

// Create context for sharing selected data
interface LocationContextType {
  selected: SelectedState;
  getSelectedData: () => SelectedData;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Custom hook to access selected data
export const useSelectedLocations = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useSelectedLocations must be used within a LocationSelectorProvider");
  }
  return context;
};

interface LocationSelectorProps {
  onSelectionChange?: (data: SelectedData) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ onSelectionChange }) => {
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [selected, setSelected] = useState<SelectedState>({});

  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(getSelectedData());
    }
  }, [selected]);

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
        const countryData = africanLocations.find((c) => c.country === country);
        newSelected[country] = {
          checked: !prev[country]?.checked || false,
          states: {},
        };
        if (countryData && newSelected[country].checked) {
          // Select all states and LGAs under the country
          countryData.states.forEach((s) => {
            newSelected[country].states[s.state] = {
              checked: true,
              lgas: Object.fromEntries(s.lgas.map((lga) => [lga, true])),
            };
          });
        }
      } else if (level === "state" && state) {
        newSelected[country] = {
          ...prev[country],
          checked: true, // Check country if state is selected
          states: {
            ...prev[country]?.states,
            [state]: {
              checked: !prev[country]?.states?.[state]?.checked || false,
              lgas: prev[country]?.states?.[state]?.lgas || {},
            },
          },
        };
        if (newSelected[country].states[state].checked) {
          // Select all LGAs under the state
          const stateData = africanLocations
            .find((c) => c.country === country)
            ?.states.find((s) => s.state === state);
          if (stateData) {
            newSelected[country].states[state].lgas = Object.fromEntries(
              stateData.lgas.map((lga) => [lga, true])
            );
          }
        } else {
          // Clear LGAs if state is unchecked
          newSelected[country].states[state].lgas = {};
        }
      } else if (level === "lga" && state && lga) {
        newSelected[country] = {
          ...prev[country],
          checked: true, // Check country if LGA is selected
          states: {
            ...prev[country]?.states,
            [state]: {
              checked: true, // Check state if LGA is selected
              lgas: {
                ...prev[country]?.states?.[state]?.lgas,
                [lga]: !prev[country]?.states?.[state]?.lgas?.[lga] || false,
              },
            },
          },
        };
      }

      // Clean up: Remove empty states or uncheck country if no states/LGAs selected
      if (newSelected[country]) {
        const hasSelectedStates = Object.values(newSelected[country].states).some(
          (s) => s.checked || Object.values(s.lgas).some((l) => l)
        );
        newSelected[country].checked = hasSelectedStates;
        if (!hasSelectedStates) {
          delete newSelected[country];
        } else {
          Object.keys(newSelected[country].states).forEach((s) => {
            const hasSelectedLgas = Object.values(newSelected[country].states[s].lgas).some((l) => l);
            newSelected[country].states[s].checked = hasSelectedLgas || newSelected[country].states[s].checked;
            if (!newSelected[country].states[s].checked && !hasSelectedLgas) {
              delete newSelected[country].states[s];
            }
          });
        }
      }

      return newSelected;
    });
  };

  // Select all locations
  const selectAll = () => {
    const newSelected: SelectedState = {};
    africanLocations.forEach((countryData) => {
      newSelected[countryData.country] = {
        checked: true,
        states: Object.fromEntries(
          countryData.states.map((s) => [
            s.state,
            { checked: true, lgas: Object.fromEntries(s.lgas.map((lga) => [lga, true])) },
          ])
        ),
      };
    });
    setSelected(newSelected);
    toast.success("All locations selected");
  };

  // Clear all selections
  const clearSelection = () => {
    setSelected({});
    toast.success("Selection cleared");
  };

  // Utility to get selected data as flat arrays
  const getSelectedData = (): SelectedData => {
    const selectedCountries: string[] = [];
    const selectedStates: string[] = [];
    const selectedLgas: string[] = [];

    Object.keys(selected).forEach((country) => {
      if (selected[country].checked) {
        selectedCountries.push(country);
      }
      Object.keys(selected[country].states).forEach((state) => {
        if (selected[country].states[state].checked) {
          selectedStates.push(state);
        }
        Object.keys(selected[country].states[state].lgas).forEach((lga) => {
          if (selected[country].states[state].lgas[lga]) {
            selectedLgas.push(lga);
          }
        });
      });
    });

    return { selectedCountries, selectedStates, selectedLgas };
  };

  return (
    <LocationContext.Provider value={{ selected, getSelectedData }}>
      <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
        <style>
          {`@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap'); * { font-family: 'Roboto', sans-serif; }`}
        </style>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Select Locations</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
              title="Select all countries, states, and LGAs"
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
              className="text-red-600 border-red-600 hover:bg-red-50"
              title="Clear all selections"
            >
              Clear
            </Button>
          </div>
        </div>
        <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3">
          {africanLocations.map((countryData: Location) => {
            const countryKey = countryData.country;
            const isCountryExpanded = expanded[countryKey];

            return (
              <div key={countryKey} className="mb-3">
                <div className="flex items-center py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Checkbox
                    id={`country-${countryKey}`}
                    className="h-4 w-4 mr-3 border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selected[countryKey]?.checked || false}
                    onCheckedChange={() => handleCheckboxChange("country", countryKey)}
                    aria-label={`Select ${countryKey}`}
                    title={`Select ${countryKey} and all its states and LGAs`}
                  />
                  <button
                    type="button"
                    className="flex items-center flex-1 text-base font-medium text-gray-800 hover:text-blue-600 transition-colors"
                    onClick={() => toggleExpand(countryKey)}
                    aria-expanded={isCountryExpanded}
                    aria-label={`Expand ${countryKey}`}
                    title={`Expand ${countryKey} to view states`}
                  >
                    {isCountryExpanded ? (
                      <ChevronDown className="h-5 w-5 mr-2 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 mr-2 text-gray-500" />
                    )}
                    {countryKey}
                  </button>
                </div>
                {isCountryExpanded && (
                  <div className="ml-5 mt-2 space-y-2">
                    {countryData.states.map((stateData) => {
                      const stateKey = stateData.state;
                      const isStateExpanded = expanded[`${countryKey}-${stateKey}`];

                      return (
                        <div key={stateKey} className="mb-2">
                          <div className="flex items-center py-1.5 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <Checkbox
                              id={`state-${countryKey}-${stateKey}`}
                              className="h-4 w-4 mr-3 border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={selected[countryKey]?.states?.[stateKey]?.checked || false}
                              onCheckedChange={() => handleCheckboxChange("state", countryKey, stateKey)}
                              aria-label={`Select ${stateKey}`}
                              title={`Select ${stateKey} and all its LGAs`}
                            />
                            <button
                              type="button"
                              className="flex items-center flex-1 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                              onClick={() => toggleExpand(`${countryKey}-${stateKey}`)}
                              aria-expanded={isStateExpanded}
                              aria-label={`Expand ${stateKey}`}
                              title={`Expand ${stateKey} to view LGAs`}
                            >
                              {isStateExpanded ? (
                                <ChevronDown className="h-4 w-4 mr-2 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 mr-2 text-gray-500" />
                              )}
                              {stateKey}
                            </button>
                          </div>
                          {isStateExpanded && (
                            <div className="ml-6 mt-1.5 space-y-1">
                              {stateData.lgas.map((lga) => (
                                <div key={lga} className="my-1">
                                  <label
                                    className="flex items-center py-1 px-2 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                                    htmlFor={`lga-${countryKey}-${stateKey}-${lga}`}
                                  >
                                    <Checkbox
                                      id={`lga-${countryKey}-${stateKey}-${lga}`}
                                      className="h-4 w-4 mr-2 border-gray-300 text-blue-600 focus:ring-blue-500"
                                      checked={selected[countryKey]?.states?.[stateKey]?.lgas?.[lga] || false}
                                      onCheckedChange={() => handleCheckboxChange("lga", countryKey, stateKey, lga)}
                                      aria-label={`Select ${lga}`}
                                      title={`Select ${lga}`}
                                    />
                                    <span className="text-sm text-gray-600">{lga}</span>
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