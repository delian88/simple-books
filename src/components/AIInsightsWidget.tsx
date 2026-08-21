import { useQuery } from "@tanstack/react-query";
import { generateFinancialInsights } from "@/lib/ai.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, TrendingUp, AlertCircle, RefreshCw, Bot, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AIInsightsWidget() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["financialInsights"],
    queryFn: () => generateFinancialInsights(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  return (
    <Card className="mb-6 border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white overflow-hidden relative shadow-sm">
      {/* Decorative background blur */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-emerald-950 font-display">AI Financial Insights</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100/50 h-8 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Analyzing..." : "Refresh"}
          </Button>
        </div>

        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <Bot className="h-10 w-10 text-emerald-300 mb-3 animate-pulse" />
            <p className="text-sm font-medium text-emerald-800">Our AI is analyzing your last 90 days...</p>
            <p className="text-xs text-emerald-600/70 mt-1">Extracting patterns from your expenses and revenue.</p>
          </div>
        ) : isError || !data ? (
          <div className="py-6 flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-lg">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">Unable to generate insights at this time. Please try again later.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" /> Key Observations
              </h3>
              <ul className="space-y-3">
                {data.insights?.map((insight: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700 items-start">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 mt-2" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="border-t md:border-t-0 md:border-l border-emerald-100 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center">
              <h3 className="text-sm font-semibold text-emerald-900 uppercase tracking-wider flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-emerald-600" /> 30-Day Forecast
              </h3>
              <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm relative">
                <div className="absolute -top-2 -left-2">
                  <span className="flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                  </span>
                </div>
                <p className="text-sm text-gray-700 italic">
                  "{data.prediction}"
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
