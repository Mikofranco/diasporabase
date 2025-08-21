import React from 'react';
import { useSelectedLocations } from './location-selector';

interface LocationProcessorProps {
  onSelectCountry?: (country: string) => void;
  onSelectState?: (country: string, state: string) => void;
  onSelectLga?: (country: string, state: string, lga: string) => void;
}

const LocationProcessor: React.FC<LocationProcessorProps> = ({
  onSelectCountry,
  onSelectState,
  onSelectLga,
}) => {
  const selected = useSelectedLocations();

  // Extract selected items
  const getSelectedItems = () => {
    const countries: string[] = [];
    const states: { country: string; state: string }[] = [];
    const lgas: { country: string; state: string; lga: string }[] = [];

    Object.entries(selected).forEach(([country, countryData]) => {
      if (countryData.checked) {
        countries.push(country);
      }
      Object.entries(countryData.states).forEach(([state, stateData]) => {
        if (stateData.checked) {
          states.push({ country, state });
        }
        Object.entries(stateData.lgas).forEach(([lga, isChecked]) => {
          if (isChecked) {
            lgas.push({ country, state, lga });
          }
        });
      });
    });

    return { countries, states, lgas };
  };

  const { countries, states, lgas } = getSelectedItems();

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm max-w-2xl mx-auto mt-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Selected Locations</h2>
      {countries.length === 0 && states.length === 0 && lgas.length === 0 ? (
        <p className="text-gray-500">No locations selected.</p>
      ) : (
        <>
          {countries.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Countries</h3>
              <ul className="list-disc pl-6 text-gray-600">
                {countries.map((country) => (
                  <li key={country} className="my-1">
                    {country}
                    <button
                      type="button"
                      className="ml-2 text-blue-600 hover:underline text-sm"
                      onClick={() => onSelectCountry?.(country)}
                    >
                      Select
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {states.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-700">States</h3>
              <ul className="list-disc pl-6 text-gray-600">
                {states.map(({ country, state }) => (
                  <li key={`${country}-${state}`} className="my-1">
                    {`${country} > ${state}`}
                    <button
                      type="button"
                      className="ml-2 text-blue-600 hover:underline text-sm"
                      onClick={() => onSelectState?.(country, state)}
                    >
                      Select
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {lgas.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700">LGAs</h3>
              <ul className="list-disc pl-6 text-gray-600">
                {lgas.map(({ country, state, lga }) => (
                  <li key={`${country}-${state}-${lga}`} className="my-1">
                    {`${country} > ${state} > ${lga}`}
                    <button
                      type="button"
                      className="ml-2 text-blue-600 hover:underline text-sm"
                      onClick={() => onSelectLga?.(country, state, lga)}
                    >
                      Select
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LocationProcessor;