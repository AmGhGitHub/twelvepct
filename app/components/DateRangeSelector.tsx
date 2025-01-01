import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import "react-calendar/dist/Calendar.css";
import DatePicker from "react-date-picker";
import "react-date-picker/dist/DatePicker.css";
import "./date-picker-custom.css";

export interface DateRangeSelectorProps {
  onApply: (params: {
    startDate?: string;
    endDate?: string;
    lookback?: number;
    clear?: boolean;
  }) => void;
  isLoading?: boolean;
}

export function DateRangeSelector({
  onApply,
  isLoading = false,
}: DateRangeSelectorProps) {
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const [dateRangeType, setDateRangeType] = useState<"lookback" | "custom">(
    "lookback"
  );
  const [lookback, setLookback] = useState(90);
  const [startDate, setStartDate] = useState<Date>(
    new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
  );
  const [endDate, setEndDate] = useState<Date>(today);
  const [error, setError] = useState<string | null>(null);

  const validateDates = (start: Date, end: Date): boolean => {
    if (end < start) {
      setError("End date cannot be before start date");
      return false;
    }
    setError(null);
    return true;
  };

  const handleLookbackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLookback = parseInt(e.target.value);
    setLookback(newLookback);
    onApply({ clear: true });
  };

  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setStartDate(date);
      if (dateRangeType === "custom") {
        validateDates(date, endDate);
      }
      onApply({ clear: true });
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      setEndDate(date);
      if (dateRangeType === "custom") {
        validateDates(startDate, date);
      }
      onApply({ clear: true });
    }
  };

  const handleDateRangeTypeChange = (value: "lookback" | "custom") => {
    setDateRangeType(value);
    setError(null);

    if (value === "custom") {
      setStartDate(new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000));
      setEndDate(today);
    }
    onApply({ clear: true });
  };

  const handleApply = () => {
    if (dateRangeType === "custom") {
      if (!validateDates(startDate, endDate)) {
        return;
      }
      onApply({
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
      });
    } else {
      onApply({
        endDate: formatDate(endDate),
        lookback,
      });
    }
  };

  return (
    <div className="space-y-6">
      <RadioGroup
        defaultValue="lookback"
        onValueChange={(value) =>
          handleDateRangeTypeChange(value as "lookback" | "custom")
        }
        className="flex space-x-6"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="lookback" id="lookback" />
          <Label htmlFor="lookback">Lookback Period</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="custom" id="custom" />
          <Label htmlFor="custom">Custom Date Range</Label>
        </div>
      </RadioGroup>

      <div className="flex space-x-4 items-end">
        {dateRangeType === "custom" && (
          <div className="flex flex-col space-y-2">
            <Label htmlFor="start-date">Start Date:</Label>
            <DatePicker
              value={startDate}
              onChange={(value) => handleStartDateChange(value as Date | null)}
              format="yyyy-MM-dd"
              className="w-48"
              clearIcon={null}
              maxDate={new Date()}
            />
          </div>
        )}

        {dateRangeType === "lookback" && (
          <>
            <div className="flex flex-col space-y-2">
              <Label>End Date:</Label>
              <DatePicker
                value={endDate}
                onChange={(value) => handleEndDateChange(value as Date | null)}
                format="yyyy-MM-dd"
                className="w-48"
                clearIcon={null}
                maxDate={new Date()}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Label htmlFor="lookback-days">Lookback (Days):</Label>
              <input
                id="lookback-days"
                type="number"
                min={1}
                value={lookback}
                onChange={handleLookbackChange}
                className="w-32 border p-1 rounded"
              />
            </div>
          </>
        )}

        {dateRangeType === "custom" && (
          <div className="flex flex-col space-y-2">
            <Label>End Date:</Label>
            <DatePicker
              value={endDate}
              onChange={(value) => handleEndDateChange(value as Date | null)}
              format="yyyy-MM-dd"
              className="w-48"
              clearIcon={null}
              maxDate={new Date()}
            />
          </div>
        )}

        <Button
          variant="default"
          onClick={handleApply}
          disabled={isLoading || !!error}
          className="mb-0.5"
        >
          {isLoading ? "Loading..." : "Apply"}
        </Button>
      </div>

      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
}
