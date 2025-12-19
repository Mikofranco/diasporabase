// src/data/african-locations.ts
import { Country, State, City } from 'country-state-city';

// List of African countries you want to support
const africanCountryCodes = [
  'NG', 'ZA', 'KE', 'GH', 'EG', 'ET', 'MA', 'DZ', 'UG', 'SN',
  'CI', 'AO', 'CM', 'TZ', 'ZM', 'ZW', 'BW', 'NA', 'MZ', 'RW',
  // Add more if needed
];

export interface StateItem {
  stateCode: string;     // e.g., "LA"
  state: string;         // e.g., "Lagos" (display)
  lgas: string[];        // full city names
}

export interface Location {
  countryCode: string;   // e.g., "NG"
  country: string;       // e.g., "Nigeria" (display)
  states: StateItem[];
}

export const africanLocations: Location[] = africanCountryCodes
  .map((code) => {
    const countryObj = Country.getCountryByCode(code);
    if (!countryObj) return null;

    const states = State.getStatesOfCountry(code)
      .map((stateObj) => {
        const cities = City.getCitiesOfState(code, stateObj.isoCode);
        const lgas = cities
          .map((c) => c.name)
          .filter(Boolean)
          .sort();

        return {
          stateCode: stateObj.isoCode,
          state: stateObj.name,
          lgas: lgas.length > 0 ? lgas : ['No cities available'],
        };
      })
      .filter((s) => s.lgas.length > 0)
      .sort((a, b) => a.state.localeCompare(b.state));

    if (states.length === 0) return null;

    return {
      countryCode: code,
      country: countryObj.name,
      states,
    };
  })
  .filter((item): item is Location => item !== null)
  .sort((a, b) => a.country.localeCompare(b.country));