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
import { africanLocations, Location } from "@/data/african-locations";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/* -------------------------------------------------
   Types
------------------------------------------------- */
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

export interface SelectedData {
  selectedCountries: string[];
  selectedStates: string[];
  selectedLgas: string[];
}

/* -------------------------------------------------
   Context (for internal use)
------------------------------------------------- */
interface LocationContextType {
  selected: SelectedState;
  getSelectedData: () => SelectedData;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useSelectedLocations = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error(
      "useSelectedLocations must be used within a LocationSelectorProvider"
    );
  }
  return context;
};

/* -------------------------------------------------
   Ref handle
------------------------------------------------- */
export interface LocationSelectorHandle {
  setSelected: (data: SelectedData) => void;
}

/* -------------------------------------------------
   Component
------------------------------------------------- */
interface LocationSelectorProps {
  onSelectionChange?: (data: SelectedData) => void;
}

const LocationSelector = forwardRef<LocationSelectorHandle, LocationSelectorProps>(
  ({ onSelectionChange }, ref) => {
    const [expanded, setExpanded] = useState<ExpandedState>({});
    const [selected, setSelected] = useState<SelectedState>({});

    /* -------------------------------------------------
       Build internal state from flat SelectedData
    ------------------------------------------------- */
    const buildSelectedState = useCallback((data: SelectedData): SelectedState => {
      const newState: SelectedState = {};

      data.selectedCountries.forEach((country) => {
        const countryData = africanLocations.find((c) => c.country === country);
        if (!countryData) return;

        newState[country] = { checked: true, states: {} };

        data.selectedStates.forEach((state) => {
          const stateData = countryData.states.find((s) => s.state === state);
          if (!stateData) return;

          newState[country].states[state] = {
            checked: true,
            lgas: {},
          };

          data.selectedLgas.forEach((lga) => {
            if (stateData.lgas.includes(lga)) {
              newState[country].states[state].lgas[lga] = true;
            }
          });
        });
      });

      return newState;
    }, []);

    /* -------------------------------------------------
       Expose setSelected via ref
    ------------------------------------------------- */
    useImperativeHandle(ref, () => ({
      setSelected: (data: SelectedData) => {
        const newState = buildSelectedState(data);
        setSelected(newState);
        // Notify parent immediately
        onSelectionChange?.(data);
      },
    }), [buildSelectedState, onSelectionChange]);

    /* -------------------------------------------------
       Notify parent ONLY when selected changes
       → Prevents infinite loop!
    ------------------------------------------------- */
    useEffect(() => {
      onSelectionChange?.(getSelectedData());
    }, [selected]); // ← Only `selected`, NOT onSelectionChange

    /* -------------------------------------------------
       Toggle expand
    ------------------------------------------------- */
    const toggleExpand = (key: string) => {
      setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    /* -------------------------------------------------
       Checkbox handler
    ------------------------------------------------- */
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
            countryData.states.forEach((s) => {
              newSelected[country].states[s.state] = {
                checked: true,
                lgas: Object.fromEntries(s.lgas.map((l) => [l, true])),
              };
            });
          }
        } else if (level === "state" && state) {
          newSelected[country] = {
            ...prev[country],
            checked: true,
            states: {
              ...prev[country]?.states,
              [state]: {
                checked: !prev[country]?.states?.[state]?.checked || false,
                lgas: prev[country]?.states?.[state]?.lgas || {},
              },
            },
          };
          if (newSelected[country].states[state].checked) {
            const stateData = africanLocations
              .find((c) => c.country === country)
              ?.states.find((s) => s.state === state);
            if (stateData) {
              newSelected[country].states[state].lgas = Object.fromEntries(
                stateData.lgas.map((l) => [l, true])
              );
            }
          } else {
            newSelected[country].states[state].lgas = {};
          }
        } else if (level === "lga" && state && lga) {
          newSelected[country] = {
            ...prev[country],
            checked: true,
            states: {
              ...prev[country]?.states,
              [state]: {
                checked: true,
                lgas: {
                  ...prev[country]?.states?.[state]?.lgas,
                  [lga]: !prev[country]?.states?.[state]?.lgas?.[lga] || false,
                },
              },
            },
          };
        }

        // Cleanup: remove empty branches
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
              newSelected[country].states[s].checked =
                hasSelectedLgas || newSelected[country].states[s].checked;
              if (!newSelected[country].states[s].checked && !hasSelectedLgas) {
                delete newSelected[country].states[s];
              }
            });
          }
        }

        return newSelected;
      });
    };

    /* -------------------------------------------------
       Select / Clear all
    ------------------------------------------------- */
    const selectAll = () => {
      const newSelected: SelectedState = {};
      africanLocations.forEach((c) => {
        newSelected[c.country] = {
          checked: true,
          states: Object.fromEntries(
            c.states.map((s) => [
              s.state,
              {
                checked: true,
                lgas: Object.fromEntries(s.lgas.map((l) => [l, true])),
              },
            ])
          ),
        };
      });
      setSelected(newSelected);
      toast.success("All locations selected");
    };

    const clearSelection = () => {
      setSelected({});
      toast.success("Selection cleared");
    };

    /* -------------------------------------------------
       Flatten to arrays
    ------------------------------------------------- */
    const getSelectedData = useCallback((): SelectedData => {
      const countries: string[] = [];
      const states: string[] = [];
      const lgas: string[] = [];

      Object.keys(selected).forEach((country) => {
        if (selected[country].checked) countries.push(country);
        Object.keys(selected[country].states).forEach((state) => {
          if (selected[country].states[state].checked) states.push(state);
          Object.keys(selected[country].states[state].lgas).forEach((lga) => {
            if (selected[country].states[state].lgas[lga]) lgas.push(lga);
          });
        });
      });

      return { selectedCountries: countries, selectedStates: states, selectedLgas: lgas };
    }, [selected]);

    /* -------------------------------------------------
       Render
    ------------------------------------------------- */
    return (
      <LocationContext.Provider value={{ selected, getSelectedData }}>
        <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <style>
            {`@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap'); * { font-family: 'Roboto', sans-serif; }`}
          </style>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Select Locations
            </h2>
            {/* Uncomment to re-enable */}
            {/* <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Clear
              </Button>
            </div> */}
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
                    />
                    <button
                      type="button"
                      className="flex items-center flex-1 text-base font-medium text-gray-800 hover:text-blue-600 transition-colors"
                      onClick={() => toggleExpand(countryKey)}
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
                                onCheckedChange={() =>
                                  handleCheckboxChange("state", countryKey, stateKey)
                                }
                              />
                              <button
                                type="button"
                                className="flex items-center flex-1 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                                onClick={() => toggleExpand(`${countryKey}-${stateKey}`)}
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
                                        checked={
                                          selected[countryKey]?.states?.[stateKey]?.lgas?.[lga] || false
                                        }
                                        onCheckedChange={() =>
                                          handleCheckboxChange("lga", countryKey, stateKey, lga)
                                        }
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
  }
);

LocationSelector.displayName = "LocationSelector";

export default LocationSelector;