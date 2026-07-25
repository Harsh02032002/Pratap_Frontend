import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, MapPin, Briefcase, Home, Users, FileBadge, 
  FolderOpen, HelpCircle, CalendarCheck, Star, AlertCircle, 
  Globe, Wallet, IndianRupee, RotateCcw, ClipboardList,
  ChevronRight, ArrowUpRight, ArrowDownRight, RefreshCw,
  Sparkles, Layers, Box, Globe2, Activity, ShieldCheck,
  Zap, Headset, Megaphone
} from "lucide-react";
import { fetchJson } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const sidebarConfig = {
    'dashboard': { label: 'Dashboard', to: '/superadmin/superadmin', icon: LayoutDashboard },
    'teams': { label: 'Teams', to: '/superadmin/manager', icon: MapPin },
    'owners': { label: 'Property Owners', to: '/superadmin/owner', icon: Briefcase },
    'properties': { label: 'Properties', to: '/superadmin/properties', icon: Home },
    'tenants': { label: 'Tenants', to: '/superadmin/tenant', icon: Users },
    'new_signups': { label: 'New Signups', to: '/superadmin/new_signups', icon: FileBadge },
    'web_enquiry': { label: 'Web Enquiry', to: '/superadmin/websiteenq', icon: FolderOpen },
    'enquiries': { label: 'Enquiries', to: '/superadmin/enquiry', icon: HelpCircle },
    'bookings': { label: 'Bookings', to: '/superadmin/booking', icon: CalendarCheck },
    'reviews': { label: 'Reviews', to: '/superadmin/reviews', icon: Star },
    'complaint_history': { label: 'Complaint History', to: '/superadmin/complaint-history', icon: AlertCircle },
    'live_properties': { label: 'Live Properties', to: '/superadmin/website', icon: Globe },
    'rent_collections': { label: 'Rent Collections', to: '/superadmin/rentcollection', icon: Wallet },
    'commissions': { label: 'Commissions', to: '/superadmin/platform', icon: IndianRupee },
    'refunds': { label: 'Refunds', to: '/superadmin/refund', icon: RotateCcw },
    'locations': { label: 'Locations', to: '/superadmin/location', icon: MapPin },
    'visits': { label: 'Visit Reports', to: '/superadmin/visit', icon: ClipboardList }
};

export default function SuperadminAreaadminPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        properties: 0,
        tenants: 0,
        complaints: 0,
        visits: 0,
        pendingApprovals: 0,
        activeOwners: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = JSON.parse(
            sessionStorage.getItem('manager_user') || 
            sessionStorage.getItem('user') || 
            localStorage.getItem('manager_user') || 
            localStorage.getItem('user') || 
            'null'
        );

        if (!storedUser || (storedUser.role !== 'areamanager' && storedUser.role !== 'employee' && storedUser.role !== 'superadmin')) {
            navigate('/superadmin/index');
            return;
        }

        // Auto-heal missing storage keys to prevent sidebar routing failures
        try {
            const token = sessionStorage.getItem('token') || localStorage.getItem('token') || '';
            if (!sessionStorage.getItem('manager_user')) sessionStorage.setItem('manager_user', JSON.stringify(storedUser));
            if (!localStorage.getItem('staff_user')) localStorage.setItem('staff_user', JSON.stringify(storedUser));
            if (!sessionStorage.getItem('staff_user')) sessionStorage.setItem('staff_user', JSON.stringify(storedUser));
            if (!localStorage.getItem('manager_user')) localStorage.setItem('manager_user', JSON.stringify(storedUser));
            if (token && !localStorage.getItem('staff_token')) localStorage.setItem('staff_token', token);
        } catch (e) {
            console.warn("Auto-heal session keys failed", e);
        }

        if (storedUser.role === 'areamanager' || storedUser.role === 'manager' || storedUser.role === 'employee') {
            if (!window.location.pathname.startsWith('/employee/')) {
                navigate('/employee/areaadmin');
                return;
            }
        }

        setUser(storedUser);
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [props, tenants, complaints, visits] = await Promise.all([
                fetchJson('/api/properties').catch(() => ({ count: 0 })),
                fetchJson('/api/tenants').catch(() => ({ count: 0 })),
                fetchJson('/api/complaints').catch(() => ({ count: 0 })),
                fetchJson('/api/visits').catch(() => ({ count: 0 }))
            ]);

            const parseCount = (payload) => {
                if (Array.isArray(payload)) return payload.length;
                if (Array.isArray(payload?.data)) return payload.data.length;
                if (Array.isArray(payload?.items)) return payload.items.length;
                if (typeof payload?.count === 'number') return payload.count;
                if (typeof payload?.total === 'number') return payload.total;
                return 0;
            };

            setStats({
                properties: parseCount(props),
                tenants: parseCount(tenants),
                complaints: parseCount(complaints),
                visits: parseCount(visits),
                pendingApprovals: 12, 
                activeOwners: 45      
            });
        } catch (error) {
            console.error("Failed to load dashboard stats", error);
        } finally {
            setLoading(false);
        }
    };

    const allowedModules = useMemo(() => {
        if (!user) return [];
        if (user.role === 'superadmin' || user.role === 'areamanager') {
            return Object.keys(sidebarConfig);
        }
        const assigned = user.permissions || [];
        return [...new Set([...assigned, 'dashboard'])];
    }, [user]);

    const widgets = [
        { id: 'properties', label: 'Assets', desc: 'Manage Listings', icon: Home, color: 'blue', count: stats.properties },
        { id: 'tenants', label: 'Residents', desc: 'Active Directory', icon: Users, color: 'emerald', count: stats.tenants },
        { id: 'complaint_history', label: 'Resolution', desc: 'Operations Hub', icon: AlertCircle, color: 'amber', count: stats.complaints },
        { id: 'visits', label: 'Field Audits', desc: 'Visit Logs', icon: ClipboardList, color: 'indigo', count: stats.visits }
    ].filter(w => allowedModules.includes(w.id));

    if (!user) return null;

    return (
        <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">
                        Welcome, <span className="text-blue-600">{user.name.split(' ')[0]}</span>
                    </h1>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Territorial Governance Hub • {user.area || 'HQ'}</p>
                </div>
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{user.city || 'National'}</span>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCardHorizontal label="Regional Assets" value={stats.properties} trend="Territorial Load" up icon={Home} color="blue" />
                <StatCardHorizontal label="Awaiting Audit" value={stats.pendingApprovals} trend="Action Queue" up={false} icon={ShieldCheck} color="amber" />
                <StatCardHorizontal label="Active Owners" value={stats.activeOwners} trend="Growth Matrix" up icon={Briefcase} color="emerald" />
            </div>

            {/* Modules Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Command Suite</h3>
                    <div className="flex items-center gap-2 text-[8px] font-bold text-emerald-500 uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Hub
                    </div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {widgets.map((widget) => {
                        const Icon = widget.icon;
                        const colors = {
                            blue: "bg-blue-50 text-blue-600 border-blue-100",
                            emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
                            amber: "bg-amber-50 text-amber-600 border-amber-100",
                            indigo: "bg-indigo-50 text-indigo-600 border-indigo-100"
                        };
                        return (
                            <div 
                                key={widget.id}
                                onClick={() => {
                                    const targetPath = sidebarConfig[widget.id].to;
                                    const isEmp = window.location.pathname.startsWith('/employee/');
                                    navigate(isEmp ? targetPath.replace('/superadmin/', '/employee/') : targetPath);
                                }}
                                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-md hover:translate-y-[-4px] transition-all group cursor-pointer"
                            >
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-6 border transition-transform group-hover:scale-105", colors[widget.color])}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-[13px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors mb-1 uppercase tracking-tight">{widget.label}</h3>
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-4">{widget.desc}</p>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <p className="text-xl font-bold text-slate-800 tracking-tighter">{widget.count}</p>
                                    <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Central Governance Card */}
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-lg shadow-slate-200/50 text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-2xl -mr-16 -mt-16" />
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100">
                        <LayoutDashboard className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-2">Operational Governance</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                        Region: <span className="text-blue-600">{user.area || 'Direct HQ'}</span> • Access Level: <span className="text-slate-800">{user.role}</span>
                    </p>
                    <div className="mt-8 flex justify-center gap-4">
                        <button className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-slate-800/10">
                           Audit Logs
                        </button>
                        <button className="px-5 py-2.5 bg-white text-slate-400 rounded-xl text-[9px] font-bold uppercase tracking-widest border border-slate-100 hover:bg-slate-50 transition-all">
                           Resource Suite
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCardHorizontal({ label, value, trend, up, icon: Icon, color }) {
  const bgColors = { 
    blue: "bg-blue-50 text-blue-600 border-blue-100", 
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100", 
    amber: "bg-amber-50 text-amber-600 border-amber-100" 
  };
  
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-md flex items-start gap-4 group hover:translate-y-[-2px] transition-all duration-300">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-105", bgColors[color])}>
         <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none truncate">{label}</p>
         <p className="text-2xl font-bold text-slate-800 tracking-tight leading-none mb-2">{value}</p>
         <div className={cn(
           "flex items-center gap-1.5 text-[7px] font-bold uppercase tracking-wider",
           up ? "text-emerald-600" : "text-amber-500"
         )}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
         </div>
      </div>
    </div>
  );
}

function StatCardLarge({ label, value, trend, up, icon: Icon, color }) {
  const bgColors = { 
    blue: "bg-blue-600 shadow-blue-200", 
    green: "bg-emerald-600 shadow-emerald-200", 
    indigo: "bg-indigo-600 shadow-indigo-200", 
    orange: "bg-amber-600 shadow-amber-200" 
  };
  
  return (
    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-8 group hover:translate-y-[-8px] transition-all duration-500">
      <div className={cn("w-20 h-20 rounded-[1.75rem] flex items-center justify-center text-white shadow-2xl transition-transform group-hover:rotate-6", bgColors[color])}>
         <Icon className="w-10 h-10" />
      </div>
      <div>
         <p className="text-[11px] font-bold text-slate-400 uppercase mb-4 leading-none truncate tracking-widest">{label}</p>
         <p className="text-5xl font-bold text-slate-800 tracking-tighter leading-none">{value}</p>
      </div>
      <div className={cn(
        "flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-2xl w-fit shadow-sm border",
        up ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-rose-600 bg-rose-50 border-rose-100"
      )}>
         {up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
         {trend}
      </div>
    </div>
  );
}
