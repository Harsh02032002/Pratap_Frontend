import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(" ");

const COLORS = {
  blue: "bg-blue-50 text-blue-600 border border-blue-100/60",
  green: "bg-emerald-50 text-emerald-600 border border-emerald-100/60",
  emerald: "bg-emerald-50 text-emerald-600 border border-emerald-100/60",
  yellow: "bg-amber-50 text-amber-600 border border-amber-100/60",
  amber: "bg-amber-50 text-amber-600 border border-amber-100/60",
  purple: "bg-purple-50 text-purple-600 border border-purple-100/60",
  red: "bg-rose-50 text-rose-600 border border-rose-100/60",
  rose: "bg-rose-50 text-rose-600 border border-rose-100/60",
  indigo: "bg-indigo-50 text-indigo-600 border border-indigo-100/60",
  cyan: "bg-cyan-50 text-cyan-600 border border-cyan-100/60",
  teal: "bg-teal-50 text-teal-600 border border-teal-100/60",
};

export function StatCard({ label, value, delta, trend = "neutral", icon: Icon, iconColor = "blue", loading, source, subtitle }) {
  const isNoData = value === "No Data Available";
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md group">
      {Icon && (
        <div className={cn("h-11 w-11 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-xs", COLORS[iconColor] || COLORS.blue)}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      )}
      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5 truncate max-w-full">{label}</div>
        {loading ? (
          <div className="h-7 w-20 bg-slate-100 animate-pulse rounded-md mt-1" />
        ) : (
          <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none truncate max-w-full">
            {value}
          </div>
        )}
        {(subtitle || (delta && !loading && !isNoData)) && (
          <div className="mt-1.5 flex items-center gap-1.5">
            {delta && !loading && !isNoData && (
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5",
                trend === "up" && "text-emerald-600",
                trend === "down" && "text-rose-600",
                trend === "neutral" && "text-slate-400"
              )}>
                {trend === "up" && <ArrowUp className="h-2.5 w-2.5" />}
                {trend === "down" && <ArrowDown className="h-2.5 w-2.5" />}
                {delta}
              </span>
            )}
            {subtitle && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{subtitle}</span>}
          </div>
        )}
        {source && (
          <div className="text-[9px] font-bold text-teal-600 uppercase tracking-wider mt-1">Source: {source}</div>
        )}
      </div>
    </div>
  );
}
