import React from 'react';

export function StatCard({ label, value, loading }) {
  const cleanLabel = typeof label === "string" ? label.replace(/\s*\([^)]*\)/g, "").replace(/\s*\[[^\]]*\]/g, "").trim() : label;
  const cleanValue = typeof value === "string" ? value.replace(/^\[|\]$/g, "") : value;
  return (
    <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
      <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{cleanLabel}</p>
      <div className="mt-2">
        {loading ? (
          <div className="h-7 w-20 bg-slate-100 animate-pulse rounded-md mt-1" />
        ) : (
          <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none truncate">
            {cleanValue}
          </h3>
        )}
      </div>
    </div>
  );
}
