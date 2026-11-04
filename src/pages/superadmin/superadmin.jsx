import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";
import {
  fetchSuperadminStats,
  fetchBookingOverviewStats,
  fetchPropertyOverviewStats,
  fetchAccountingOverviewStats
} from "../../utils/api";
import useSEO from "../../hooks/useSEO";
import EmployeeAttendanceWidget from "../../components/EmployeeAttendanceWidget";

export default function SuperadminDashboard() {
  const navigate = useNavigate();

  useSEO({
    title: "Overview – Roomhy Superadmin",
    description: "Platform summary: users, properties, bookings, revenue.",
    canonical: "https://roomhy.com/superadmin/superadmin"
  });

  const [stats, setStats] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [propData, setPropData] = useState(null);
  const [acctData, setAcctData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = JSON.parse(
      sessionStorage.getItem('manager_user') || 
      sessionStorage.getItem('user') || 
      localStorage.getItem('manager_user') || 
      localStorage.getItem('user') || 
      'null'
    );
    const role = String(storedUser?.role || "").toLowerCase().trim();
    if (role && role !== 'superadmin' && role !== 'admin') {
      navigate('/employee/areaadmin', { replace: true });
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const [s, b, p, a] = await Promise.all([
          fetchSuperadminStats("7days"),
          fetchBookingOverviewStats("7days"),
          fetchPropertyOverviewStats(),
          fetchAccountingOverviewStats(),
        ]);
        if (s.success) setStats(s);
        if (b.success) setBookingData(b);
        if (p.success) setPropData(p);
        if (a.success) setAcctData(a);
      } catch (e) {
        console.error("Overview load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Derived Stat Cards
  const totalUsers = (stats?.stats?.tenants || 0) + (stats?.stats?.owners || 0);
  const totalProps = stats?.stats?.properties || propData?.summary?.total || 0;
  const totalBookings = stats?.stats?.totalBookings || bookingData?.summary?.monthBookings || 0;
  const totalRevenue = acctData?.summary?.revenue || acctData?.summary?.totalCollection || stats?.stats?.netRevenue || 0;

  // Format revenue cleanly
  const formattedRevenue = (() => {
    if (!totalRevenue) return "₹0";
    return `₹${Math.round(Number(totalRevenue)).toLocaleString("en-IN")}`;
  })();

  // 7-day Bar chart demonstration data matching PDF design
  const chartData = [
    { day: "Mon", bookings: 12 },
    { day: "Tue", bookings: 24 },
    { day: "Wed", bookings: 16 },
    { day: "Thu", bookings: 32 },
    { day: "Fri", bookings: 20 },
    { day: "Sat", bookings: 42 },
    { day: "Sun", bookings: 28 },
  ];

  // Pending Actions Counts
  const propertyApprovals = stats?.stats?.pendingProperties ?? propData?.summary?.pending ?? 0;
  const openSupportTickets = stats?.stats?.openTickets ?? 0;
  const reviewsToModerate = stats?.stats?.pendingReviews ?? 0;
  const visitReportsToCheck = stats?.stats?.pendingVisits ?? 0;

  // Recent Bookings (Strictly 3 items to fit on 1 screen)
  const recentBookings = (() => {
    const raw = bookingData?.recentLeads || bookingData?.recentBookings || [];
    if (raw.length === 0) {
      return [];
    }
    return raw.slice(0, 3).map((b, i) => ({
      id: b._id || i,
      guest: b.tenantName || b.userName || b.name || "Guest",
      property: b.propertyName || b.loc || "Property",
      date: b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' }) : "�",
      status: b.status || "Confirmed"
    }));
  })();

  const formatCount = (n) => {
    const val = Number(n || 0);
    return val.toLocaleString("en-IN");
  };

  return (
    <div className="max-w-[1440px] text-[#10242A] space-y-3" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-[26px] font-bold text-[#10242A] tracking-tight leading-tight">Overview</h1>
        <p className="text-[12px] text-[#4A5961] mt-0.5 leading-normal">Platform summary</p>
      </div>

      <EmployeeAttendanceWidget user={(() => {
        try { return JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "null"); } catch { return null; }
      })()} />

      {/* ── 4 Top Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Card 1: Total Users */}
        <div className="bg-white border border-[#E1E6EA] rounded-[14px] p-4 sm:p-5 shadow-xs">
          <div className="text-[12px] font-normal text-[#4A5961]">Total Users</div>
          <div className="text-[30px] font-bold text-[#10242A] tracking-tight leading-tight my-1">
            {formatCount(totalUsers)}
          </div>
          <div className="text-[11px] text-[#4A5961]">Registered accounts</div>
        </div>

        {/* Card 2: Total Properties */}
        <div className="bg-white border border-[#E1E6EA] rounded-[14px] p-4 sm:p-5 shadow-xs">
          <div className="text-[12px] font-normal text-[#4A5961]">Total Properties</div>
          <div className="text-[30px] font-bold text-[#10242A] tracking-tight leading-tight my-1">
            {formatCount(totalProps)}
          </div>
          <div className="text-[11px] text-[#4A5961]">Listed properties</div>
        </div>

        {/* Card 3: Bookings */}
        <div className="bg-white border border-[#E1E6EA] rounded-[14px] p-4 sm:p-5 shadow-xs">
          <div className="text-[12px] font-normal text-[#4A5961]">Bookings</div>
          <div className="text-[30px] font-bold text-[#10242A] tracking-tight leading-tight my-1">
            {formatCount(totalBookings)}
          </div>
          <div className="text-[11px] text-[#4A5961]">This month</div>
        </div>

        {/* Card 4: Revenue */}
        <div className="bg-white border border-[#E1E6EA] rounded-[14px] p-4 sm:p-5 shadow-xs">
          <div className="text-[12px] font-normal text-[#4A5961]">Revenue</div>
          <div className="text-[30px] font-bold text-[#10242A] tracking-tight leading-tight my-1">
            {totalRevenue ? formattedRevenue : "₹0"}
          </div>
          <div className="text-[11px] text-[#4A5961]">This month</div>
        </div>
      </div>

      {/* ── Middle Grid: Bar Chart + Pending Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Container: Bookings - last 7 days */}
        <div className="lg:col-span-8 bg-white border border-[#E1E6EA] rounded-[16px] px-4 py-3.5 sm:px-5 sm:py-4 shadow-xs flex flex-col justify-between h-[190px]">
          <h2 className="text-[16px] font-bold text-[#10242A]">Bookings – last 7 days</h2>
          <div className="h-[130px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }} 
                barCategoryGap="10%"
                barGap={4}
              >
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#4A5961", fontSize: 11, fontWeight: 500 }} 
                  dy={4}
                />
                <Tooltip 
                  cursor={{ fill: "rgba(14, 124, 134, 0.05)" }}
                  contentStyle={{ borderRadius: 8, border: "1px solid #E1E6EA", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: 12 }}
                />
                <Bar 
                  dataKey="bookings" 
                  fill="#0E7C86" 
                  radius={[3, 3, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Container: Pending actions */}
        <div className="lg:col-span-4 bg-white border border-[#E1E6EA] rounded-[16px] px-4 py-3.5 sm:px-5 sm:py-4 shadow-xs h-[190px]">
          <h2 className="text-[16px] font-bold text-[#10242A]">Pending actions</h2>
          <div className="space-y-[4px] mt-2.5">
            <div className="flex items-center justify-between text-[13px] leading-snug">
              <span className="text-[#4A5961] font-normal">Property approvals</span>
              <span className="text-[#10242A] font-bold">{String(propertyApprovals).padStart(2, '0')}</span>
            </div>
            <div className="flex items-center justify-between text-[13px] leading-snug">
              <span className="text-[#4A5961] font-normal">Open support tickets</span>
              <span className="text-[#10242A] font-bold">{String(openSupportTickets).padStart(2, '0')}</span>
            </div>
            <div className="flex items-center justify-between text-[13px] leading-snug">
              <span className="text-[#4A5961] font-normal">Reviews to moderate</span>
              <span className="text-[#10242A] font-bold">{String(reviewsToModerate).padStart(2, '0')}</span>
            </div>
            <div className="flex items-center justify-between text-[13px] leading-snug">
              <span className="text-[#4A5961] font-normal">Visit reports to check</span>
              <span className="text-[#10242A] font-bold">{String(visitReportsToCheck).padStart(2, '0')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Recent bookings ── */}
      <div className="bg-white border border-[#E1E6EA] rounded-[12px] p-[20px] pb-[8px] shadow-xs">
        <h2 className="text-[16px] font-bold text-[#10242A] mb-3">Recent bookings</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-2.5 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Guest</th>
                <th className="pb-2.5 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Property</th>
                <th className="pb-2.5 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Date</th>
                <th className="pb-2.5 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6]">
              {recentBookings.map((b, idx) => {
                const isConfirmed = String(b.status).toLowerCase().includes("confirm") || String(b.status).toLowerCase().includes("approved");
                return (
                  <tr key={b.id || idx} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-2.5 text-[14px] font-normal text-[#10242A]">{b.guest}</td>
                    <td className="py-2.5 text-[14px] text-[#4A5961]">{b.property}</td>
                    <td className="py-2.5 text-[14px] text-[#4A5961]">{b.date}</td>
                    <td className="py-2.5 text-right">
                      <span 
                        className={`inline-block px-[10px] py-[4px] rounded-full text-[12px] font-semibold ${
                          isConfirmed 
                            ? "bg-[#DDF3E4] text-[#14532D]" 
                            : "bg-[#FDEBD0] text-[#7A3E00]"
                        }`}
                      >
                        {isConfirmed ? "Confirmed" : "Pending"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
