import React, { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Shield,
  Loader2,
  Trash2,
  ChevronDown,
  Minimize2,
  Maximize2,
  CornerDownLeft,
} from "lucide-react";
import { useMode } from "../context/ModeContext";
import { apiClient } from "../api/client";

export default function ChatWidget() {
  const { mode, isStandardMode } = useMode();
  const location = useLocation();
  const params = useParams();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "bot",
      text: "Hello Officer. I am your TraceX Cyber Intelligence Assistant. Ask me questions regarding the active case investigation or cross-case fraud analytics across the state network.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Extract caseId from URL if user is viewing a case (e.g. /cases/:caseId/graph or /cases/:caseId/reports)
  const caseMatch = location.pathname.match(/\/cases\/(\d+)/);
  const activeCaseId = caseMatch ? parseInt(caseMatch[1], 10) : null;

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const payload = {
        message: query,
        case_id: activeCaseId,
      };

      const res = await apiClient.post("chat", payload);
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: res.response || "No response received from intelligence engine.",
        suggested: res.suggested_actions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: `err-${Date.now()}`,
        sender: "bot",
        text: "Error retrieving intelligence response. Please check network connection.",
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "cleared",
        sender: "bot",
        text: "Chat history cleared. How can I assist your investigation today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const quickPrompts = activeCaseId
    ? [
        "Summarize this case",
        "What are the high-risk entities?",
        "Who is the suspect mule?",
        "Are there cross-case links?",
        "Recommended legal freeze action",
      ]
    : [
        "How many high-risk cases are open?",
        "List active investigations",
        "What are the top scam trends?",
      ];

  return (
    <div className="fixed bottom-5 right-5 z-[999] font-sans">
      {/* ── Expandable Chat Panel ── */}
      {isOpen && (
        <div
          className={`w-[360px] sm:w-[410px] h-[520px] rounded-xl flex flex-col mb-3 animate-fade-in-up overflow-hidden shadow-2xl ${
            isStandardMode
              ? "bg-white border border-[#CBD5E1]"
              : "bg-[#050914]/95 border border-[#00D4FF]/30 backdrop-blur-xl"
          }`}
          style={{
            boxShadow: isStandardMode
              ? "0 10px 30px rgba(0, 58, 140, 0.15), 0 2px 6px rgba(0,0,0,0.08)"
              : "0 12px 48px rgba(0,0,0,0.85), 0 0 30px rgba(0,212,255,0.15)",
          }}
        >
          {/* Header */}
          <div
            className={`px-4 py-3 flex items-center justify-between border-b ${
              isStandardMode
                ? "bg-[#0B3B60] text-white border-[#082C48]"
                : "bg-gradient-to-r from-[#004F80]/80 to-[#5B16C0]/80 text-white border-[#00D4FF]/20"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  isStandardMode ? "bg-[#B45309] text-white" : "bg-cyan-400/20 text-[#00D4FF]"
                }`}
              >
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  <span>TraceX AI Assistant</span>
                  <span
                    className={`text-[9.5px] px-1.5 py-0.2 rounded font-mono font-normal ${
                      isStandardMode ? "bg-white/20 text-white" : "bg-cyan-400/20 text-cyan-300"
                    }`}
                  >
                    LIVE
                  </span>
                </div>
                <div className="text-[10px] text-white/75 leading-tight truncate max-w-[210px]">
                  {activeCaseId ? `Context: Case #${activeCaseId}` : "Context: Global Network"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearChat}
                title="Clear Chat History"
                className="p-1 rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                className="p-1 rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Action Chips */}
          <div
            className={`px-3 py-2 border-b overflow-x-auto flex items-center gap-1.5 scrollbar-none whitespace-nowrap text-[11px] ${
              isStandardMode ? "bg-[#F8FAFC] border-[#E2E8F0]" : "bg-black/30 border-cyan-500/10"
            }`}
          >
            <span className="text-[10px] font-mono uppercase tracking-wider text-textDim flex-shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-accent" />
              Ask:
            </span>
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className={`px-2 py-0.5 rounded-full border text-[10.5px] transition-colors cursor-pointer flex-shrink-0 ${
                  isStandardMode
                    ? "bg-white border-[#CBD5E1] text-[#0B3B60] hover:bg-[#EEF2F6] hover:border-[#0B3B60]"
                    : "bg-cyan-500/10 border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20"
                }`}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Message List */}
          <div
            className={`flex-1 p-3.5 space-y-3.5 overflow-y-auto text-[12px] leading-relaxed ${
              isStandardMode ? "bg-[#F4F6F9]" : "bg-transparent"
            }`}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "bot" && (
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isStandardMode
                        ? "bg-[#0B3B60] text-white text-[10px]"
                        : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-lg p-2.5 shadow-xs ${
                    m.sender === "user"
                      ? isStandardMode
                        ? "bg-[#0B3B60] text-white rounded-br-none"
                        : "bg-gradient-to-r from-[#007FA8] to-[#005280] text-white rounded-br-none border border-cyan-400/30"
                      : isStandardMode
                      ? "bg-white border border-[#CBD5E1] text-[#0F172A] rounded-bl-none"
                      : "bg-[#0B1224] border border-cyan-500/20 text-[#E2E8F0] rounded-bl-none"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  <div
                    className={`text-[9.5px] mt-1 text-right font-mono ${
                      m.sender === "user" ? "text-white/70" : "text-textDim"
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>

                {m.sender === "user" && (
                  <div className="w-6 h-6 rounded-full bg-slate-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px]">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex gap-2.5 items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isStandardMode
                      ? "bg-[#0B3B60] text-white"
                      : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div
                  className={`px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 ${
                    isStandardMode
                      ? "bg-white border border-[#CBD5E1] text-[#0B3B60]"
                      : "bg-[#0B1224] border border-cyan-500/20 text-cyan-300"
                  }`}
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing intelligence database...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Text Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className={`p-2.5 border-t flex items-center gap-2 ${
              isStandardMode ? "bg-white border-[#CBD5E1]" : "bg-[#050914] border-cyan-500/20"
            }`}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder={
                activeCaseId
                  ? `Ask about Case #${activeCaseId}...`
                  : "Ask about high-risk cases or scam trends..."
              }
              className={`flex-1 px-3 py-2 text-xs rounded border outline-none transition-all ${
                isStandardMode
                  ? "bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] focus:border-[#0B3B60] focus:bg-white"
                  : "bg-black/50 border-cyan-500/20 text-white placeholder-slate-500 focus:border-cyan-400"
              }`}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`p-2 rounded transition-all cursor-pointer disabled:opacity-40 flex-shrink-0 ${
                isStandardMode
                  ? "bg-[#0B3B60] text-white hover:bg-[#082C48]"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(0,212,255,0.35)]"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* ── Floating Launcher Button (Bottom-Right Corner) ── */}
      <button
        type="button"
        id="tracex-ai-chatbot-launcher"
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-2.5 px-3.5 py-2.5 rounded-full font-bold text-xs transition-all shadow-xl cursor-pointer ${
          isStandardMode
            ? "bg-[#0B3B60] hover:bg-[#07263F] text-white border-2 border-[#B45309]"
            : "bg-gradient-to-r from-[#007FA8] to-[#6B21D8] text-white border border-[#00D4FF]/40 hover:shadow-[0_0_24px_rgba(0,212,255,0.5)]"
        }`}
        style={{
          boxShadow: isStandardMode
            ? "0 4px 14px rgba(11, 59, 96, 0.4)"
            : "0 0 20px rgba(0,212,255,0.35)",
        }}
      >
        <div className="relative">
          <Bot className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
        </div>
        <span className="tracking-wide">
          {isOpen ? "Close Assistant" : "TraceX Cyber AI"}
        </span>
      </button>
    </div>
  );
}
