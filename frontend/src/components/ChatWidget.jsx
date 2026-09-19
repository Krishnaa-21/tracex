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

const REQUEST_TIMEOUT_MS = 30000;
const MAX_HISTORY_TURNS = 6;

const nowStamp = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Turn a failed chat request into a message an officer can act on. */
function describeChatError(err) {
  if (err?.name === "AbortError") {
    return "The assistant took too long to respond. Please try again — or ask a narrower question.";
  }
  const status = err?.status;
  if (status === 400 && typeof err.message === "string") return err.message;
  if (status === 404) return "The assistant service was not found on the server. Please make sure the backend is up to date.";
  if (status >= 500) return "The intelligence service hit an error. Please try again in a moment.";
  if (status === undefined) {
    return "Cannot reach the TraceX server. Check that the backend is running and your connection is working, then try again.";
  }
  return "Error retrieving intelligence response. Please try again.";
}

/** Inline **bold**, *italic* and `code` -> React nodes (no innerHTML, so evidence text can't inject markup). */
function renderInline(text, keyPrefix) {
  const nodes = [];
  const re = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\n]+\*)/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyPrefix}-${i++}`;
    if (tok.startsWith("**")) {
      nodes.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("`")) {
      nodes.push(
        <code key={key} className="px-1 rounded bg-slate-500/15 font-mono text-[11px] break-all">
          {tok.slice(1, -1)}
        </code>
      );
    } else {
      nodes.push(<em key={key}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** Minimal markdown: paragraphs, "- " bullets, numbered lines, bold/italic/code. */
function FormattedText({ text }) {
  const lines = String(text ?? "").split("\n");
  return (
    <div>
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-1.5" />;
        const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
        if (bullet) {
          return (
            <div key={idx} className="flex gap-1.5 pl-1">
              <span aria-hidden="true">•</span>
              <span className="min-w-0 break-words">{renderInline(bullet[1], `l${idx}`)}</span>
            </div>
          );
        }
        return (
          <div key={idx} className="break-words">
            {renderInline(line, `l${idx}`)}
          </div>
        );
      })}
    </div>
  );
}

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

  // The URL carries the database id; officers know cases by their case number (e.g. #4471).
  const [activeCaseNumber, setActiveCaseNumber] = useState(null);
  useEffect(() => {
    setActiveCaseNumber(null);
    if (!activeCaseId) return undefined;
    let cancelled = false;
    apiClient
      .get(`cases/${activeCaseId}`)
      .then((c) => {
        if (!cancelled) setActiveCaseNumber(c?.case_number || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeCaseId]);
  const caseLabel = activeCaseNumber ? `Case ${activeCaseNumber}` : `Case ID ${activeCaseId}`;

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
      timestamp: nowStamp(),
    };

    // Recent real turns give the assistant context for follow-up questions.
    const history = messages
      .filter((m) => !m.isError && m.id !== "welcome" && m.id !== "cleared")
      .slice(-MAX_HISTORY_TURNS)
      .map((m) => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Never leave the widget stuck on "Analyzing…" if the server hangs.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await apiClient.post(
        "chat",
        { message: query, case_id: activeCaseId, history },
        { signal: controller.signal }
      );
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: res?.response || "No response received from intelligence engine.",
        suggested: Array.isArray(res?.suggested_actions) ? res.suggested_actions : [],
        timestamp: nowStamp(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: `err-${Date.now()}`,
        sender: "bot",
        text: describeChatError(err),
        isError: true,
        timestamp: nowStamp(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      clearTimeout(timer);
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "cleared",
        sender: "bot",
        text: "Chat history cleared. How can I assist your investigation today?",
        timestamp: nowStamp(),
      },
    ]);
  };

  const lastBotId = [...messages].reverse().find((m) => m.sender === "bot" && !m.isError)?.id;

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
                  {activeCaseId ? `Context: ${caseLabel}` : "Context: Global Network"}
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
                  {m.sender === "bot" ? (
                    <FormattedText text={m.text} />
                  ) : (
                    <div className="whitespace-pre-wrap break-words">{m.text}</div>
                  )}
                  <div
                    className={`text-[9.5px] mt-1 text-right font-mono ${
                      m.sender === "user" ? "text-white/70" : "text-textDim"
                    }`}
                  >
                    {m.timestamp}
                  </div>
                  {/* Follow-up suggestions from the assistant (latest reply only) */}
                  {m.sender === "bot" && m.id === lastBotId && !isLoading && m.suggested?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {m.suggested.map((sg) => (
                        <button
                          key={sg}
                          type="button"
                          onClick={() => handleSendMessage(sg)}
                          className={`px-2 py-0.5 rounded-full border text-[10.5px] text-left transition-colors cursor-pointer ${
                            isStandardMode
                              ? "bg-white border-[#CBD5E1] text-[#0B3B60] hover:bg-[#EEF2F6] hover:border-[#0B3B60]"
                              : "bg-cyan-500/10 border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20"
                          }`}
                        >
                          {sg}
                        </button>
                      ))}
                    </div>
                  )}
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
                  ? `Ask about ${caseLabel}...`
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
