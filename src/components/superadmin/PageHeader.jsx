import React from 'react';

const cn = (...classes) => classes.filter(Boolean).join(" ");

export function PageHeader({ title, category, subtitle, actions }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
      <div>
        <h1 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-[13px] text-[#4A5961] mt-0.5 leading-normal">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
