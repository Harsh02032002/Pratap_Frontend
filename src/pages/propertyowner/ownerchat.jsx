import React, { useMemo, useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, fetchOwnerTenants } from "../../utils/propertyowner";
import { apiFetch } from "../../utils/api";
import { Search, Send, User, MoreVertical, Loader2, MessageSquare, Wallet, Paperclip, FileText, AlertTriangle } from "lucide-react";

export default function OwnerChat() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") { window.location.href = "/propertyowner/ownerlogin"; return null; }

  const [activeChat, setActiveChat] = useState(null);
  const [inbox, setInbox] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingInbox, setLoadingInbox] = useState(true);
  
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [associatedBooking, setAssociatedBooking] = useState(null);
  
  const messagesEndRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Debounce search — used for client-side filtering only, not for polling
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const generateWebsiteUserIdFromEmail = (email) => {
    const safeEmail = String(email || '').trim().toLowerCase();
    if (!safeEmail) return '';
    let hash = 0;
    for (let i = 0; i < safeEmail.length; i += 1) {
      hash = (hash * 31 + safeEmail.charCodeAt(i)) % 1000000;
    }
    return `roomhyweb${String(hash).padStart(6, '0')}`;
  };

  const fetchAssociatedBooking = async (targetUserId) => {
    if (!targetUserId) {
      setAssociatedBooking(null);
      return;
    }
    try {
      const res = await apiFetch(`/api/booking?owner_id=${owner.loginId}`);
      if (res && res.success && Array.isArray(res.data)) {
        const targetClean = targetUserId.toLowerCase();
        const sortedBookings = [...res.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const match = sortedBookings.find(b => {
          const isEmailMatch = String(b.email || '').toLowerCase() === targetClean;
          const isUserIdMatch = String(b.user_id || '').toLowerCase() === targetClean;
          const genUserId = generateWebsiteUserIdFromEmail(b.email);
          const isGenMatch = genUserId && String(genUserId).toLowerCase() === targetClean;
          return isEmailMatch || isUserIdMatch || isGenMatch;
        });

        if (match) {
          try {
            const propRes = await apiFetch(`/api/properties/${match.property_id}`);
            if (propRes && propRes.success && propRes.property) {
              match.securityDepositAmount = parseFloat(propRes.property.pricing?.securityDeposit || "0") || 0;
            }
          } catch (propErr) {
            console.error("Failed to fetch property details for security deposit", propErr);
          }
        }
        setAssociatedBooking(match || null);
      } else {
        setAssociatedBooking(null);
      }
    } catch (err) {
      console.error("Failed to fetch associated booking", err);
      setAssociatedBooking(null);
    }
  };

  const handleSendPaymentLink = async () => {
    if (!associatedBooking || !activeChat) return;
    const rentAmount = associatedBooking.rent_amount || associatedBooking.bid_amount || 0;
    const depositAmount = associatedBooking.securityDepositAmount || 0;
    const amount = rentAmount + depositAmount;
    const propertyName = associatedBooking.property_name || "property";
    const tenantName = associatedBooking.name || activeChat.participant_name || "Tenant";
    const bookingId = associatedBooking._id;

    setIsSending(true);
    let paymentUrl = `${window.location.origin}/website/pay?bookingId=${bookingId}&amount=${amount}`;

    try {
      // Create Cashfree payment order & link
      const cfRes = await apiFetch("/api/payments/cashfree/create-link", {
        method: "POST",
        body: JSON.stringify({
          bookingId,
          amount,
          customerInfo: {
            name: tenantName,
            email: associatedBooking.email || "",
            phone: associatedBooking.phone || ""
          }
        })
      }).catch(() => null);

      if (cfRes?.link_url) {
        paymentUrl = cfRes.link_url;
      }
    } catch (_) {}

    let paymentMessage = "";
    if (depositAmount > 0) {
      paymentMessage = `Dear ${tenantName}, please complete the onboarding payment of ₹${amount} (includes First Month Rent ₹${rentAmount} + Security Deposit ₹${depositAmount}) to secure your booking for "${propertyName}". 💳 You can pay securely via Cashfree here: ${paymentUrl}`;
    } else {
      paymentMessage = `Dear ${tenantName}, please complete the payment of ₹${amount} to secure your booking for "${propertyName}". 💳 You can pay securely via Cashfree here: ${paymentUrl}`;
    }

    const optimisticMsg = {
      id: Date.now(),
      sender: "Me",
      text: paymentMessage,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      isMe: true
    };
    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom();

    try {
      await apiFetch("/api/chat/send", {
        method: "POST",
        body: JSON.stringify({
          from_login_id: owner.loginId,
          to_login_id: activeChat.participant_login_id,
          message: paymentMessage
        })
      });
      fetchMessages(activeChat.participant_login_id);
    } catch (err) {
      console.error("Failed to send payment link", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeChat) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { getApiBase } = await import("../../utils/api");
      const res = await fetch(`${getApiBase()}/api/upload-file`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      
      if (data.url) {
        const isImg = file.type.startsWith('image/');
        const fileMsg = {
          from_login_id: owner.loginId,
          to_login_id: activeChat.participant_login_id,
          message: `Sent a ${isImg ? 'photo' : 'file'}: ${file.name}`,
          message_type: isImg ? 'image' : 'file',
          file_url: data.url
        };
        
        await apiFetch("/api/chat/send", {
          method: "POST",
          body: JSON.stringify(fileMsg)
        });

        fetchMessages(activeChat.participant_login_id);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("File upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const fetchInbox = async () => {
    try {
      const [res, tenants] = await Promise.all([
        apiFetch(`/api/chat/inbox/${owner.loginId}`).catch(() => ({ conversations: [] })),
        fetchOwnerTenants(owner.loginId).catch(() => [])
      ]);

      let conversations = res?.conversations || [];

      if (tenants && Array.isArray(tenants)) {
        const existingLoginIds = new Set(conversations.map(c => c.participant_login_id));
        const newConversations = tenants
          .filter(t => {
            const tLoginId = t.loginId || t.tenantLoginId || t.email;
            return tLoginId && !existingLoginIds.has(tLoginId);
          })
          .map(t => ({
            participant_login_id: t.loginId || t.tenantLoginId || t.email,
            participant_name: t.name || t.fullName || "Tenant",
            unread_count: 0,
            last_message: "Start a conversation"
          }));
        conversations = [...conversations, ...newConversations];
      }

      setInbox(conversations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInbox(false);
    }
  };

  const fetchMessages = async (targetUserId) => {
    try {
      if (!targetUserId) return;
      const res = await apiFetch(`/api/chat/conversation?user1=${owner.loginId}&user2=${targetUserId}`);
      if (res && Array.isArray(res)) {
        setMessages(res.map(msg => ({
          id: msg._id,
          sender: msg.sender_login_id === owner.loginId ? "Me" : msg.sender_name,
          text: msg.message,
          message_type: msg.message_type || 'text',
          file_url: msg.file_url || null,
          time: new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          isMe: msg.sender_login_id === owner.loginId,
          isSystem: msg.sender_login_id === 'system' || msg.sender_role === 'superadmin' || msg.message_type === 'system',
          isBlocked: msg.is_blocked || false,
          violationType: msg.violation_type || null
        })));
        scrollToBottom();
        // Mark these messages as read
        await apiFetch(`/api/chat/mark-read/${owner.loginId}?sender=${targetUserId}`, { method: "POST" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Stable inbox poll — 15 s interval, never restarts on search typing
  React.useEffect(() => {
    fetchInbox();
    const interval = setInterval(fetchInbox, 15000);
    return () => clearInterval(interval);
  }, [owner.loginId]);

  // Stable message poll — 10 s interval, restarts only when active chat changes
  React.useEffect(() => {
    if (activeChat) {
      setLoadingMessages(true);
      fetchMessages(activeChat.participant_login_id).finally(() => setLoadingMessages(false));

      fetchAssociatedBooking(activeChat.participant_login_id);

      const interval = setInterval(() => {
        fetchMessages(activeChat.participant_login_id);
      }, 10000);
      return () => clearInterval(interval);
    } else {
      setAssociatedBooking(null);
    }
  }, [activeChat]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const [showBypassWarning, setShowBypassWarning] = useState(false);
  const [blockedMsgSnippet, setBlockedMsgSnippet] = useState("");

  const checkBypassAttempt = (text) => {
    if (!text) return false;
    const cleanDigits = String(text).replace(/[\s\-().,_/*]/g, '');
    const hasTenDigits = /\d{10}/.test(cleanDigits);
    const spacedDigits = /(\d[\s\-.,_*/]*){10,12}/g.test(text);
    const bypassKeywords = [
      /\b(whatsapp|watsapp|watsp|wtsp|wa|wp)\b/i,
      /\b(call|phone|phn|mobile|contact|number|no|num)\s+([a-zA-Z]*\s+){0,2}(de|bhej|share|kar|kr|karo|kro|lena|le)\b/i,
      /\b(offline|cash|direct|bypass|commission|brokerage)\b/i,
      /\b(pay|payment|rent|deposit|advance)\s+([a-zA-Z]*\s+){0,2}(offline|cash|direct|account)\b/i,
      /\b(booking\s+cancel|cancel\s+booking)\b/i
    ];
    return hasTenDigits || spacedDigits || bypassKeywords.some(rx => rx.test(text));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !activeChat) return;

    if (checkBypassAttempt(message)) {
      setBlockedMsgSnippet(message);
      setShowBypassWarning(true);
      setMessage("");
      return;
    }

    setIsSending(true);
    
    // Optimistic UI update
    const optimisticMsg = {
      id: Date.now(),
      sender: "Me",
      text: message,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      isMe: true
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setMessage("");
    scrollToBottom();

    try {
      await apiFetch("/api/chat/send", {
        method: "POST",
        body: JSON.stringify({
          from_login_id: owner.loginId,
          to_login_id: activeChat.participant_login_id,
          message: optimisticMsg.text
        })
      });
      fetchMessages(activeChat.participant_login_id);
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsSending(false);
    }
  };

  const filteredInbox = useMemo(
    () => debouncedSearch
      ? inbox.filter(c => (c.participant_name || "").toLowerCase().includes(debouncedSearch.toLowerCase()))
      : inbox,
    [inbox, debouncedSearch]
  );

  return (
    <PropertyOwnerLayout owner={owner} title="Messages" onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}>
      <div className="mb-6">
        <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Messages</h1>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">Chat with tenants and staff.</p>
      </div>

      {/* Commission Bypass Violation Danger Modal */}
      {showBypassWarning && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border-2 border-rose-500 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="size-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={28} className="stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  CRITICAL VIOLATION DETECTED
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">Commission Bypass Attempt Logged!</h3>
              </div>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 space-y-2">
              <p className="text-xs text-rose-900 dark:text-rose-200 font-semibold leading-relaxed">
                You attempted to send a message containing direct contact info or offline deal instructions:
              </p>
              <p className="text-xs font-mono bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-rose-200 text-rose-700 dark:text-rose-300 italic">
                "{blockedMsgSnippet}"
              </p>
            </div>

            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 text-xs text-slate-700 dark:text-slate-300 font-medium space-y-1.5">
              <p className="font-bold text-rose-600">⚠️ WARNING: IMMEDIATE PERMANENT BLOCK RISK</p>
              <p>
                Attempting to bypass Roomhy platform commission or dealing offline with tenants will result in <strong className="text-rose-600 underline">IMMEDIATE PERMANENT ACCOUNT BLOCK & SYSTEM-WIDE BLACKLISTING</strong>.
              </p>
              <p className="text-[11px] text-muted-foreground font-semibold">
                Once your account is blocked, <span className="underline font-bold text-foreground">it CANNOT be reactivated by anyone (including Roomhy Admins) under any circumstances</span>.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowBypassWarning(false)}
                className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                I Understand & Agree to Comply with Platform Terms
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex h-[70vh] rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        {/* Sidebar / Contact List */}
        <div className="w-1/3 border-r border-border bg-muted/10 flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chats..." 
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingInbox ? (
               <div className="p-8 text-center text-slate-500 flex flex-col items-center"><Loader2 size={24} className="animate-spin mb-2" />Loading...</div>
            ) : filteredInbox.length === 0 ? (
               <div className="p-8 text-center text-slate-500 text-sm">No conversations found.</div>
            ) : filteredInbox.map((chat, idx) => (
              <button
                key={chat.participant_login_id || idx}
                onClick={() => setActiveChat(chat)}
                className={`w-full text-left p-4 border-b border-border transition-colors hover:bg-muted/40 ${activeChat?.participant_login_id === chat.participant_login_id ? "bg-white border-l-4 border-l-blue-600" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                    <User size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                       <h4 className="text-sm font-bold text-slate-800 truncate pr-2">{chat.participant_name}</h4>
                       {chat.unread_count > 0 && <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{chat.unread_count}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{chat.last_message || "Started a conversation"}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-50/50">
          {!activeChat ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
               <MessageSquare size={48} className="mb-4 opacity-50" />
               <p>Select a conversation to start messaging</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-border bg-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{activeChat.participant_name}</h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500">Online</span>
                  </div>
                </div>
                <div className="flex gap-3 text-slate-400">
                  <MoreVertical className="cursor-pointer hover:text-blue-600 transition" size={20} />
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingMessages && messages.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">Loading messages...</div>
                ) : messages.map((msg, i) => (
                  msg.isSystem ? (
                    <div key={msg.id || i} className="w-full flex justify-center my-3">
                      <div className="bg-amber-50 border-2 border-amber-400 text-amber-950 rounded-2xl p-4 max-w-lg shadow-md flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1 text-xs font-semibold leading-relaxed">
                          <p className="font-bold text-amber-950 uppercase tracking-wider text-[11px] mb-1 flex items-center gap-1">
                            <span>⚠️ ROOMHY POLICY WARNING</span>
                          </p>
                          <p>{msg.text}</p>
                          <span className="text-[9px] font-bold text-amber-700 mt-2 block text-right">{msg.time}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={msg.id || i} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${msg.isMe ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm"}`}>
                        {msg.isBlocked ? (
                          <span className="text-[12px] italic font-semibold text-rose-500 block">
                            ⚠️ Message blocked by Roomhy Safety Policy (contact/payment info detected)
                          </span>
                        ) : (
                          <div>
                            {msg.message_type === 'image' ? (
                              <img src={msg.file_url} alt="uploaded" className="max-w-full rounded-xl cursor-pointer" onClick={() => window.open(msg.file_url, '_blank')} />
                            ) : msg.message_type === 'file' ? (
                              <div className="flex items-center gap-2">
                                <FileText size={16} />
                                <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className={`underline ${msg.isMe ? 'text-blue-100' : 'text-blue-600'}`}>{msg.text.replace('Sent a file: ', '')}</a>
                              </div>
                            ) : (
                              <p className="text-[13px]">{msg.text}</p>
                            )}
                          </div>
                        )}
                        <span className={`text-[10px] block mt-1.5 text-right ${msg.isMe ? "text-blue-200" : "text-slate-400"}`}>{msg.time}</span>
                      </div>
                    </div>
                  )
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-border">
                <form onSubmit={handleSend} className="flex gap-3 items-center">
                  <button
                    type="button"
                    onClick={handleSendPaymentLink}
                    disabled={!associatedBooking || isSending}
                    title={associatedBooking ? "Send Payment Link" : "No active booking request found"}
                    className={`size-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                      associatedBooking 
                        ? "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20" 
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <Wallet size={20} />
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    title="Upload file"
                    className="size-12 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all text-slate-500 shrink-0"
                  >
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip size={20} />}
                  </button>
                  <input 
                    type="text" 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..." 
                    disabled={isSending}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <button type="submit" disabled={isSending} className="bg-blue-600 hover:bg-blue-700 text-white size-12 rounded-xl flex items-center justify-center transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 shrink-0">
                    <Send size={20} className="ml-1" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </PropertyOwnerLayout>
  );
}
