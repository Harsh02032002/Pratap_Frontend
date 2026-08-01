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
  Mic,
  Heart,
  Edit,
  MessageSquare,
  Trash2,
  Loader
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

const normalizeWebsiteUserId = (rawId) => {
  const id = String(rawId || "").trim().toLowerCase();
  const digits = id.replace(/\D/g, "").slice(-6);
  if (digits.length === 6) return `roomhyweb${digits}`;
  return "";
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
  if (!name) return "Hostel Owner";
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
  const [chatError, setChatError] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeChatRef = useRef(null);
  const fileInputRef = useRef(null);

  // Link CSS
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/propertyowner/assets/css/instagram-chat.css";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

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
    setChatError("");
    try {
      const data = await fetchJson(`/api/chat/inbox/${encodeURIComponent(websiteUserId)}`);
      const conversationRows = Array.isArray(data?.conversations) ? data.conversations : [];
      const getCleanName = (name) => {
        if (!name) return "Hostel Owner";
        const clean = String(name).trim();
        if (clean === "VERIFIED OWNER" || clean === "Verified Owner" || clean === "OWN001" || clean === "OWNER") {
          return "Hostel Owner";
        }
        return clean;
      };

      let normalized = conversationRows.map((row, idx) => ({
        id: row.participant_login_id || `chat-${idx}`,
        participant_login_id: row.participant_login_id,
        participant_name: getCleanName(row.participant_name || row.participant_login_id),
        last_message: row.last_message || "Start your chat",
        timestamp: row.last_message_at || new Date().toISOString(),
        unread: Number(row.unread_count || 0)
      }));

      // Ensure Roomhy Admin fallback is always available
      const hasAdmin = normalized.some(c => String(c.participant_login_id).toUpperCase() === SUPERADMIN_LOGIN_ID);
      if (!hasAdmin) {
        normalized.push({
          id: SUPERADMIN_LOGIN_ID,
          participant_login_id: SUPERADMIN_LOGIN_ID,
          participant_name: "Roomhy Admin",
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
            participant_name: getCleanName(queryName),
            last_message: "Start your chat",
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
      setChatError("Unable to load chat list.");
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
      setChatError("");
      try {
        const list = await fetchJson(
          `/api/chat/conversation?user1=${encodeURIComponent(websiteUserId)}&user2=${encodeURIComponent(activeChat.participant_login_id)}`
        );
        setMessages((Array.isArray(list) ? list : []).map(normalizeMessage));
        await fetchJson(`/api/chat/mark-read/${encodeURIComponent(websiteUserId)}`, { method: "POST" });
      } catch (error) {
        console.error("Error loading messages:", error);
        setChatError("Unable to load messages.");
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
      transports: ["websocket"],
      upgrade: false,
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
    socket.on("error", (err) => {
      toast.error(err.message || "An error occurred");
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
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const deleteConversation = async () => {
    if (!activeChat || !websiteUserId) return;
    if (!window.confirm("Are you sure you want to delete this entire conversation? This action cannot be undone.")) return;

    try {
      await fetchJson(
        `/api/chat/delete-conversation?user1=${encodeURIComponent(websiteUserId)}&user2=${encodeURIComponent(activeChat.participant_login_id)}`,
        { method: "DELETE" }
      );
      
      // Update local state
      setChats(prev => prev.filter(c => c.id !== activeChat.id));
      setActiveChat(null);
      setMessages([]);
      setMobileChatOpen(false);
      
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <WebsiteNavbar />

      <main className="w-full">
        <div className="instagram-chat-container">
          {/* Left Sidebar - Chat List */}
          <div className={`chat-sidebar ${activeChat && mobileChatOpen ? "sidebar-hidden" : ""}`}>
            <div className="chat-sidebar-header flex items-center justify-between">
              <h2>Messages</h2>
            </div>

            <div className="chat-search-container px-4">
              <input 
                type="text" 
                placeholder="Search" 
                className="chat-search-input w-full bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-teal-500/20 transition-all" 
              />
            </div>

            <div className="chat-list custom-scrollbar">
              {loadingChats ? (
                <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto"></div></div>
              ) : null}
              {chats.map((chat) => {
                const active = activeChat?.id === chat.id;
                return (
                  <div
                    key={chat.id}
                    onClick={() => { setActiveChat(chat); setMobileChatOpen(true); }}
                    className={`chat-item ${active ? "active" : ""}`}
                  >
                    <div className="chat-item-avatar">
                      <div className="chat-item-avatar-inner">
                        {(chat.participant_name || "A").charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="chat-item-info">
                      <div className="chat-item-name truncate font-bold">{chat.participant_name || "Roomhy Admin"}</div>
                      <div className="chat-item-last-msg truncate">{chat.last_message}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Canvas - Chat Active */}
          <div className={`chat-canvas ${activeChat && mobileChatOpen ? "canvas-active" : ""}`}>
            {!activeChat ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                <div className="w-24 h-24 border-2 border-gray-900 rounded-full flex items-center justify-center mb-6">
                  <Send className="w-12 h-12 text-gray-900 -rotate-45" />
                </div>
                <h2 className="text-xl font-medium text-gray-900 mb-2">Direct Messages</h2>
                <p className="text-sm text-gray-500 max-w-xs">Select a contact to start messaging.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full">
                {/* Chat Header */}
                <div className="chat-canvas-header">
                  <div className="chat-header-user">
                    <button className="md:hidden mr-3" onClick={() => setMobileChatOpen(false)}>
                      <ArrowLeft className="w-6 h-6 text-white" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold mr-3 text-base flex-shrink-0">
                      {(cleanDisplayName(activeChat.participant_name)).charAt(0).toUpperCase()}
                    </div>
                    <div className="chat-header-info">
                      <h3>{cleanDisplayName(activeChat.participant_name)}</h3>
                      <p>Online Support</p>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="chat-messages-container custom-scrollbar">
                  {loadingMessages ? (
                    <div className="text-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500 mx-auto"></div></div>
                  ) : null}
                  <div className="timestamp-separator">TODAY</div>
                  
                  {messages.map((msg) => {
                    const isSystem = String(msg.sender_login_id || "").toLowerCase() === 'system';
                    const isMine = String(msg.sender_login_id || "").trim().toLowerCase() === String(websiteUserId).toLowerCase();
                    const isImage = msg.message_type === 'image';
                    const isFile = msg.message_type === 'file';

                    return (
                      <div key={msg._id} className={`flex flex-col ${isSystem ? 'items-center w-full my-3' : isMine ? 'items-end' : 'items-start'}`}>
                        {isSystem ? (
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-3xl p-5 max-w-[85%] text-center shadow-sm flex flex-col items-center gap-2">
                            <div className="flex items-center gap-1.5 justify-center">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-wider">
                                <ShieldCheck size={10} /> System Warning
                              </span>
                            </div>
                            <p className="text-xs font-bold leading-relaxed text-slate-700 max-w-md">
                              {msg.message}
                            </p>
                            <span className="text-[9px] text-gray-400 mt-1 block">{formatTime(msg.created_at)}</span>
                          </div>
                        ) : (
                          <>
                            <div className={`message-bubble ${isMine ? "message-sent" : "message-received"}`}>
                              {isImage ? (
                                <img src={msg.file_url} alt="uploaded" className="max-w-full rounded-xl" onClick={() => window.open(msg.file_url, '_blank')} />
                              ) : isFile ? (
                                <div className="flex items-center gap-2">
                                   <FileText size={16} />
                                   <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="underline">{msg.message.replace('Sent a file: ', '')}</a>
                                </div>
                              ) : (
                                String(msg.message).split(/(https?:\/\/[^\s]+)/g).map((part, i) => 
                                  part.match(/(https?:\/\/[^\s]+)/g) 
                                    ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800 break-all">{part}</a>
                                    : part
                                )
                              )}
                            </div>
                            <span className="text-[9px] text-gray-400 mt-1 px-2">{formatTime(msg.created_at)}</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef}></div>
                </div>

                {/* Chat Input */}
                <div className="chat-input-container">
                  <div className="relative">
                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 z-50 mb-2">
                        <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} />
                      </div>
                    )}
                  </div>
                  
                  <div className="chat-input-wrapper">
                    <button className="chat-input-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><Smile className="w-6 h-6" /></button>
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
                      placeholder="Message..."
                      className="chat-input-field custom-scrollbar"
                    />
                    {messageText.trim() || isUploading ? (
                      <button onClick={sendMessage} className="chat-send-btn" disabled={isUploading}>
                        {isUploading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    ) : (
                      <div className="chat-input-actions">
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        <button className="chat-input-btn" onClick={() => fileInputRef.current?.click()} title="Upload file"><Paperclip className="w-6 h-6" /></button>
                      </div>
                    )}
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
