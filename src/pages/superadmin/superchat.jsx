import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getScopedAuthToken } from "../../utils/authScope";
import {
  Search, MoreVertical, User, Send, Paperclip, Smile, Phone, Mail,
  Star, Globe, ChevronRight, UserCheck, Calendar, ArrowUpRight, ArrowDownRight, Building2, DollarSign, RefreshCw, Shield, MessageSquare,
  AlertTriangle, ArrowLeft
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area } from "recharts";
import { fetchJson, getApiBase } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";
import EmojiPicker from 'emoji-picker-react';
import { toast } from "react-hot-toast";

const cn = (...classes) => classes.filter(Boolean).join(" ");
const SUPERADMIN_LOGIN_ID = "SUPER_ADMIN";

const conversationsStatusData = [
  { name: "Open", value: 128, color: "#3B82F6", percent: "32.4%" },
  { name: "Closed", value: 235, color: "#10B981", percent: "59.5%" },
  { name: "Pending", value: 32, color: "#F59E0B", percent: "8.1%" }
];

const conversationsChannelData = [
  { name: "Website", value: 210, color: "#3B82F6", percent: "53%" },
  { name: "Mobile App", value: 120, color: "#10B981", percent: "30%" },
  { name: "WhatsApp", value: 45, color: "#F59E0B", percent: "11%" },
  { name: "Others", value: 20, color: "#6366F1", percent: "6%" }
];

const responseTimeTrend = [
  { name: "M", val: 100 }, { name: "T", val: 120 }, { name: "W", val: 90 },
  { name: "T", val: 110 }, { name: "F", val: 80 }, { name: "S", val: 70 }, { name: "S", val: 92 }
];

const topAgents = [
  { name: "Neha Verma", count: 128, img: "https://i.pravatar.cc/150?u=neha" },
  { name: "Rahul Singh", count: 104, img: "https://i.pravatar.cc/150?u=rahul" },
  { name: "Priya Nair", count: 87, img: "https://i.pravatar.cc/150?u=priya" }
];

const getCurrentSuperadmin = () => {
  try {
    const staff = JSON.parse(localStorage.getItem("staff_user") || localStorage.getItem("user") || "{}");
    if (staff?.loginId) return String(staff.loginId).trim().toUpperCase();
  } catch (_) {}
  return SUPERADMIN_LOGIN_ID;
};

const normalizeMessage = (message) => ({
  ...message,
  key: message?._id || `${message?.sender_login_id || "msg"}-${message?.created_at || Date.now()}`,
  text: String(message?.message || ""),
  createdAt: message?.created_at || new Date().toISOString()
});

const formatClock = (value) => {
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const resolveChatError = (err, fallback) => {
  const status = Number(err?.status || 0);
  if (status === 401) return "Session expired or unauthorized. Please log in again to access chats.";
  if (status === 404) return "Chat API not found. Please start/update backend server.";
  if (status >= 500) return "Backend error while loading chat. Please check server logs.";
  return err?.message || fallback;
};

export default function SuperChat() {
  const [search, setSearch] = useState(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    return params.get("search") || params.get("roomId") || params.get("user1") || "";
  });
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const [inbox, setInbox] = useState([]);
  const [allChatsList, setAllChatsList] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const s = params.get("search") || params.get("roomId") || params.get("fromAlerts") || params.get("user1");
    return s ? "all" : "my";
  });
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const socketRef = useRef(null);
  const activeChatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const superadminLoginId = useMemo(() => getCurrentSuperadmin(), []);
  const fromAlerts = useMemo(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    return params.get("fromAlerts") || null;
  }, []);

  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const highlightId = params.get("highlightId");
    if (!highlightId) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const highlightId = params.get("highlightId");
    if (highlightId && messages.length > 0) {
      setHighlightedMessageId(highlightId);
      setTimeout(() => {
        const element = document.getElementById(`msg-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 600);
    }
  }, [messages]);

  const loadInbox = async () => {
    setLoadingInbox(true);
    setError("");
    try {
      // Always fetch all chats for overall status stats
      fetchJson('/api/chat/all-chats').then(data => {
        if (Array.isArray(data?.conversations)) {
          setAllChatsList(data.conversations);
        }
      }).catch(() => {});

      const endpoint = viewMode === "all" 
        ? `/api/chat/all-chats?search=${encodeURIComponent(debouncedSearch)}`
        : `/api/chat/inbox/${encodeURIComponent(superadminLoginId)}?search=${encodeURIComponent(debouncedSearch)}`;
      
      const data = await fetchJson(endpoint);
      const conversations = Array.isArray(data?.conversations) ? data.conversations : [];
      
      let filtered = conversations;
      if (viewMode === "my") {
        // Only show website users for "My Chats" to match previous behavior
        filtered = conversations.filter((item) => /^roomhyweb\d{6}$/i.test(String(item?.participant_login_id || "")));
      }
      
      setInbox(filtered);
      setActiveChat((prev) => {
        const params = new URLSearchParams(window.location.search);
        const targetSearch = (params.get("search") || params.get("roomId") || params.get("user1") || "").toLowerCase();
        if (targetSearch) {
          const matched = conversations.find((c) =>
            String(c.participant_login_id || "").toLowerCase() === targetSearch ||
            String(c.user1 || "").toLowerCase() === targetSearch ||
            String(c.user2 || "").toLowerCase() === targetSearch ||
            String(c.owner_details?.loginId || "").toLowerCase() === targetSearch ||
            String(c.tenant_details?.loginId || "").toLowerCase() === targetSearch ||
            String(c.pair_key || "").toLowerCase().includes(targetSearch)
          );
          if (matched) return matched;
        }
        if (prev) return filtered.find((x) => (x.participant_login_id === prev.participant_login_id || x.pair_key === prev.pair_key)) || filtered[0] || null;
        return filtered[0] || null;
      });
    } catch (err) {
      setError(resolveChatError(err, "Failed to load chat inbox."));
      setInbox([]);
      setActiveChat(null);
    } finally {
      setLoadingInbox(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("roomId");
    const user1 = params.get("user1");
    const user2 = params.get("user2");
    if (roomId || (user1 && user2)) {
      setViewMode("all");
    }
  }, []);

  useEffect(() => { loadInbox(); }, [superadminLoginId, debouncedSearch, viewMode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("roomId");
    const user1 = params.get("user1");
    const user2 = params.get("user2");

    if (inbox.length > 0) {
      if (user1 && user2) {
        const pairKey = [user1, user2].sort().join(':').toUpperCase();
        const found = inbox.find(c => {
          const cPairKey = String(c.pair_key || '').toUpperCase();
          const cUser1 = String(c.user1 || '').toUpperCase();
          const cUser2 = String(c.user2 || '').toUpperCase();
          const u1 = user1.toUpperCase();
          const u2 = user2.toUpperCase();
          return cPairKey === pairKey || (cUser1 === u1 && cUser2 === u2) || (cUser1 === u2 && cUser2 === u1);
        });
        if (found) {
          setActiveChat(found);
          return;
        }
      }

      if (roomId) {
        const rId = roomId.toUpperCase();
        const found = inbox.find(c => {
          const pId = String(c.participant_login_id || '').toUpperCase();
          const cPairKey = String(c.pair_key || '').toUpperCase();
          return pId === rId || cPairKey === rId;
        });
        if (found) setActiveChat(found);
      }
    }
  }, [inbox]);

  useEffect(() => {
    const loadConversation = async () => {
      if (!activeChat) return setMessages([]);
      const u1 = activeChat.user1 || superadminLoginId;
      const u2 = activeChat.user2 || activeChat.participant_login_id;
      if (!u2) return setMessages([]);

      setLoadingMessages(true);
      try {
        const list = await fetchJson(`/api/chat/conversation?user1=${encodeURIComponent(u1)}&user2=${encodeURIComponent(u2)}`);
        setMessages((Array.isArray(list) ? list : []).map(normalizeMessage));
        if (viewMode === "my") {
            await fetchJson(`/api/chat/mark-read/${encodeURIComponent(superadminLoginId)}`, { method: "POST" });
        }
      } catch (err) {
        setError(resolveChatError(err, "Failed to load messages."));
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };
    loadConversation();
  }, [activeChat, superadminLoginId, viewMode]);

  useEffect(() => {
      // The server now authenticates the Socket.IO handshake and derives the
      // session identity from the account record, so a connection without a
      // valid token is refused. getScopedAuthToken() returns the panel token on
      // panel routes and website_token on the website, matching the HTTP layer.
    const socket = io(getApiBase(), { transports: ["websocket"], upgrade: false, reconnection: true, auth: { token: getScopedAuthToken() } });
    socketRef.current = socket;
    const join = () => socket.emit("join_room", { login_id: superadminLoginId, role: "superadmin", name: "Super Admin" });
    socket.on("connect", join);
    socket.on("reconnect", join);
    socket.on("receive_message", async (incoming) => {
      const current = activeChatRef.current;
      const sender = String(incoming?.sender_login_id || "").trim().toLowerCase();
      if (current?.participant_login_id && sender === String(current.participant_login_id).trim().toLowerCase()) {
        const list = await fetchJson(`/api/chat/conversation?user1=${encodeURIComponent(superadminLoginId)}&user2=${encodeURIComponent(current.participant_login_id)}`);
        setMessages((Array.isArray(list) ? list : []).map(normalizeMessage));
      }
      await loadInbox();
    });
    socket.on("new_violation_alert", (alertData) => {
      toast.custom(
        (t) => (
          <div className="bg-white border border-rose-100 rounded-2xl shadow-2xl p-5 max-w-sm pointer-events-auto flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚨</span>
              <span className="text-xs font-black text-rose-600 uppercase tracking-wider">
                Violation Detected: {alertData.violationType.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="text-xs text-slate-700 leading-normal">
              <strong>{alertData.senderName}</strong> sent a policy violating message in conversation between Owner <strong>{alertData.ownerName}</strong> and Tenant <strong>{alertData.tenantName}</strong>.
            </div>
            <div className="bg-rose-50/50 border border-rose-100/50 p-2.5 rounded-xl text-[11px] italic font-semibold text-rose-700">
              "{alertData.messageSnippet}"
            </div>
            <div className="flex items-center justify-end gap-2 mt-1">
              <button 
                onClick={() => toast.dismiss(t.id)} 
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Dismiss
              </button>
              <button 
                onClick={() => {
                  toast.dismiss(t.id);
                  // Construct a URL to highlight the specific message
                  window.location.href = `/superadmin/superchat?roomId=${alertData.ownerId}&user1=${alertData.ownerId}&user2=${alertData.tenantId}&highlightId=${alertData.id}&fromAlerts=all`;
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-[10px] font-bold shadow-lg shadow-slate-900/10 transition-colors"
              >
                View & Action
              </button>
            </div>
          </div>
        ),
        { duration: 8000, position: "top-right" }
      );
      loadInbox();
    });
    return () => socket.disconnect();
  }, [superadminLoginId]);

  const sendMessage = () => {
    if (!draft.trim() || !activeChat?.participant_login_id || !socketRef.current) return;
    const text = draft.trim();
    socketRef.current.emit("send_message", { to_login_id: activeChat.participant_login_id, message: text });
    setMessages((prev) => [...prev, normalizeMessage({
      sender_login_id: superadminLoginId,
      sender_name: "Super Admin",
      message: text,
      created_at: new Date().toISOString()
    })]);
    setDraft("");
    setShowEmojiPicker(false);
  };

  const onEmojiClick = (emojiData) => {
    setDraft(prev => prev + emojiData.emoji);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeChat?.participant_login_id) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${getApiBase()}/api/upload-file`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      
      if (data.url) {
        const isImg = file.type.startsWith('image/');
        const fileMsg = {
          to_login_id: activeChat.participant_login_id,
          message: `Sent a ${isImg ? 'photo' : 'file'}: ${file.name}`,
          message_type: isImg ? 'image' : 'file',
          file_url: data.url
        };
        socketRef.current.emit("send_message", fileMsg);
        
        setMessages(prev => [...prev, normalizeMessage({
          sender_login_id: superadminLoginId,
          sender_name: "Super Admin",
          message: fileMsg.message,
          message_type: fileMsg.message_type,
          file_url: data.url,
          created_at: new Date().toISOString()
        })]);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("File upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const listForStats = (allChatsList && allChatsList.length > 0) ? allChatsList : inbox;
  const openCountStat = listForStats.filter(c => c.status !== 'closed').length;
  const closedCountStat = listForStats.filter(c => c.status === 'closed').length;
  const unreadCountStat = inbox.reduce((acc, c) => acc + (Number(c.unread_count) || 0), 0);

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Chat Management Overview</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Monitor and respond to customer conversations across all channels.</p>
        </div>
        <div className="flex items-center gap-2.5">
          {fromAlerts && (
            <a 
              href={fromAlerts === "all" ? "/superadmin/chat/alerts" : `/superadmin/chat/alerts?filterType=${fromAlerts}`}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-[8px] text-[13px] font-semibold shadow-xs transition-all"
            >
              <ArrowLeft size={14} />
              <span>Back to Alerts</span>
            </a>
          )}
          <button
            onClick={loadInbox}
            className="flex items-center gap-2 bg-white border border-[#CBD3D9] px-3.5 py-1.5 rounded-[8px] shadow-xs text-[13px] font-semibold text-[#10242A] hover:bg-[#F4F6F8] transition-all cursor-pointer"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-[#4A5961]", loadingInbox && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stat Cards Row (NO ICONS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Total Conversations</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{listForStats.length}</h3>
          </div>
        </div>
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Open / Active</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{openCountStat}</h3>
          </div>
        </div>
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Closed Conversations</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{closedCountStat}</h3>
          </div>
        </div>
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Unread Messages</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{unreadCountStat}</h3>
          </div>
        </div>
      </div>

      {/* Search & Filter Row (Outside & Above Chat Card) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C9BA5]" size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Search conversations..."
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
          >
            <option value="my">My Inbox</option>
            <option value="all">All Chats (Monitor Mode)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[620px]">
        <div className="col-span-12 lg:col-span-3 bg-white rounded-[12px] border border-[#E1E6EA] shadow-xs flex flex-col overflow-hidden">
          <div className="p-3 border-b border-[#E1E6EA] flex items-center justify-between">
            <div className="flex bg-[#F4F6F8] p-1 rounded-[8px] w-full">
              <button 
                onClick={() => setViewMode("my")}
                className={cn("flex-1 py-1.5 text-[11px] font-semibold rounded-[6px] transition-all cursor-pointer", viewMode === "my" ? "bg-white shadow-xs text-[#095256]" : "text-[#4A5961] hover:text-[#10242A]")}
              >
                My Inbox
              </button>
              <button 
                onClick={() => setViewMode("all")}
                className={cn("flex-1 py-1.5 text-[11px] font-semibold rounded-[6px] transition-all cursor-pointer", viewMode === "all" ? "bg-white shadow-xs text-[#095256]" : "text-[#4A5961] hover:text-[#10242A]")}
              >
                All Chats
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[#F0F4F6]">
            {loadingInbox && inbox.length === 0 ? <div className="p-4 text-[12px] text-[#4A5961]">Loading conversations...</div> : null}
            {inbox.map((chat) => (
              <div key={chat.pair_key || chat.participant_login_id} onClick={() => setActiveChat(chat)} className={cn("p-3.5 flex items-center gap-3 cursor-pointer transition-all", activeChat?.participant_login_id === chat.participant_login_id ? "bg-[#E6F4F5]/40 border-l-3 border-l-[#095256]" : "hover:bg-[#F9FAFB]")}>
                <div className="w-9 h-9 rounded-full bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center font-bold text-[12px] shrink-0">
                  {String(chat.participant_name || "U").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-[13px] font-semibold text-[#10242A] truncate">{chat.participant_name || chat.participant_login_id}</h4>
                    <span className="text-[11px] text-[#4A5961]">{formatClock(chat.last_message_at)}</span>
                  </div>
                  <p className="text-[12px] text-[#4A5961] truncate leading-tight">{chat.last_message || "No messages yet"}</p>
                </div>
                {chat.unread_count > 0 ? <div className="w-5 h-5 rounded-full bg-[#095256] text-white flex items-center justify-center text-[10px] font-bold shrink-0">{chat.unread_count}</div> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 bg-white rounded-[12px] border border-[#E1E6EA] shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#E1E6EA] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#E6F4F5] flex items-center justify-center text-[#0E7C86] font-bold text-[12px]">
                {String(activeChat?.participant_name || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-[#10242A]">{activeChat?.participant_name || "Select conversation"}</h4>
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online</p>
              </div>
            </div>
          </div>
          <div className="flex-1 p-5 overflow-y-auto bg-[#F9FAFB] space-y-4">
            {error ? <p className="text-xs text-red-500 text-center py-4 bg-red-50 rounded-xl border border-red-100">{error}</p> : null}
            {loadingMessages ? <div className="flex justify-center py-10"><RefreshCw className="w-6 h-6 text-[#0E7C86] animate-spin" /></div> : null}
            {!loadingMessages && messages.map((msg) => {
              const role = String(msg.sender_role || "").toLowerCase();
              const isOwner = role === "property_owner";
              const isAdmin = role === "superadmin";
              const isSystem = String(msg.sender_login_id).toLowerCase() === 'system';
              
              // Define side: 
              // In monitor mode: Owner Left, User Right
              // In my mode: Admin Right, Others Left
              let isRightSide = false;
              if (viewMode === "all") {
                isRightSide = !isOwner; // Owner Left, Tenant Right
              } else {
                isRightSide = isAdmin; // Admin Right, User Left
              }

              const isImage = msg.message_type === 'image';
              const isFile = msg.message_type === 'file';
              const isBlocked = msg.is_blocked;
              const isWhiteText = viewMode === "all" || isRightSide;
              const isHighlighted = highlightedMessageId === msg._id;
              return (
                <div 
                  key={msg.key} 
                  id={`msg-${msg._id}`} 
                  className={cn(
                    "flex flex-col p-1.5 transition-all duration-700", 
                    isHighlighted ? "bg-amber-50/70 border border-amber-200 rounded-2xl shadow-md px-3 py-2 scale-[1.01]" : "",
                    isBlocked || isSystem ? "items-center w-full my-3" : (isRightSide ? "items-end" : "items-start")
                  )}
                >
                  {isSystem ? (
                    <div className="bg-amber-50/60 border border-amber-200/80 text-amber-800 rounded-2xl p-4 max-w-[85%] text-center shadow-xs flex flex-col items-center gap-2">
                      <div className="flex items-center gap-1.5 justify-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-wider">
                          <AlertTriangle size={10} /> System Warning
                        </span>
                      </div>
                      <p className="text-xs font-semibold leading-relaxed text-[#10242A] max-w-md">
                        {msg.text}
                      </p>
                      <span className="text-[10px] font-semibold text-amber-600 block mt-1">{formatClock(msg.createdAt)}</span>
                    </div>
                  ) : isBlocked ? (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 max-w-[85%] text-left shadow-xs">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-100 text-red-700 text-[9px] font-bold uppercase tracking-wider">
                          <AlertTriangle size={10} /> Blocked: {msg.violation_type ? msg.violation_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Policy Violation'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-red-900 mb-1">
                        {msg.sender_name || msg.sender_login_id} ({isOwner ? "Owner" : "User"}) tried to send:
                      </p>
                      <p className="text-xs italic bg-white/70 p-3 rounded-xl border border-red-100 font-mono break-all text-slate-800">
                        "{msg.text}"
                      </p>
                      <span className="text-[10px] font-semibold text-red-400 mt-2 block">{formatClock(msg.createdAt)}</span>
                    </div>
                  ) : (
                    <>
                      {viewMode === "all" && (
                        <span className={cn("text-[10px] font-semibold mb-1 px-1 uppercase tracking-wider", isOwner ? "text-blue-600" : "text-emerald-600")}>
                            {msg.sender_name || msg.sender_login_id} ({isOwner ? "Owner" : "User"})
                        </span>
                      )}
                      <div className={cn(
                        "max-w-[75%] p-3.5 rounded-[12px] shadow-xs", 
                        isRightSide 
                          ? (viewMode === "all" ? "bg-emerald-600 text-white rounded-tr-none" : "bg-[#095256] text-white rounded-tr-none")
                          : (viewMode === "all" ? "bg-blue-600 text-white rounded-tl-none" : "bg-white border border-[#E1E6EA] rounded-tl-none")
                      )}>
                        {isImage ? (
                          <div className="space-y-2">
                            <img src={msg.file_url} alt="uploaded" className="max-w-full rounded-[8px] border border-white/20 shadow-xs cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.file_url, '_blank')} />
                            <p className={cn("text-[11px] font-medium opacity-80", isWhiteText ? "text-white" : "text-[#4A5961]")}>{msg.text}</p>
                          </div>
                        ) : isFile ? (
                          <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className={cn("flex items-center gap-3 p-3 rounded-[8px] border transition-all", isWhiteText ? "bg-white/10 border-white/20 hover:bg-white/20" : "bg-[#F4F6F8] border-[#E1E6EA] hover:bg-slate-100")}>
                            <div className={cn("w-9 h-9 rounded-[6px] flex items-center justify-center shrink-0", isWhiteText ? "bg-white/20 text-white" : "bg-[#E6F4F5] text-[#0E7C86]")}>
                               <Paperclip size={18} />
                            </div>
                            <div className="min-w-0">
                               <p className={cn("text-[12px] font-semibold truncate", isWhiteText ? "text-white" : "text-[#10242A]")}>{msg.text.replace('Sent a file: ', '')}</p>
                               <p className={cn("text-[10px] font-medium opacity-70", isWhiteText ? "text-white" : "text-[#4A5961]")}>Click to download</p>
                            </div>
                          </a>
                        ) : (
                          <p className={cn("text-[13px] font-medium leading-relaxed", isWhiteText ? "text-white" : "text-[#10242A]")}>{msg.text}</p>
                        )}
                        <span className={cn("text-[10px] font-medium mt-1.5 block", isWhiteText ? "text-white/80 text-right" : "text-[#8C9BA5]")}>{formatClock(msg.createdAt)}</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          {viewMode === "my" ? (
            <div className="p-3.5 border-t border-[#E1E6EA] relative bg-white">
              {showEmojiPicker && (
                 <div className="absolute bottom-full left-4 z-50 mb-3 shadow-xl rounded-[12px] overflow-hidden border border-[#E1E6EA]">
                    <EmojiPicker onEmojiClick={onEmojiClick} width={320} height={400} />
                 </div>
              )}
              
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" />

              <div className={cn("flex items-center gap-3 bg-[#F4F6F8] border border-[#E1E6EA] rounded-[8px] px-3 py-1.5", isUploading && "opacity-50 pointer-events-none")}>
                <div className="flex items-center gap-1">
                  <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-[#4A5961] hover:bg-white rounded-[6px] transition-all cursor-pointer"><Paperclip size={16} /></button>
                  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={cn("p-1.5 rounded-[6px] transition-all cursor-pointer", showEmojiPicker ? "bg-white text-[#0E7C86] shadow-xs" : "text-[#4A5961] hover:bg-white")}><Smile size={16} /></button>
                </div>
                <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }} type="text" placeholder={isUploading ? "Uploading..." : "Type a message..."} className="flex-1 bg-transparent border-none py-1 text-[13px] text-[#10242A] placeholder:text-[#8C9BA5] outline-none" />
                <button onClick={sendMessage} className="w-8 h-8 rounded-[6px] bg-[#095256] text-white flex items-center justify-center hover:bg-[#073E42] transition-all cursor-pointer"><Send size={15} /></button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-[#E6F4F5]/50 border-t border-[#E1E6EA] text-center">
               <p className="text-[11px] font-semibold text-[#0E7C86] uppercase tracking-wider">Read-Only Monitor Mode</p>
               <p className="text-[11px] text-[#4A5961] mt-0.5">You are viewing a conversation between two other users.</p>
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-3 bg-white rounded-[12px] border border-[#E1E6EA] shadow-xs flex flex-col p-4 overflow-y-auto">
          <h3 className="text-[12px] font-semibold text-[#4A5961] mb-4 uppercase tracking-wider text-left border-b border-[#E1E6EA] pb-2.5">User & Owner Details</h3>
          
          <div className="space-y-4">
            {/* TENANT DETAILS */}
            <div className="bg-[#F9FAFB] p-3.5 rounded-[10px] border border-[#E1E6EA] space-y-2.5">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Tenant Details</span>
              <DetailRow label="Name" value={activeChat?.tenant_details?.name || activeChat?.participant_name?.split('↔')[0]?.trim() || "Tenant"} />
              <DetailRow label="Phone" value={activeChat?.tenant_details?.phone || activeChat?.participant_phone || "N/A"} />
              <DetailRow label="Email" value={activeChat?.tenant_details?.email || activeChat?.participant_email || "N/A"} />
            </div>

            {/* OWNER DETAILS */}
            <div className="bg-[#F9FAFB] p-3.5 rounded-[10px] border border-[#E1E6EA] space-y-2.5">
              <span className="text-[11px] font-semibold text-[#0E7C86] uppercase tracking-wider block">Owner Details</span>
              <DetailRow label="Owner Name" value={activeChat?.owner_details?.name || activeChat?.participant_name?.split('↔')[1]?.trim() || "Owner"} />
              <DetailRow label="Phone" value={activeChat?.owner_details?.phone || "N/A"} />
              <DetailRow label="Email" value={activeChat?.owner_details?.email || "N/A"} />
              <DetailRow label="Property" value={activeChat?.owner_details?.propertyTitle || activeChat?.participant_property || "Property Enquiry"} />
            </div>

            <div className="pt-2 border-t border-[#E1E6EA]">
               <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-[#4A5961]">Chat Status</span>
                  <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold", activeChat?.status === 'closed' ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100")}>
                    {activeChat?.status === 'closed' ? 'Closed' : 'Open / Active'}
                  </span>
               </div>
               {activeChat?.close_reason && (
                 <p className="text-[11px] font-medium text-rose-500 mt-1 text-right">{activeChat.close_reason}</p>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* CONVERSATIONS BY STATUS */}
      <div className="w-full">
        {(() => {
          const listToUse = (allChatsList && allChatsList.length > 0) ? allChatsList : inbox;
          const openCount = listToUse.filter(c => c.status !== 'closed').length;
          const closedCount = listToUse.filter(c => c.status === 'closed').length;
          const totalCount = listToUse.length;

          const openPct = totalCount > 0 ? ((openCount / totalCount) * 100).toFixed(1) : "0.0";
          const closedPct = totalCount > 0 ? ((closedCount / totalCount) * 100).toFixed(1) : "0.0";

          const dynamicStatusData = [
            { name: "Open", value: openCount, color: "#0E7C86", percent: `${openPct}%` },
            { name: "Closed", value: closedCount, color: "#10B981", percent: `${closedPct}%` }
          ];

          return (
            <StatsCard 
              title="Conversations by Status" 
              data={dynamicStatusData} 
            />
          );
        })()}
      </div>
    </div>
  );
}

function StatsCard({ title, data }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  return (
    <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col">
      <h3 className="text-[12px] font-semibold text-[#4A5961] mb-4 uppercase tracking-wider">{title}</h3>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 w-full">
        <div className="relative h-36 w-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
             <PieChart>
                <Pie data={data} innerRadius={48} outerRadius={68} paddingAngle={4} dataKey="value" stroke="none">
                   {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
             </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <p className="text-xl font-bold text-[#10242A]">{total}</p>
             <p className="text-[10px] font-semibold text-[#4A5961] uppercase">Total</p>
          </div>
        </div>
        <div className="flex-1 space-y-2 w-full max-w-xs">
           {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-[13px] font-medium bg-[#F9FAFB] px-3.5 py-2 rounded-[8px] border border-[#E1E6EA]">
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[#4A5961]">{item.name}</span>
                 </div>
                 <span className="text-[#10242A] font-semibold">{item.value} <span className="text-[#8C9BA5] font-normal text-[11px]">({item.percent})</span></span>
              </div>
           ))}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-[#4A5961]">{label}</span>
      <span className="text-[13px] font-semibold text-[#10242A] truncate">{value}</span>
    </div>
  );
}
