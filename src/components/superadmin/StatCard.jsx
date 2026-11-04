import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(" ");

export function StatCard({ label, value, delta, trend = "neutral", loading, source, subtitle }) {
  const isNoData = value === "No Data Available";
  return (
    <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
      <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{label}</p>
      <div className="mt-2">
        {loading ? (
          <div className="h-7 w-20 bg-slate-100 animate-pulse rounded-md mt-1" />
        ) : (
          <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none truncate">
            {value}
          </h3>
        )}
        {(subtitle || (delta && !loading && !isNoData)) && (
          <div className="mt-1.5 flex items-center gap-1.5">
            {delta && !loading && !isNoData && (
              <span className={cn(
                "text-[11px] font-semibold flex items-center gap-0.5",
                trend === "up" && "text-[#14532D]",
                trend === "down" && "text-[#991B1B]",
                trend === "neutral" && "text-[#708088]"
              )}>
                {trend === "up" && <ArrowUp className="h-3 w-3" />}
                {trend === "down" && <ArrowDown className="h-3 w-3" />}
                {delta}
              </span>
            )}
            {subtitle && <span className="text-[11px] text-[#708088]">{subtitle}</span>}
          </div>
        )}
        {source && (
          <div className="text-[10px] font-semibold text-[#0E7C86] uppercase tracking-wider mt-1">Source: {source}</div>
        )}
      </div>
    </div>
  );
}
