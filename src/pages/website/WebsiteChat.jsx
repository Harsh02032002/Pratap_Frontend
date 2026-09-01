import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import { 
  MessageCircle, 
  Send, 
  ArrowLeft, 
  ShieldCheck, 
  Paperclip, 
  Smile, 
  FileText, 
  Image as ImageIcon, 
  Phone,
  Video,
  Info,
  Search,
  MoreVertical,
  Trash2,
  Loader,
  CheckCheck,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { fetchJson, getApiBase } from "../../utils/api";
import EmojiPicker from 'emoji-picker-react';
import { toast } from "react-hot-toast";

const generateWebsiteUserIdFromEmail = (email) => {
  const safeEmail = String(email || "").trim().toLowerCase();
  if (!safeEmail) return "";
  let hash = 0;
  for (let i = 0; i < safeEmail.length; i += 1) {
    hash = (hash * 31 + safeEmail.charCodeAt(i)) % 1000000;
  }
  return `roomhyweb${String(hash).padStart(6, "0")}`;
};

const resolveWebsiteUserId = (user) => {
  if (!user) return "";
  if (user.loginId && String(user.loginId).trim()) {
    return String(user.loginId).trim();
  }
  if (user.email && String(user.email).trim()) {
    return generateWebsiteUserIdFromEmail(user.email) || String(user.email).trim();
  }
  if (user.id || user._id) {
    return String(user.id || user._id).trim();
  }
  return "";
};

const SUPERADMIN_LOGIN_ID = "SUPER_ADMIN";

const cleanDisplayName = (name) => {
  if (!name) return "Roomhy Support";
  const clean = String(name).trim();
  if (clean === "VERIFIED OWNER" || clean === "Verified Owner" || clean === "OWN001" || clean === "OWNER") {
    return "Hostel Owner";
  }
  return clean;
};

const normalizeMessage = (message) => ({
  ...message,
  _id: message?._id || `${message?.sender_login_id || "msg"}-${message?.created_at || Date.now()}`,
  message: String(message?.message || ""),
  created_at: message?.created_at || new Date().toISOString()
});

export default function WebsiteChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeChatRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/website/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const websiteUserId = useMemo(() => resolveWebsiteUserId(user), [user]);

  const loadChats = async () => {
    if (!websiteUserId) return;
    setLoadingChats(true);
    try {
      const data = await fetchJson(`/api/chat/inbox/${encodeURIComponent(websiteUserId)}`);
      const conversationRows = Array.isArray(data?.conversations) ? data.conversations : [];

      let normalized = conversationRows.map((row, idx) => ({
        id: row.participant_login_id || `chat-${idx}`,
        participant_login_id: row.participant_login_id,
        participant_name: cleanDisplayName(row.participant_name || row.participant_login_id),
        last_message: row.last_message || "Start your conversation",
        timestamp: row.last_message_at || new Date().toISOString(),
        unread: Number(row.unread_count || 0)
      }));

      // Ensure Roomhy Admin fallback is always available
      const hasAdmin = normalized.some(c => String(c.participant_login_id).toUpperCase() === SUPERADMIN_LOGIN_ID);
      if (!hasAdmin) {
        normalized.push({
          id: SUPERADMIN_LOGIN_ID,
          participant_login_id: SUPERADMIN_LOGIN_ID,
          participant_name: "Roomhy Admin Support",
          last_message: "Need help with booking? Chat with admin.",
          timestamp: new Date().toISOString(),
          unread: 0
        });
      }

      // Check URL query parameters or location state for targeted chat initiation
      const queryTarget = searchParams.get('target') || searchParams.get('ownerId') || searchParams.get('to') || location.state?.targetId;
      const queryName = searchParams.get('name') || searchParams.get('ownerName') || location.state?.targetName || "Hostel Owner";

      if (queryTarget && String(queryTarget).trim()) {
        const cleanTarget = String(queryTarget).trim();
        let targetChat = normalized.find(c => String(c.participant_login_id).toUpperCase() === cleanTarget.toUpperCase());
        if (!targetChat) {
          targetChat = {
            id: cleanTarget,
            participant_login_id: cleanTarget,
            participant_name: cleanDisplayName(queryName),
            last_message: "Start your conversation",
            timestamp: new Date().toISOString(),
            unread: 0
          };
          normalized.unshift(targetChat);
        }
        setChats(normalized);
        setActiveChat(targetChat);
        setMobileChatOpen(true);
      } else {
        setChats(normalized);
        if (!activeChatRef.current && normalized.length > 0) {
          setActiveChat(normalized[0]);
        }
      }
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    if (websiteUserId) loadChats();
  }, [websiteUserId]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!activeChat || !websiteUserId) return;
      setLoadingMessages(true);
      try {
        const list = await fetchJson(
          `/api/chat/conversation?user1=${encodeURIComponent(websiteUserId)}&user2=${encodeURIComponent(activeChat.participant_login_id)}`
        );
        setMessages((Array.isArray(list) ? list : []).map(normalizeMessage));
        
        // Mark conversation as read
        await fetchJson(`/api/chat/mark-read/${encodeURIComponent(websiteUserId)}`, { method: "POST" });
        
        // Reset unread count locally for active chat
        setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, unread: 0 } : c));
      } catch (error) {
        console.error("Error loading messages:", error);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    if (activeChat) loadMessages();
  }, [activeChat, websiteUserId]);

  useEffect(() => {
    if (!websiteUserId || !user) return undefined;

    const socket = io(getApiBase(), {
      transports: ["websocket", "polling"],
      reconnection: true
    });
    socketRef.current = socket;

    const joinSelfRoom = () => {
      socket.emit("join_room", {
        login_id: websiteUserId,
        role: "website_user",
        name: user?.name || user?.email || "Website User"
      });
    };

    const refreshCurrentConversation = async () => {
      const current = activeChatRef.current;
      if (!current) return;
      try {
        const list = await fetchJson(
          `/api/chat/conversation?user1=${encodeURIComponent(websiteUserId)}&user2=${encodeURIComponent(current.participant_login_id)}`
        );
        setMessages((Array.isArray(list) ? list : []).map(normalizeMessage));
      } catch (_) {}
    };

    socket.on("connect", joinSelfRoom);
    socket.on("reconnect", joinSelfRoom);
    socket.on("receive_message", async (incoming) => {
      const roomId = String(incoming?.room_id || "").trim().toLowerCase();
      if (roomId === websiteUserId.toLowerCase()) {
        await refreshCurrentConversation();
        loadChats();
      }
    });

    socket.on("message_blocked", (data) => {
      toast.error(data.message || "Sharing personal contact details outside the platform is not allowed.", {
        icon: '⚠️',
        duration: 5000,
        style: {
          border: '1px solid #fee2e2',
          padding: '16px',
          color: '#b91c1c',
          background: '#fef2f2',
          fontWeight: 'bold',
          fontSize: '13px'
        }
      });
      refreshCurrentConversation();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [websiteUserId, user]);

  const sendMessage = () => {
    if (!messageText.trim() || !activeChat || !websiteUserId || !socketRef.current) return;
    const trimmed = messageText.trim();

    socketRef.current.emit("send_message", {
      to_login_id: activeChat.participant_login_id,
      message: trimmed
    });

    const optimisticMessage = normalizeMessage({
      _id: `temp-${Date.now()}`,
      sender_login_id: websiteUserId,
      sender_name: user?.name || "You",
      message: trimmed,
      created_at: new Date().toISOString()
    });

    setMessages((prev) => [...prev, optimisticMessage]);

    // Update last message in chat list
    setChats(prev => prev.map(c => c.id === activeChat.id ? { 
      ...c, 
      last_message: trimmed, 
      timestamp: new Date().toISOString() 
    } : c));

    setMessageText("");
    setShowEmojiPicker(false);
  };

  const onEmojiClick = (emojiData) => {
    setMessageText(prev => prev + emojiData.emoji);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeChat || !websiteUserId) return;

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
          sender_login_id: websiteUserId,
          sender_name: user?.name || "You",
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

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const totalUnreadCount = useMemo(() => {
    return chats.reduce((acc, c) => acc + (c.unread || 0), 0);
  }, [chats]);

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    return chats.filter(c => 
      c.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.last_message.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chats, searchQuery]);

  return (
    <div className="h-screen bg-[#F0F2F5] flex flex-col font-sans overflow-hidden">
      <WebsiteNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 lg:p-6 overflow-hidden">
        {/* --- MAIN CHAT CONTAINER BOX --- */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/90 shadow-xl h-full flex overflow-hidden">
          
          {/* ============================================================
           * LEFT SIDEBAR: CONVERSATION LIST & UNREAD BADGES
           * ============================================================ */}
          <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/50 ${mobileChatOpen ? "hidden md:flex" : "flex"}`}>
            
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Messages</h2>
                {totalUnreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-500 text-white text-xs font-black shadow-2xs">
                    {totalUnreadCount} New
                  </span>
                )}
              </div>
              <button 
                onClick={loadChats} 
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                title="Refresh messages"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-slate-200 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..." 
                  className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all" 
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loadingChats ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <span className="text-xs font-bold text-slate-400">Loading chats...</span>
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold">No conversations found</p>
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const isActive = activeChat?.id === chat.id;
                  const unreadCount = Number(chat.unread || 0);

                  return (
                    <div
                      key={chat.id}
                      onClick={() => { 
                        setActiveChat(chat); 
                        setMobileChatOpen(true); 
                        setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
                      }}
                      className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all duration-200 ${
                        isActive 
                          ? "bg-teal-50/70 border-l-4 border-teal-600 font-bold" 
                          : "hover:bg-slate-100/70 bg-white"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-black flex items-center justify-center text-base shadow-xs">
                          {(chat.participant_name || "R").charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                      </div>

                      {/* Info & Last Message */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="text-xs md:text-sm font-extrabold text-slate-900 truncate">
                            {chat.participant_name}
                          </h4>
                        </div>
                        <p className={`text-xs truncate ${unreadCount > 0 ? "font-black text-slate-900" : "font-medium text-slate-500"}`}>
                          {chat.last_message}
                        </p>
                      </div>

                      {/* Time & Unread Counter Badge (WhatsApp Style) */}
                      <div className="flex flex-col items-end shrink-0 gap-1">
                        <span className="text-[10px] text-slate-400 font-bold">
                          {formatTime(chat.timestamp)}
                        </span>

                        {unreadCount > 0 && (
                          <span className="min-w-5 h-5 px-1.5 rounded-full bg-teal-600 text-white text-[11px] font-black flex items-center justify-center shadow-2xs animate-bounce">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* ============================================================
           * RIGHT CANVAS: ACTIVE CHAT MESSAGES & INPUT
           * ============================================================ */}
          <div className={`flex-1 flex flex-col bg-[#F0F2F5] ${!mobileChatOpen ? "hidden md:flex" : "flex"}`}>
            
            {!activeChat ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                <div className="w-20 h-20 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 shadow-sm">
                  <Send className="w-10 h-10 -rotate-45" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-1">Direct Messages</h3>
                <p className="text-xs text-slate-500 font-medium max-w-xs">
                  Select a conversation from the sidebar to view messages or start chatting.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                
                {/* Active Chat Header */}
                <div className="p-3.5 px-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <button className="md:hidden p-1 rounded-lg text-slate-600 hover:bg-slate-100" onClick={() => setMobileChatOpen(false)}>
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
                      {(activeChat.participant_name).charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                        {activeChat.participant_name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Online Support</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages Wallpaper Container */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#E5DDD5]/30 custom-scrollbar" 
                     style={{ backgroundImage: `radial-gradient(#CBD5E1 1px, transparent 1px)`, backgroundSize: '20px 20px' }}>
                  
                  {loadingMessages ? (
                    <div className="text-center py-10">
                      <div className="w-6 h-6 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <span className="text-xs font-bold text-slate-400">Loading messages...</span>
                    </div>
                  ) : null}

                  {/* Date Badge */}
                  <div className="text-center my-3">
                    <span className="px-3 py-1 rounded-full bg-white/90 border border-slate-200/80 text-slate-600 text-[10px] font-extrabold uppercase tracking-wider shadow-2xs">
                      TODAY
                    </span>
                  </div>

                  {/* Message Bubbles */}
                  {messages.map((msg) => {
                    const isSystem = String(msg.sender_login_id || "").toLowerCase() === 'system';
                    const isMine = String(msg.sender_login_id || "").trim().toLowerCase() === String(websiteUserId).toLowerCase();
                    const isImage = msg.message_type === 'image';
                    const isFile = msg.message_type === 'file';

                    return (
                      <div key={msg._id} className={`flex flex-col ${isSystem ? 'items-center w-full my-3' : isMine ? 'items-end' : 'items-start'}`}>
                        {isSystem ? (
                          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 max-w-[85%] text-center shadow-2xs flex flex-col items-center gap-2">
                            <div className="flex items-center gap-1.5 justify-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-wider">
                                <ShieldCheck size={11} /> System Notice
                              </span>
                            </div>
                            <p className="text-xs font-bold leading-relaxed text-slate-800 max-w-md">
                              {msg.message}
                            </p>
                            <span className="text-[9px] text-slate-400 font-bold">{formatTime(msg.created_at)}</span>
                          </div>
                        ) : (
                          <div className={`max-w-[80%] md:max-w-[70%] group`}>
                            <div className={`p-3 md:p-3.5 rounded-2xl text-xs md:text-sm font-medium leading-relaxed shadow-2xs ${
                              isMine 
                                ? "bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-tr-xs" 
                                : "bg-white text-slate-900 border border-slate-200/80 rounded-tl-xs"
                            }`}>
                              {isImage ? (
                                <img 
                                  src={msg.file_url} 
                                  alt="uploaded" 
                                  className="max-w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity" 
                                  onClick={() => window.open(msg.file_url, '_blank')} 
                                />
                              ) : isFile ? (
                                <div className="flex items-center gap-2">
                                  <FileText className="w-5 h-5 shrink-0" />
                                  <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="underline font-bold hover:opacity-80">
                                    {msg.message.replace('Sent a file: ', '')}
                                  </a>
                                </div>
                              ) : (
                                String(msg.message).split(/(https?:\/\/[^\s]+)/g).map((part, i) => 
                                  part.match(/(https?:\/\/[^\s]+)/g) 
                                    ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline font-extrabold hover:opacity-80 break-all">{part}</a>
                                    : part
                                )
                              )}

                              {/* Time Inside Bubble */}
                              <div className={`text-[9px] font-bold mt-1 text-right ${isMine ? "text-teal-100 opacity-90" : "text-slate-400"}`}>
                                {formatTime(msg.created_at)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef}></div>
                </div>

                {/* Chat Input Bar */}
                <div className="p-3 bg-white border-t border-slate-200 relative shrink-0">
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-3 z-50 mb-2 shadow-2xl rounded-2xl overflow-hidden">
                      <EmojiPicker onEmojiClick={onEmojiClick} width={320} height={380} />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 bg-slate-100 rounded-2xl p-1.5 border border-slate-200 focus-within:border-teal-500 focus-within:bg-white transition-all">
                    <button 
                      type="button" 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="w-9 h-9 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-slate-200/60 flex items-center justify-center shrink-0 transition-colors"
                      title="Add Emoji"
                    >
                      <Smile className="w-5 h-5" />
                    </button>

                    <textarea
                      rows="1"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent text-xs md:text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none resize-none max-h-24 py-2 px-1"
                    />

                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()} 
                      className="w-9 h-9 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-slate-200/60 flex items-center justify-center shrink-0 transition-colors"
                      title="Attach File"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>

                    <button 
                      onClick={sendMessage} 
                      disabled={!messageText.trim() && !isUploading}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        messageText.trim() || isUploading
                          ? "bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {isUploading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>
      </main>
    </div>
  );
}
