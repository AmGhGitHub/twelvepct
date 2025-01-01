import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  TooltipItem,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { StockData } from "./types";

import { Button } from "@/components/ui/button";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PerformanceChartProps {
  data: StockData[];
  metrics: { key: keyof StockData; name: string; color: string }[];
  yaxis_text: string;
}

export function PerformanceChart({
  data,
  metrics,
  yaxis_text,
}: PerformanceChartProps) {
  const chartData = {
    labels: data.map((item) => item.date),
    datasets: metrics.map((metric) => ({
      label: metric.name,
      data: data.map((item) => item[metric.key]),
      borderColor: metric.color,
      backgroundColor: "rgba(0,0,0,0)",
      pointRadius: 3,
      fill: false,
    })),
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          boxWidth: 8,
          boxHeight: 6,
          usePointStyle: true,
          pointStyle: "circle",
          color: "#374151",
          font: {
            size: 12,
            weight: 400,
          },
          padding: 20,
        },
      },
      tooltip: {
        enabled: true,
        mode: "index" as const,
        intersect: false,
        callbacks: {
          title: (tooltipItems: { label: string }[]) => {
            return `Date: ${tooltipItems[0].label}`;
          },
          label: (tooltipItem: TooltipItem<"line">) => {
            const datasetLabel = tooltipItem.dataset.label || "";
            const value = tooltipItem.raw as number;
            return `${datasetLabel}: ${value.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Date",
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: yaxis_text,
        },
      },
    },
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const downloadCSV = () => {
    const headers = ["Date", ...metrics.map((metric) => metric.name)].join(",");
    const rows = data.map((item) => {
      const row = [
        formatDate(item.date),
        ...metrics.map((metric) => item[metric.key] || ""),
      ].join(",");
      return row;
    });

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "chart_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <Line data={chartData} options={options} />

      <Button variant={"outline"} onClick={downloadCSV}>
        Download CSV
      </Button>
    </div>
  );
}
