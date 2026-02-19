"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationSelects } from "@/components/location-selects";

interface Step2LocationDatesProps {
  country: string;
  state: string;
  lga: string;
  startDate: string;
  endDate: string;
  errors: Record<string, string[] | undefined>;
  loading: boolean;
  onFieldChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCountryChange: (v: string) => void;
  onStateChange: (v: string) => void;
  onLgaChange: (v: string) => void;
}

const today = () => new Date().toISOString().split("T")[0];

export function Step2LocationDates({
  country,
  state,
  lga,
  startDate,
  endDate,
  errors,
  loading,
  onFieldChange,
  onCountryChange,
  onStateChange,
  onLgaChange,
}: Step2LocationDatesProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">
          Location & Dates
        </h3>
        <p className="text-sm text-gray-600">
          Tell us where this project will primarily take place. Country is set
          to <span className="font-semibold text-gray-800">Nigeria</span> by
          default, but you can adjust it if needed.
        </p>
      </div>

      <div className="space-y-4">
        <LocationSelects
          label="Project"
          country={country}
          state={state}
          lga={lga}
          onChangeCountry={onCountryChange}
          onChangeState={onStateChange}
          onChangeLga={onLgaChange}
          required
          stateOptional
          lgaOptional
        />
        {errors.country?.[0] && (
          <p className="text-red-500 text-xs mt-1">{errors.country[0]}</p>
        )}
      </div>

      <div className="space-y-2 pt-4 border-t">
        <h3 className="text-lg font-semibold text-gray-900">
          Project timeline
        </h3>
        <p className="text-sm text-gray-600">
          Choose when the project will start and when you expect to complete it.
          You can always update these dates later if plans change.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div>
            <Label htmlFor="start_date" className="text-base font-semibold">
              Start Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="start_date"
              name="start_date"
              type="date"
              value={startDate}
              onChange={onFieldChange}
              disabled={loading}
              className="mt-1 h-11"
              min={today()}
            />
            {errors.start_date?.[0] && (
              <p className="text-red-500 text-xs mt-1">{errors.start_date[0]}</p>
            )}
          </div>
          <div>
            <Label htmlFor="end_date" className="text-base font-semibold">
              Target End Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="end_date"
              name="end_date"
              type="date"
              value={endDate}
              onChange={onFieldChange}
              disabled={loading}
              className="mt-1 h-11"
              min={startDate || today()}
            />
            {errors.end_date?.[0] && (
              <p className="text-red-500 text-xs mt-1">{errors.end_date[0]}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
