"use client"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { africanLocations } from "@/data/african-locations"

interface LocationSelectsProps {
  label: string
  country: string
  state: string
  lga: string
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
  const selectedCountryData = africanLocations.find((loc) => loc.country === country)
  const selectedStateData = selectedCountryData?.states.find((s) => s.state === state)

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor={`${label}-country`}>
          {label} Country {required && "*"}
        </Label>
        <Select value={country} onValueChange={onChangeCountry} required={required}>
          <SelectTrigger id={`${label}-country`}>
            <SelectValue placeholder={`Select ${label.toLowerCase()} country`} />
          </SelectTrigger>
          <SelectContent>
            {africanLocations.map((loc) => (
              <SelectItem key={loc.country} value={loc.country}>
                {loc.country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {country && (
        <div className="grid gap-2">
          <Label htmlFor={`${label}-state`}>
            {label} State / province {required && !stateOptional && "*"}
          </Label>
          <Select value={state} onValueChange={onChangeState} required={required && !stateOptional}>
            <SelectTrigger id={`${label}-state`}>
              <SelectValue placeholder={`Select ${label.toLowerCase()} state`} />
            </SelectTrigger>
            <SelectContent>
              {stateOptional && <SelectItem value="optional">(Optional)</SelectItem>}
              {selectedCountryData?.states.map((s) => (
                <SelectItem key={s.state} value={s.state}>
                  {s.state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {state && (
        <div className="grid gap-2">
          <Label htmlFor={`${label}-lga`}>
            {label} City {required && !lgaOptional && "*"}
          </Label>
          <Select value={lga} onValueChange={onChangeLga} required={required && !lgaOptional}>
            <SelectTrigger id={`${label}-lga`}>
              <SelectValue placeholder={`Select ${label.toLowerCase()} LGA`} />
            </SelectTrigger>
            <SelectContent>
              {lgaOptional && <SelectItem value="optional">(Optional)</SelectItem>}
              {selectedStateData?.lgas.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
