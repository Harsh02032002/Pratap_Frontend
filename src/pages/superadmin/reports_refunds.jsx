import React, { useState, useEffect } from "react";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { StatCard } from "../../components/dashboard/StatCard";
import { DataTable, TableToolbar, StatusBadge } from "../../components/dashboard/DataTable";
import { RotateCcw, Clock, CheckCircle2, XCircle, Eye } from "lucide-react";
import { fetchJson } from "../../utils/api";

export default function Refunds() {
  const [refunds, setRefunds] = useState([]);

  useEffect(() => {
    fetchJson("/api/bookings/refund-requests")
      .then((res) => {
        const list = res?.data || res?.refundRequests || (Array.isArray(res) ? res : []);
        setRefunds(
          list.map((r, i) => ({
            id: r._id ? `RF-${String(r._id).slice(-4).toUpperCase()}` : `RF-${i + 1}`,
            txn: r.refund_transaction_id || r.payment_id || "N/A",
            customer: r.user_name || "Guest",
            reason: r.other_details || r.request_type || "Refund",
            amount: `₹${Number(r.refund_amount || 0).toLocaleString("en-IN")}`,
            rawAmount: Number(r.refund_amount || 0),
            date: r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : "N/A",
            status: r.refund_status ? r.refund_status.charAt(0).toUpperCase() + r.refund_status.slice(1) : "Pending",
          }))
        );
      })
      .catch((err) => console.error("Failed to load refunds:", err));
  }, []);

  const totalAmount = refunds.reduce((s, r) => s + (r.rawAmount || 0), 0);
  const processedCount = refunds.filter((r) => ["Processed", "Refunded", "Approved"].includes(r.status)).length;
  const pendingCount = refunds.filter((r) => r.status === "Pending").length;
  const rejectedCount = refunds.filter((r) => r.status === "Rejected").length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader
        title="Refunds"
        subtitle="Process and track refund requests."
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Total Refunds" value={`₹${totalAmount.toLocaleString("en-IN")}`} delta="Scoped total" trend="down" icon={RotateCcw} iconColor="red" />
        <StatCard label="Processed" value={String(processedCount)} delta="Completed" icon={CheckCircle2} iconColor="green" />
        <StatCard label="Pending" value={String(pendingCount)} delta="Awaiting review" icon={Clock} iconColor="yellow" />
        <StatCard label="Rejected" value={String(rejectedCount)} delta="Declined" trend="down" icon={XCircle} iconColor="purple" />
      </div>

      <div className="panel">
        <TableToolbar searchPlaceholder="Search refunds..." filters={[{ label: "Status", value: "All" }]} />
        <DataTable data={refunds} columns={[
          { key: "id", header: "Refund ID", render: (r) => <span className="font-medium">{r.id}</span> },
          { key: "txn", header: "Transaction", render: (r) => <span className="text-muted-foreground">{r.txn}</span> },
          { key: "customer", header: "Customer" },
          { key: "reason", header: "Reason" },
          { key: "amount", header: "Amount", render: (r) => <span className="font-bold text-destructive">{r.amount}</span> },
          { key: "date", header: "Date", render: (r) => <span className="text-muted-foreground text-xs">{r.date}</span> },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "actions", header: "", render: () => <button className="p-1.5 rounded hover:bg-muted"><Eye className="h-4 w-4 text-muted-foreground" /></button>, className: "text-right" },
        ]} />
      </div>
    </div>
  );
}
