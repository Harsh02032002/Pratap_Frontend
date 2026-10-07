import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(" ");

const COLORS = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  yellow: "bg-amber-50 text-amber-600",
  purple: "bg-purple-50 text-purple-600",
  red: "bg-rose-50 text-rose-600",
  indigo: "bg-indigo-50 text-indigo-600",
};

export function StatCard({ label, value, delta, trend = "neutral", icon: Icon, iconColor = "blue", loading, source, subtitle }) {
  const isNoData = value === "No Data Available";
  return (
    <div className="bg-white rounded-[12px] p-5 shadow-sm border border-[#E1E6EA] flex flex-col justify-between transition-all hover:shadow-md group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-normal text-[#4A5961] leading-tight">{label}</div>
          {loading ? (
            <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-md mt-2" />
          ) : (
            <div className="text-[30px] font-bold text-[#10242A] tracking-tight mt-2 truncate">{value}</div>
          )}
          {(subtitle || (delta && !loading && !isNoData)) && (
            <div className="mt-1.5 flex items-center gap-1.5">
              {delta && !loading && !isNoData && (
                <span className={cn(
                  "text-xs font-semibold flex items-center gap-1",
                  trend === "up" && "text-[#14532D]",
                  trend === "down" && "text-[#991B1B]",
                  trend === "neutral" && "text-[#4A5961]"
                )}>
                  {trend === "up" && <ArrowUp className="h-3 w-3" />}
                  {trend === "down" && <ArrowDown className="h-3 w-3" />}
                  {delta}
                </span>
              )}
              {subtitle && <span className="text-xs text-[#4A5961] font-normal">{subtitle}</span>}
            </div>
          )}
          {source && (
            <div className="text-[10px] font-semibold text-[#0E7C86] uppercase tracking-wider mt-2">Source: {source}</div>
          )}
        </div>
        {Icon && (
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm", COLORS[iconColor] || "bg-[#E6F4F5] text-[#0E7C86]")}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
