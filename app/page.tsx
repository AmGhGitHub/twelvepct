"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { DateRangeSelector } from "./components/DateRangeSelector";
import { PerformanceChart } from "./components/PerformanceChart";
import { APIResponse, StockData } from "./components/types";

const EQUITY_METRICS = [
  { key: "spy" as keyof StockData, name: "SPY", color: "#F0BB78" },
  { key: "iwm" as keyof StockData, name: "IWM", color: "#FF6384" },
  { key: "qqq" as keyof StockData, name: "QQQ", color: "#36A2EB" },
  { key: "shy" as keyof StockData, name: "SHY", color: "#5DB996" },
];

const EQUITY_PERCENT_METRICS = [
  { key: "spyChange" as keyof StockData, name: "SPY", color: "#F0BB78" },
  { key: "iwmChange" as keyof StockData, name: "IWM", color: "#FF6384" },
  { key: "qqqChange" as keyof StockData, name: "QQQ", color: "#36A2EB" },
  { key: "shyChange" as keyof StockData, name: "SHY", color: "#5DB996" },
];

const BOND_METRICS = [
  { key: "tlt" as keyof StockData, name: "TLT", color: "#9966FF" },
  { key: "jnk" as keyof StockData, name: "JNK", color: "#8D0B41" },
];

const BOND_PERCENT_METRICS = [
  { key: "tltChange" as keyof StockData, name: "TLT", color: "#9966FF" },
  { key: "jnkChange" as keyof StockData, name: "JNK", color: "#8D0B41" },
];

export default function Home() {
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDateRangeChange = async (params: {
    lookback?: number;
    startDate?: string;
    endDate?: string;
    clear?: boolean;
  }) => {
    // If clear is true, just clear the data and return
    if (params.clear) {
      setData([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.lookback) {
        queryParams.set("lookback", params.lookback.toString());
      }
      if (params.startDate) {
        queryParams.set("startDate", params.startDate);
      }
      if (params.endDate) {
        queryParams.set("endDate", params.endDate);
      }

      const response = await fetch(`/api/stocks?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch data");
      }

      const json: APIResponse = await response.json();
      const calculatedData = calculatePercentageChange(json.data);
      setData(calculatedData);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred while fetching data"
      );
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleDateRangeChange({ lookback: 90 });
  }, []);

  const calculatePercentageChange = (data: StockData[]) => {
    if (!data || data.length === 0) return [];
    const initial = data[0];
    return data.map((entry) => ({
      ...entry,
      spyChange: ((entry.spy - initial.spy) / initial.spy) * 100,
      iwmChange: ((entry.iwm - initial.iwm) / initial.iwm) * 100,
      qqqChange: ((entry.qqq - initial.qqq) / initial.qqq) * 100,
      shyChange: ((entry.shy - initial.shy) / initial.shy) * 100,
      tltChange: ((entry.tlt - initial.tlt) / initial.tlt) * 100,
      jnkChange: ((entry.jnk - initial.jnk) / initial.jnk) * 100,
    }));
  };

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-800 text-center">
        ETF Performance Dashboard
      </h1>

      <div className="max-w-4xl mx-auto">
        <DateRangeSelector
          onApply={handleDateRangeChange}
          isLoading={loading}
        />
      </div>

      {error && (
        <Alert variant="destructive" className="mt-8">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* {loading && <div className="text-center mt-8">Loading data...</div>} */}

      {/* {!error && !loading && data.length === 0 && (
        <div className="text-center mt-8 text-gray-600">
          Select a date range and click Apply to view the charts
        </div>
      )} */}

      {!error && data.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-10">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Equity ETFs (Price)
            </h2>
            <PerformanceChart
              data={data}
              metrics={EQUITY_METRICS}
              yaxis_text="USD"
            />
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Equity ETFs (% Change)
            </h2>
            <PerformanceChart
              data={data}
              metrics={EQUITY_PERCENT_METRICS}
              yaxis_text="% Change"
            />
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Bond ETFs (Price)
            </h2>
            <PerformanceChart
              data={data}
              metrics={BOND_METRICS}
              yaxis_text="USD"
            />
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Bond ETFs (% Change)
            </h2>
            <PerformanceChart
              data={data}
              metrics={BOND_PERCENT_METRICS}
              yaxis_text="% Change"
            />
          </div>
        </div>
      )}
    </div>
  );
}
