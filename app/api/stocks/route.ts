// app/api/stocks/route.ts
import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

const ETFs = ["SPY", "IWM", "MDY", "QQQ", "SHY", "TLT", "JNK"] as const;
const MAX_DAYS = 365 * 2; // Maximum 2 years of data
const DEFAULT_LOOKBACK = 90; // Default lookback period

function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getDateRange(params: URLSearchParams): {
  startDate: Date;
  endDate: Date;
} {
  // Initialize endDate
  let endDate: Date;
  const customEndDate = params.get("endDate");

  // Set end date
  if (customEndDate && isValidDate(customEndDate)) {
    endDate = new Date(customEndDate);
  } else {
    endDate = new Date();
  }
  endDate.setHours(0, 0, 0, 0);

  // Initialize startDate
  let startDate: Date;
  const lookback = params.get("lookback");
  const customStartDate = params.get("startDate");

  // Handle lookback period case
  if (lookback) {
    const lookbackDays = Math.min(
      Math.max(parseInt(lookback, 10), 1),
      MAX_DAYS
    );
    startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - lookbackDays);
  }
  // Handle custom date range case
  else if (customStartDate && isValidDate(customStartDate)) {
    startDate = new Date(customStartDate);
    startDate.setHours(0, 0, 0, 0);

    // Validate date range
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff > MAX_DAYS) {
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - MAX_DAYS);
    } else if (daysDiff < 0) {
      throw new Error("Start date cannot be after end date");
    }
  }
  // Default case
  else {
    startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - DEFAULT_LOOKBACK);
  }

  return { startDate, endDate };
}

interface Quote {
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  adjClose: number | null;
  date: Date;
}

interface ChartResult {
  quotes: Array<{
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
    volume: number | null;
    date: Date;
    adjclose?: number | null;
  }>;
  events?: {
    dividends?: Array<{ date: Date; amount: number }>;
    splits?: Array<{
      date: Date;
      numerator: number;
      denominator: number;
      splitRatio: string;
    }>;
  };
  meta: Record<string, unknown>;
}

function convertToHistoricalResult(chartResult: ChartResult): Quote[] {
  return chartResult.quotes
    .map((quote) => ({
      ...quote,
      open: quote.open || null,
      high: quote.high || null,
      low: quote.low || null,
      close: quote.close || null,
      volume: quote.volume || null,
      adjClose: quote.close, // Use close as adjClose
      date: new Date(quote.date),
    }))
    .filter(
      (dailyQuote) => dailyQuote.low !== null || dailyQuote.high !== null
    );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { startDate, endDate } = getDateRange(searchParams);

    const results = await Promise.all(
      ETFs.map(async (symbol) => {
        try {
          const chartData = await yahooFinance.chart(symbol, {
            period1: startDate.getTime() / 1000,
            period2: endDate.getTime() / 1000,
            interval: "1d",
          });
          const data = convertToHistoricalResult(chartData);
          return { symbol, data };
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
          throw new Error(`Failed to fetch data for ${symbol}`);
        }
      })
    );

    const allDates = new Set<string>();
    results.forEach((result) => {
      result.data.forEach((item: { date: Date }) => {
        allDates.add(formatDate(item.date));
      });
    });

    const sortedDates = Array.from(allDates).sort();

    const pricesByDate = new Map<string, Record<string, number>>();
    sortedDates.forEach((date) => {
      const entry: Record<string, number> = {};
      results.forEach(({ symbol, data }) => {
        const dataPoint = data.find((d: Quote) => formatDate(d.date) === date);
        if (dataPoint?.adjClose !== undefined) {
          entry[symbol.toLowerCase()] = dataPoint.adjClose ?? 0;
        }
      });
      pricesByDate.set(date, entry);
    });

    const combinedData = sortedDates
      .map((date) => ({
        date,
        ...pricesByDate.get(date),
      }))
      .filter((entry: Record<string, number | string>) =>
        ETFs.every(
          (symbol) =>
            typeof entry[symbol.toLowerCase()] === "number" &&
            !isNaN(entry[symbol.toLowerCase()] as number)
        )
      );

    return NextResponse.json({
      data: combinedData,
      metadata: {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        totalDays: combinedData.length,
      },
    });
  } catch (error) {
    console.error("Error fetching ETF data:", error);

    let errorMessage = "Failed to fetch ETF data";
    let status = 500;

    if (error instanceof Error) {
      if (error.message.includes("Rate limit")) {
        errorMessage = "API rate limit exceeded. Please try again later.";
        status = 429;
      } else if (error.message.includes("Invalid date")) {
        errorMessage = "Invalid date format provided";
        status = 400;
      } else if (
        error.message.includes("Start date cannot be after end date")
      ) {
        errorMessage = error.message;
        status = 400;
      } else if (error.message.includes("Failed to fetch data for")) {
        errorMessage = error.message;
        status = 500;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status });
  }
}
