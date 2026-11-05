import React, { useState, useEffect, useMemo } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession } from "../../utils/propertyowner";
import { apiFetch } from "../../utils/api";
import {
  Briefcase, Users, CheckCircle2, Clock, AlertTriangle, ShieldCheck,
  MessageSquare, TrendingUp, Filter, RefreshCw, Plus, Building2,
  ClipboardList, Award, Search, Calendar, X
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from "recharts";

export default function StaffPerformancePage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview"); // overview | pending | history

  // Filters
  const [propertyId, setPropertyId] = useState("all");
  const [employeeId, setEmployeeId] = useState("all");
  const [department, setDepartment] = useState("all");
  const [taskStatus, setTaskStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Quick Task Assignment Modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    propertyId: "",
    assignedTo: "",
    category: "Maintenance",
    priority: "medium",
    dueDate: new Date().toISOString().slice(0, 10),
    notes: ""
  });

  const loadPerformance = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (propertyId !== "all") params.set("propertyId", propertyId);
      if (employeeId !== "all") params.set("employeeId", employeeId);
      if (department !== "all") params.set("department", department);
      if (taskStatus !== "all") params.set("taskStatus", taskStatus);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await apiFetch(
        `/api/owner-analytics/${encodeURIComponent(owner.loginId)}/employee-performance?${params.toString()}`
      );
      setData(res);
    } catch (err) {
      setError(err?.body?.message || err?.message || "Failed to load employee performance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerformance();
  }, [propertyId, employeeId, department, taskStatus]);

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.assignedTo) return;
    try {
      setSavingTask(true);
      const selectedProp = (data?.filters?.properties || []).find(
        (p) => String(p._id) === String(taskForm.propertyId)
      );
      await apiFetch("/api/tasks", {
        method: "POST",
        body: {
          ownerLoginId: owner.loginId,
          propertyId: taskForm.propertyId || undefined,
          propertyName: selectedProp?.title || "",
          title: taskForm.title,
          assignedStaffName: taskForm.assignedTo,
          assignedTo: taskForm.assignedTo,
          category: ["Maintenance", "Cleaning", "KYC", "Rent", "Complaint", "Inspection", "Other"].includes(taskForm.category)
            ? taskForm.category
            : "Other",
          priority: "Medium",
          dueDate: taskForm.dueDate,
          notes: taskForm.notes,
          status: "Pending"
        }
      });
      setShowTaskModal(false);
      setTaskForm({
        title: "",
        propertyId: "",
        assignedTo: "",
        category: "Maintenance",
        priority: "medium",
        dueDate: new Date().toISOString().slice(0, 10),
        notes: ""
      });
      await loadPerformance();
    } catch (err) {
      alert(err?.body?.message || err?.message || "Failed to assign task");
    } finally {
      setSavingTask(false);
    }
  };

  const summary = data?.summary || {};
  const employees = data?.employees || [];
  const propertyWise = data?.propertyWiseComparison || [];
  const deptPerformance = data?.departmentPerformance || [];
  const monthlyTrends = data?.monthlyTrends || [];
  const pendingAndOverdue = data?.pendingAndOverdueTasks || [];
  const activityHistory = data?.activityHistory || [];
  const filterOpts = data?.filters || { properties: [], employees: [], departments: [] };

  const filteredActivityHistory = useMemo(() => {
    if (!searchQuery.trim()) return activityHistory;
    const q = searchQuery.trim().toLowerCase();
    return activityHistory.filter(
      (a) =>
        String(a.title || "").toLowerCase().includes(q) ||
        String(a.employeeName || "").toLowerCase().includes(q) ||
        String(a.propertyName || "").toLowerCase().includes(q) ||
        String(a.category || "").toLowerCase().includes(q) ||
        String(a.remarks || "").toLowerCase().includes(q)
    );
  }, [activityHistory, searchQuery]);

  const employeeChartData = useMemo(() => {
    return employees.map((e) => ({
      name: e.name.length > 14 ? e.name.slice(0, 12) + "…" : e.name,
      Completed: e.completedTasks,
      Pending: e.pendingTasks,
      Overdue: e.overdueTasks,
      "Completion %": e.taskCompletionPercentage
    }));
  }, [employees]);

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Property-Wise Employee Performance"
      onLogout={() => {
        clearOwnerRuntimeSession();
        window.location.href = "/propertyowner/ownerlogin";
      }}
    >
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Top Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
              <Briefcase className="w-4 h-4" /> Operational Productivity & Audits
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Property-Wise Employee Performance
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Consolidated view of staff task completion, resolved complaints, completed property inspections, and resolution speed.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setTaskForm((f) => ({
                  ...f,
                  propertyId: filterOpts.properties[0]?._id || "",
                  assignedTo: filterOpts.employees[0]?.name || ""
                }));
                setShowTaskModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Assign Staff Task
            </button>
            <button
              onClick={loadPerformance}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Bar: Property, Employee, Department, Task Status, Date Range */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Property
              </label>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="all">All Properties</option>
                {filterOpts.properties.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Employee
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="all">All Employees</option>
                {filterOpts.employees.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="all">All Departments</option>
                {filterOpts.departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Task Status
              </label>
              <select
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                To Date
              </label>
              <div className="flex gap-1.5">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
                <button
                  onClick={loadPerformance}
                  className="px-3 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 font-semibold shrink-0"
                >
                  Go
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 8 Performance Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-slate-400">Assigned Tasks</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{summary.totalAssignedTasks || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-emerald-600">Completed Tasks</p>
            <p className="text-xl font-bold text-emerald-700 mt-1">{summary.completedTasks || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-amber-500">Pending Tasks</p>
            <p className="text-xl font-bold text-amber-600 mt-1">{summary.pendingTasks || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-rose-500">Overdue Tasks</p>
            <p className="text-xl font-bold text-rose-600 mt-1">{summary.overdueTasks || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-indigo-600">Complaints Resolved</p>
            <p className="text-xl font-bold text-indigo-700 mt-1">{summary.complaintsResolved || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-purple-600">Inspections Done</p>
            <p className="text-xl font-bold text-purple-700 mt-1">{summary.inspectionsCompleted || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-cyan-600">Avg Resolution</p>
            <p className="text-xl font-bold text-cyan-700 mt-1">
              {summary.avgResolutionTimeHours || 0} <span className="text-xs font-normal">hrs</span>
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl shadow-sm">
            <p className="text-[10px] font-bold uppercase text-emerald-700">Completion %</p>
            <p className="text-xl font-bold mt-1">{summary.taskCompletionPercentage || 0}%</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          {[
            { id: "overview", label: `Employee Cards & Analytics (${employees.length})` },
            { id: "pending", label: `Pending & Overdue Tasks (${pendingAndOverdue.length})` },
            { id: "history", label: `Employee Activity History (${activityHistory.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === tab.id
                  ? "bg-teal-50 text-teal-900 border border-teal-300 shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
            Loading employee performance metrics…
          </div>
        ) : (
          <>
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Employee-Wise Performance Cards */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">
                    Employee-Wise Performance Cards
                  </h3>
                  {employees.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500">
                      No staff members or assigned tasks found for the selected filters.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {employees.map((emp) => (
                        <div
                          key={emp._id}
                          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-teal-700 text-white font-bold flex items-center justify-center text-sm">
                                  {(emp.name || "S").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900">{emp.name}</h4>
                                  <p className="text-[11px] text-slate-500">
                                    {emp.department} • {emp.propertyName}
                                  </p>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {emp.taskCompletionPercentage}%
                              </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                              <div
                                className="h-full bg-teal-600 rounded-full"
                                style={{ width: `${Math.min(100, emp.taskCompletionPercentage || 0)}%` }}
                              />
                            </div>

                            {/* 8 Key Metrics Grid */}
                            <div className="grid grid-cols-4 gap-2 bg-slate-50 rounded-xl p-3 text-center mb-3">
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase font-semibold">Assigned</p>
                                <p className="text-sm font-bold text-slate-800">{emp.totalAssignedTasks}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase font-semibold">Done</p>
                                <p className="text-sm font-bold text-emerald-700">{emp.completedTasks}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase font-semibold">Pending</p>
                                <p className="text-sm font-bold text-amber-600">{emp.pendingTasks}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase font-semibold">Overdue</p>
                                <p className="text-sm font-bold text-rose-600">{emp.overdueTasks}</p>
                              </div>
                            </div>

                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Complaints Resolved:</span>
                                <span className="font-bold text-indigo-700">{emp.complaintsResolved}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Inspections Completed:</span>
                                <span className="font-bold text-purple-700">{emp.inspectionsCompleted}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Avg Resolution Time:</span>
                                <span className="font-semibold text-slate-800">
                                  {emp.avgResolutionTimeHours > 0 ? `${emp.avgResolutionTimeHours} hrs` : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Charts Row: Task Completion Chart + Monthly Performance Trends */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      Employee Task Completion Breakdown
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Completed vs Pending vs Overdue tasks per employee
                    </p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={employeeChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="Completed" fill="#059669" radius={[5, 5, 0, 0]} />
                          <Bar dataKey="Pending" fill="#d97706" radius={[5, 5, 0, 0]} />
                          <Bar dataKey="Overdue" fill="#e11d48" radius={[5, 5, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      Monthly Performance Trends
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Monthly task assignments, completions, and resolved complaints
                    </p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyTrends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Line
                            type="monotone"
                            dataKey="assignedTasks"
                            name="Assigned"
                            stroke="#64748b"
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="completedTasks"
                            name="Completed"
                            stroke="#059669"
                            strokeWidth={2.5}
                          />
                          <Line
                            type="monotone"
                            dataKey="complaintsResolved"
                            name="Complaints Resolved"
                            stroke="#4f46e5"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Property-Wise Comparison & Department-Wise Performance Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Property-Wise Employee Comparison */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-teal-700" /> Property-Wise Employee Comparison
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                            <th className="py-2 pr-3">Property</th>
                            <th className="py-2 px-2 text-right">Assigned</th>
                            <th className="py-2 px-2 text-right">Done</th>
                            <th className="py-2 px-2 text-right">Overdue</th>
                            <th className="py-2 px-2 text-right">Complaints</th>
                            <th className="py-2 pl-2 text-right">Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {propertyWise.map((row) => (
                            <tr key={row.propertyId} className="hover:bg-slate-50">
                              <td className="py-2.5 pr-3 font-semibold text-slate-800">
                                {row.propertyName}
                              </td>
                              <td className="py-2.5 px-2 text-right">{row.totalAssignedTasks}</td>
                              <td className="py-2.5 px-2 text-right font-semibold text-emerald-700">
                                {row.completedTasks}
                              </td>
                              <td className="py-2.5 px-2 text-right text-rose-600">{row.overdueTasks}</td>
                              <td className="py-2.5 px-2 text-right text-indigo-700">
                                {row.complaintsResolved}
                              </td>
                              <td className="py-2.5 pl-2 text-right font-bold text-teal-700">
                                {row.completionRate}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Department-Wise Performance */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-teal-700" /> Department-Wise Performance
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                            <th className="py-2 pr-3">Department</th>
                            <th className="py-2 px-2 text-right">Staff</th>
                            <th className="py-2 px-2 text-right">Assigned</th>
                            <th className="py-2 px-2 text-right">Done</th>
                            <th className="py-2 px-2 text-right">Inspections</th>
                            <th className="py-2 pl-2 text-right">Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {deptPerformance.map((row) => (
                            <tr key={row.department} className="hover:bg-slate-50">
                              <td className="py-2.5 pr-3 font-semibold text-slate-800">{row.department}</td>
                              <td className="py-2.5 px-2 text-right">{row.staffCount}</td>
                              <td className="py-2.5 px-2 text-right">{row.totalAssignedTasks}</td>
                              <td className="py-2.5 px-2 text-right font-semibold text-emerald-700">
                                {row.completedTasks}
                              </td>
                              <td className="py-2.5 px-2 text-right text-purple-700">
                                {row.inspectionsCompleted}
                              </td>
                              <td className="py-2.5 pl-2 text-right font-bold text-teal-700">
                                {row.completionRate}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pending & Overdue Tasks Tab */}
            {activeTab === "pending" && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">
                    Pending & Overdue Task Report ({pendingAndOverdue.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Actionable report of unresolved staff tasks, open complaints, and overdue items
                  </p>
                </div>
                {pendingAndOverdue.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-500">
                    All assigned tasks and complaints are completed! Zero pending or overdue items.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                          <th className="py-3 px-4">Assigned Date</th>
                          <th className="py-3 px-4">Employee</th>
                          <th className="py-3 px-4">Assigned Property</th>
                          <th className="py-3 px-4">Task Category & Title</th>
                          <th className="py-3 px-3">Due Date</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pendingAndOverdue.map((item) => (
                          <tr key={item._id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-600">
                              {new Date(item.assignedDate).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                              })}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {item.employeeName}
                            </td>
                            <td className="py-3 px-4 text-slate-700">{item.propertyName}</td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-800">{item.category}:</span>{" "}
                              {item.title}
                            </td>
                            <td className="py-3 px-3 text-slate-600">
                              {item.dueDate
                                ? new Date(item.dueDate).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short"
                                  })
                                : "-"}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  item.status === "Overdue"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500">{item.remarks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Employee Activity History Tab */}
            {activeTab === "history" && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Employee Activity History ({filteredActivityHistory.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Complete log of task assigned dates, completion dates, assigned properties, categories, and completion remarks
                    </p>
                  </div>
                  <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter activity history…"
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                {filteredActivityHistory.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-500">
                    No activity history records match your criteria.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                          <th className="py-3.5 px-4">Task Assigned Date</th>
                          <th className="py-3.5 px-4">Task Completion Date</th>
                          <th className="py-3.5 px-4">Employee</th>
                          <th className="py-3.5 px-4">Assigned Property</th>
                          <th className="py-3.5 px-4">Task Category</th>
                          <th className="py-3.5 px-4">Current Status</th>
                          <th className="py-3.5 px-4">Completion Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredActivityHistory.map((act) => (
                          <tr key={act._id} className="hover:bg-slate-50">
                            <td className="py-3.5 px-4 text-slate-600">
                              {act.assignedDate
                                ? new Date(act.assignedDate).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                  })
                                : "-"}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {act.completedDate
                                ? new Date(act.completedDate).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                  })
                                : "In Progress / Pending"}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-900">
                              {act.employeeName}
                            </td>
                            <td className="py-3.5 px-4 text-slate-700">{act.propertyName}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                                {act.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  act.status === "Completed"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : act.status === "Overdue"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {act.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                              {act.remarks || act.title}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Assign Staff Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Assign New Staff Task</h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAssignTask} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Monthly fire safety & room inspection"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Property</label>
                  <select
                    value={taskForm.propertyId}
                    onChange={(e) => setTaskForm({ ...taskForm, propertyId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    {filterOpts.properties.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign Employee *</label>
                  <input
                    type="text"
                    required
                    list="staff-perf-emp-list"
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                    placeholder="Employee name"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                  <datalist id="staff-perf-emp-list">
                    {filterOpts.employees.map((e) => (
                      <option key={e._id} value={e.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    {["Maintenance", "Cleaning", "Inspection", "Security", "Reception", "Other"].map(
                      (c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Completion / Task Remarks</label>
                <textarea
                  rows={2}
                  value={taskForm.notes}
                  onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                >
                  {savingTask ? "Assigning…" : "Assign Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
