"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Country, State, City } from "country-state-city"

interface LocationSelectsProps {
  label: string
  country: string        // ISO code (e.g. "NG", "US")
  state: string          // state ISO code (e.g. "LA")
  lga: string            // city name
  onChangeCountry: (value: string) => void
  onChangeState: (value: string) => void
  onChangeLga: (value: string) => void
  required?: boolean
  stateOptional?: boolean
  lgaOptional?: boolean
}

export function LocationSelects({
  label,
  country,
  state,
  lga,
  onChangeCountry,
  onChangeState,
  onChangeLga,
  required = false,
  stateOptional = false,
  lgaOptional = false,
}: LocationSelectsProps) {
  const countries = Country.getAllCountries()
  const states = country ? State.getStatesOfCountry(country) : []
  const cities = country && state ? City.getCitiesOfState(country, state) : []

  return (
    <div className="grid gap-4">
      {/* COUNTRY */}
      <div className="grid gap-2">
        <Label htmlFor={`${label}-country`}>
          {label} {label !== "Nationality" && "Country"} {required && "*"}
        </Label>
        <Select value={country} onValueChange={onChangeCountry}>
          <SelectTrigger id={`${label}-country`}>
            <SelectValue placeholder={`Select ${label.toLowerCase()} country`} />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c.isoCode} value={c.isoCode}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* STATE / PROVINCE */}
      {country && (
        <div className="grid gap-2">
          <Label htmlFor={`${label}-state`}>
            {label} State / Province {required && !stateOptional && "*"}
          </Label>
          <Select value={state} onValueChange={onChangeState}>
            <SelectTrigger id={`${label}-state`}>
              <SelectValue placeholder={`Select ${label.toLowerCase()} state`} />
            </SelectTrigger>
            <SelectContent>
              {stateOptional && (
                <SelectItem value="optional">(Optional)</SelectItem>
              )}
              {states.map((s) => (
                <SelectItem key={s.isoCode} value={s.isoCode}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* CITY */}
      {state && (
        <div className="grid gap-2">
          <Label htmlFor={`${label}-lga`}>
            {label} City {required && !lgaOptional && "*"}
          </Label>
          <Select value={lga} onValueChange={onChangeLga}>
            <SelectTrigger id={`${label}-lga`}>
              <SelectValue placeholder={`Select ${label.toLowerCase()} city`} />
            </SelectTrigger>
            <SelectContent>
              {lgaOptional && (
                <SelectItem value="optional">(Optional)</SelectItem>
              )}
              {cities.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
