import React, { useMemo, useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, fetchOwnerTenants } from "../../utils/propertyowner";
import { apiFetch, getApiBase } from "../../utils/api";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";
import { Search, Send, User, MoreVertical, Loader2, MessageSquare, Wallet, Paperclip, FileText, AlertTriangle, X } from "lucide-react";

/**
 * Report a send that did not reach the server, and take the optimistic bubble
 * back out of the thread.
 *
 * Both were previously missing: a failed send was written to console.error
 * only — which terser strips from production builds — while its optimistic
 * bubble stayed on screen until the next 10s poll replaced `messages` with the
 * server's list and it silently vanished. To the owner that read as "my
 * message disappears a second after I send it", with nothing explaining why.
 *
 * The case that actually produced it: POST /api/chat/send answering 403
 * because the account was chat-blocked.
 */
/**
 * Whether two rendered threads are the same, so a background refetch that
 * returned identical data can be dropped instead of re-rendering.
 *
 * The 10s poll rebuilt the message array every tick regardless of whether
 * anything had changed, and the scroll-to-bottom effect keyed on `messages`
 * fired with it — so the conversation animated a jump to the bottom on a timer
 * while the owner was reading or typing.
 */
const sameThread = (a, b) => {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  return a.every((msg, i) => msg.id === b[i].id && msg.text === b[i].text && msg.isBlocked === b[i].isBlocked);
};

const reportSendFailure = (err, optimisticId, setMessages) => {
  setMessages((prev) => prev.filter((m) => m.id !== optimisticId));

  const status = err?.status;
  let text = err?.message || "Message could not be sent. Please try again.";

  if (status === 403) {
    text = err?.message || "Your account is currently restricted from chatting.";
  } else if (status === 429) {
    text = "You're sending messages too quickly. Please wait a moment.";
  } else if (status === 408 || err?.name === "TimeoutError") {
    text = "The message timed out. Check your connection and try again.";
  }

  toast.error(text, { duration: 6000 });
};

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
  const socketRef = React.useRef(null);
  const activeChatRef = React.useRef(null);
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Keep the open conversation readable from socket handlers without
  // re-subscribing on every switch.
  React.useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

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

  /**
   * Mirror of the backend's canonicalChatId (utils/chatIdentity.js).
   *
   * The inbox now returns one row per person, keyed on the canonical id, but
   * that person's messages still arrive carrying whichever id they were stored
   * under. Comparisons have to be made in one form or they miss.
   */
  const canonicalChatId = (rawId) => {
    const value = String(rawId || "").trim();
    if (!value) return "";
    if (/^roomhyweb\d{6}$/i.test(value)) return value.toLowerCase();
    if (value.includes("@")) return generateWebsiteUserIdFromEmail(value) || value;
    // Returned unchanged, matching the backend exactly — owner ids double as
    // Socket.IO room names and their case has to survive. Case-insensitive
    // matching is sameChatParty's job.
    return value;
  };

  const sameChatParty = (a, b) => {
    if (!a || !b) return false;
    const left = String(a).trim().toLowerCase();
    const right = String(b).trim().toLowerCase();
    return left === right || canonicalChatId(a).toLowerCase() === canonicalChatId(b).toLowerCase();
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
    const amount = 500; // Fixed ₹500 booking token amount for chat booking confirmation
    const propertyName = associatedBooking.property_name || "property";
    const tenantName = associatedBooking.name || activeChat.participant_name || "Tenant";
    const bookingId = associatedBooking._id;

    setIsSending(true);
    let paymentUrl = `https://roomhy.com/website/pay?bookingId=${bookingId}&amount=${amount}`;

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

      if (cfRes?.link_url && (cfRes.link_url.includes('cashfree.com') || cfRes.link_url.includes('cashfree'))) {
        paymentUrl = cfRes.link_url;
      }
    } catch (_) {}

    paymentUrl = paymentUrl.replace(/app\.roomhy\.com/g, 'roomhy.com');

    const paymentMessage = `Dear ${tenantName}, please complete the token payment of ₹${amount} to confirm your booking for "${propertyName}". 💳 You can pay securely via Cashfree here: ${paymentUrl}`;

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
      // Same silent-vanish problem as handleSend: the payment link bubble was
      // left on screen after a failed send and then quietly removed by the poll.
      reportSendFailure(err, optimisticMsg.id, setMessages);
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

  const fetchInbox = async (isInitial = false) => {
    try {
      if (isInitial && inbox.length === 0) setLoadingInbox(true);
      const [res, tenants] = await Promise.all([
        apiFetch(`/api/chat/inbox/${owner.loginId}`).catch(() => ({ conversations: [] })),
        fetchOwnerTenants(owner.loginId).catch(() => [])
      ]);

      let conversations = res?.conversations || [];

      // Filter out other owner-to-owner conversations.
      // Keep tenants, website users, admin/support, and unknown parties.
      const OWNER_LOGIN_PATTERN = /^ROOMHY\d{4,}$/i;
      conversations = conversations.filter(c => {
        const pid = String(c.participant_login_id || '').trim();
        if (OWNER_LOGIN_PATTERN.test(pid) && pid.toUpperCase() !== owner.loginId.toUpperCase()) return false;
        return true;
      });

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
      if (!activeChatRef.current && conversations.length > 0) {
        setActiveChat(conversations[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isInitial) setLoadingInbox(false);
    }
  };


  const fetchMessages = async (targetUserId) => {
    try {
      if (!targetUserId) return;
      // Encoded: a participant id can be an email, and an unencoded one broke
      // the query string for any address containing a '+'.
      const res = await apiFetch(`/api/chat/conversation?user1=${encodeURIComponent(owner.loginId)}&user2=${encodeURIComponent(targetUserId)}`);
      if (res && Array.isArray(res)) {
        const next = res.map(msg => {
          const isMine = sameChatParty(msg.sender_login_id, owner.loginId) || String(msg.sender_login_id || '').toUpperCase() === String(owner.loginId || '').toUpperCase();
          return {
            id: msg._id,
            sender: isMine ? "Me" : (msg.sender_name || "Tenant"),
            text: msg.message,
            message_type: msg.message_type || 'text',
            file_url: msg.file_url || null,
            time: new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            isMe: isMine,
            isSystem: msg.sender_login_id === 'system' || msg.sender_role === 'superadmin' || msg.message_type === 'system',
            isBlocked: msg.is_blocked || false,
            violationType: msg.violation_type || null
          };
        });

        setMessages(prev => (sameThread(prev, next) ? prev : next));
        // Mark these messages as read
        await apiFetch(`/api/chat/mark-read/${encodeURIComponent(owner.loginId)}?sender=${encodeURIComponent(targetUserId)}`, { method: "POST" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fast inbox poll — 3s interval for instant live updates without page refresh
  React.useEffect(() => {
    fetchInbox(true);
    const interval = setInterval(() => fetchInbox(false), 3000);
    return () => clearInterval(interval);
  }, [owner.loginId]);

  // Fast message poll — 3s interval for instant live chat updates
  React.useEffect(() => {
    if (activeChat) {
      setLoadingMessages(true);
      fetchMessages(activeChat.participant_login_id).finally(() => setLoadingMessages(false));

      fetchAssociatedBooking(activeChat.participant_login_id);

      const interval = setInterval(() => {
        fetchMessages(activeChat.participant_login_id);
      }, 3000);
      return () => clearInterval(interval);
    } else {
      setAssociatedBooking(null);
    }
  }, [activeChat]);

  // Live delivery. The polls above stay as a fallback for a dropped socket,
  // but without this the owner only saw new messages on the next 10-15s tick
  // (or a manual refresh).
  React.useEffect(() => {
    if (!owner?.loginId) return undefined;

    const socket = io(getApiBase(), {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10
    });
    socketRef.current = socket;

    const joinOwnRoom = () => {
      socket.emit("join_room", {
        login_id: owner.loginId,
        role: "property_owner",
        name: owner.name || owner.ownerName || owner.loginId
      });
    };

    socket.on("connect", joinOwnRoom);
    socket.on("reconnect", joinOwnRoom);

    socket.on("receive_message", (incoming) => {
      const open = activeChatRef.current;

      // Refresh the open thread so the new message renders with the same
      // shape/moderation flags the REST fetch produces.
      //
      // Compared canonically: the inbox row carries the canonical id while the
      // message carries whatever id the sender was stored under, so an exact
      // compare here silently failed and the open thread stayed stale until
      // the next 10s poll.
      if (open?.participant_login_id &&
          sameChatParty(incoming?.sender_login_id, open.participant_login_id)) {
        fetchMessages(open.participant_login_id);
      }

      // Always refresh the sidebar for previews and unread counts.
      fetchInbox();
    });

    socket.on("message_blocked", (data) => {
      if (data?.warning || data?.message || data?.blocked) {
        // `data.message` is the platform's warning copy, not anything the user
        // typed. Passing it to setBlockedMsgSnippet rendered it under a "Your
        // message" heading, so the dialog quoted its own warning back at the
        // owner as though they had written it. The offending text arrives as
        // `snippet`; when it is absent the quote block is simply not shown.
        setBlockedMsgSnippet(data?.snippet || "");
        setShowBypassWarning(true);
      }
      if (activeChatRef.current?.participant_login_id) {
        fetchMessages(activeChatRef.current.participant_login_id);
      }
    });

    socket.on("account_blocked", () => {
      // Panel blur & redirect handled by PropertyOwnerLayout,
      // but also trigger here as fallback in case that socket missed it
      import('../../utils/propertyowner').then(({ clearOwnerRuntimeSession }) => {
        clearOwnerRuntimeSession();
      }).catch(() => {});
      setTimeout(() => {
        window.location.href = '/propertyowner/ownerlogin';
      }, 4000);
    });

    return () => {
      socket.off("connect", joinOwnRoom);
      socket.off("reconnect", joinOwnRoom);
      socket.off("receive_message");
      socket.off("message_blocked");
      socket.off("account_blocked");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [owner?.loginId]);

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
    const rawText = String(text);
    const trimmed = rawText.trim();

    // 1. Any 10+ digit sequence (formatted, spaced, or clean)
    const cleanDigits = rawText.replace(/\D/g, '');
    if (cleanDigits.length >= 10) return true;

    // Spaced out digits e.g. "9 4 6 4 1 6 5 0 2 0" or "9464-165-020"
    if (/(\d[\s\-.,_*/]*){10,}/.test(rawText)) return true;

    // 2. Email address or URL links
    if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i.test(trimmed)) return true;
    if (/https?:\/\/|www\.[^\s]+|\.com|\.in|\.org|\.net/i.test(trimmed)) return true;

    // 3. Messaging / Social handles
    if (/\b(whatsapp|watsapp|watsp|wtsp|telegram|instagram|insta|facebook|fb|snapchat|twitter)\b/i.test(trimmed)) return true;

    // 4. Contact info sharing phrases
    const contactPhrases = [
      /\b(call|phone|phn|mobile|contact|number|num|no)\b.*\b(de|bhej|bhejo|dena|share|kar|kr|karo|kro|do|lo|le|batao|diye|liya)\b/i,
      /\b(de|bhej|bhejo|dena|share|kar|kr|karo|kro|do|batao)\b.*\b(call|phone|phn|mobile|contact|number|num|no)\b/i,
      /\b(my|mera|apna|call|contact|reach|connect)\s+(number|no|num|contact|mobile|phone)\b/i,
      /\b(call|contact)\s+(me|us|on|par|pe)\b/i,
      /\b(no\s+brokerage|save\s+commission|brokerage\s+bach|bypass\s+commission|without\s+commission)\b/i,
      /\b(pay|payment|rent|deposit|advance)\s+([a-zA-Z]*\s+){0,2}(offline|cash|direct|account)\b/i,
      /\b(in\s*hand|hand\s*to\s*hand|offline\s*cash|direct\s*cash|cash\s*only)\b/i,
      /\boffline\s+(cash|payment|deal|transfer|settlement)\b/i,
      /\b(gpay|google pay|phonepe|paytm|upi|ybl|g-pay|phone-pe|bank transfer|account transfer)\b/i
    ];

    if (contactPhrases.some(rx => rx.test(trimmed))) return true;

    return false;
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
      reportSendFailure(err, optimisticMsg.id, setMessages);
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

      {/* Policy check — message held before sending.
          Styled to the owner panel's own modal pattern (see follow-ups.jsx):
          bg-card / border-border / rounded-2xl shell, serif heading, muted
          body copy, slate primary button. Amber rather than red, matching the
          policy-warning system messages already rendered in the thread. */}
      {showBypassWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowBypassWarning(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition p-1 hover:bg-muted rounded-full"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-100">
                Policy check
              </span>
            </div>

            <h3 className="font-serif text-[22px] font-bold text-foreground mb-1">Message not sent</h3>
            <p className="text-[13px] text-muted-foreground mb-4">
              It looks like this message shares contact details or arranges payment outside Roomhy, which isn&apos;t allowed on the platform.
            </p>

            {/* Only shown when we actually have the text that was withheld.
                A warning arriving over the socket may not carry it. */}
            {blockedMsgSnippet ? (
              <div className="rounded-xl border border-border bg-muted/40 p-3 mb-4">
                <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Your message
                </span>
                <p className="text-xs font-mono text-foreground break-words line-clamp-4">
                  {blockedMsgSnippet}
                </p>
              </div>
            ) : null}

            <div className="border-t border-border/60 pt-4 mb-5 space-y-1.5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Keeping conversations and payments on Roomhy is what lets us protect both sides of a booking. Repeated attempts to move a deal off the platform lead to the account being suspended.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Rewrite the message without phone numbers, email addresses or offline payment terms and it will send normally.
              </p>
            </div>

            <button
              onClick={() => setShowBypassWarning(false)}
              className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
            >
              Got it
            </button>
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
