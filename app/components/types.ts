// types.ts
export interface StockData {
  date: string;
  spy: number;
  iwm: number;
  mdy: number;
  qqq: number;
  shy: number;
  tlt: number;
  jnk: number;
  spyChange?: number;
  iwmChange?: number;
  mdyChange?: number;
  qqqChange?: number;
  shyChange?: number;
  tltChange?: number;
  jnkChange?: number;
}

export interface DateRangeOption {
  startDate: string;
  endDate: string;
}

export interface APIResponse {
  data: StockData[];
  metadata: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };
}

export interface DateRangeSelectorProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;

  onLookbackChange: (days: number) => void;
}
