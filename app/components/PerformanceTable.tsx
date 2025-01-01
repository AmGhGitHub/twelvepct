import { StockData } from "./types";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PerformanceTableProps {
  data: StockData[];
  metrics: Array<{
    key: keyof StockData;
    name: string;
  }>;
  page: number;
  onPageChange: (page: number) => void;
}

export function PerformanceTable({
  data,
  metrics,
  page,
  onPageChange,
}: PerformanceTableProps) {
  const pageSize = 8;
  const pageCount = Math.ceil(data.length / pageSize);

  return (
    <div className="border rounded-lg">
      <div className="h-[400px] flex flex-col">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>Date</TableHead>
                {metrics.map((metric) => (
                  <TableHead key={metric.key}>{metric.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(page * pageSize, (page + 1) * pageSize).map((row) => (
                <TableRow key={row.date}>
                  <TableCell>{row.date}</TableCell>
                  {metrics.map((metric) => (
                    <TableCell
                      key={metric.key}
                      className={
                        Number(row[metric.key] ?? 0) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {(row[metric.key] as number)?.toFixed(2)}%
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4 py-2 border-t">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {pageCount}
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(pageCount - 1, page + 1))}
              disabled={page === pageCount - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
