import React, { useState, createContext, useContext } from 'react';
import { africanLocations, Location } from '@/data/african-locations'; // Adjust path as needed
import { ChevronDown, ChevronRight } from 'lucide-react'; // Lucide React icons

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

// Create context for sharing selected data
interface LocationContextType {
  selected: SelectedState;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Custom hook to access selected data
export const useSelectedLocations = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useSelectedLocations must be used within a LocationSelectorProvider');
  }
  return context.selected;
};

const LocationSelector: React.FC = () => {
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [selected, setSelected] = useState<SelectedState>({});

  // Toggle expansion of a country or state
  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Handle checkbox selection
  const handleCheckboxChange = (
    level: 'country' | 'state' | 'lga',
    country: string,
    state: string | null = null,
    lga: string | null = null
  ) => {
    setSelected((prev) => {
      const newSelected: SelectedState = { ...prev };

      if (level === 'country') {
        newSelected[country] = { checked: !prev[country]?.checked || false, states: {} };
      } else if (level === 'state' && state) {
        newSelected[country] = {
          ...prev[country],
          checked: true,
          states: {
            ...prev[country]?.states,
            [state]: { checked: !prev[country]?.states?.[state]?.checked || false, lgas: {} },
          },
        };
      } else if (level === 'lga' && state && lga) {
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

  return (
    <LocationContext.Provider value={{ selected }}>
      <div className="p-6 bg-gray-50 rounded-lg shadow-sm max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Select Locations</h2>
        {africanLocations.map((countryData: Location) => {
          const countryKey = countryData.country;
          const isCountryExpanded = expanded[countryKey];

          return (
            <div key={countryKey} className="mb-3">
              <div className="flex items-center py-2 px-3 bg-white rounded-md hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  className="mr-3 h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  checked={selected[countryKey]?.checked || false}
                  onChange={() => handleCheckboxChange('country', countryKey)}
                />
                <button
                  type="button"
                  className="flex items-center flex-1 text-lg font-semibold text-gray-800 hover:text-blue-600"
                  onClick={() => toggleExpand(countryKey)}
                >
                  {isCountryExpanded ? (
                    <ChevronDown className="h-5 w-5 mr-2" />
                  ) : (
                    <ChevronRight className="h-5 w-5 mr-2" />
                  )}
                  {countryKey}
                </button>
              </div>
              {isCountryExpanded && (
                <div className="ml-6 mt-2 ">
                  {countryData.states.map((stateData) => {
                    const stateKey = stateData.state;
                    const isStateExpanded = expanded[`${countryKey}-${stateKey}`];

                    return (
                      <div key={stateKey} className="mb-2">
                        <div className="flex items-center py-1.5 px-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                          <input
                            type="checkbox"
                            className="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            checked={selected[countryKey]?.states?.[stateKey]?.checked || false}
                            onChange={() => handleCheckboxChange('state', countryKey, stateKey)}
                          />
                          <button
                            type="button"
                            className="flex items-center flex-1 text-base font-medium text-gray-700 hover:text-blue-600"
                            onClick={() => toggleExpand(`${countryKey}-${stateKey}`)}
                          >
                            {isStateExpanded ? (
                              <ChevronDown className="h-4 w-4 mr-2" />
                            ) : (
                              <ChevronRight className="h-4 w-4 mr-2" />
                            )}
                            {stateKey}
                          </button>
                        </div>
                        {isStateExpanded && (
                          <div className="ml-8 mt-1">
                            {stateData.lgas.map((lga) => (
                              <div key={lga} className="my-1.5">
                                <label className="flex items-center py-1 px-3 hover:bg-gray-100 rounded-md transition-colors cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    checked={selected[countryKey]?.states?.[stateKey]?.lgas?.[lga] || false}
                                    onChange={() => handleCheckboxChange('lga', countryKey, stateKey, lga)}
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
    </LocationContext.Provider>
  );
};

export default LocationSelector;