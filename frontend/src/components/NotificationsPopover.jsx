import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Network,
  ShieldAlert,
  Clock,
  ExternalLink,
  Check,
} from "lucide-react";

const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Urgent Freeze Action Needed",
    desc: "Beneficiary UPI handle on Case #4471 flagged with confidence 0.95. Sec 91 CrPC freeze recommended.",
    time: "4 mins ago",
    caseId: "1",
    caseNumber: "#4471",
    type: "urgent",
    read: false,
  },
  {
    id: "notif-2",
    title: "Cross-Case Device Overlap",
    desc: "IMEI 860123456789012 matched between Case #4471 and Case #4472 across different IMSIs.",
    time: "18 mins ago",
    caseId: "2",
    caseNumber: "#4472",
    type: "correlation",
    read: false,
  },
  {
    id: "notif-3",
    title: "Threat Intelligence Match",
    desc: "APK checksum matched known Trojan malware family in CERT-In advisory repository.",
    time: "1 hour ago",
    caseId: "2",
    caseNumber: "#4472",
    type: "threat",
    read: true,
  },
  {
    id: "notif-4",
    title: "District Heatmap Updated",
    desc: "Automated IFSC & PIN resolution completed for 4 newly registered complaints.",
    time: "2 hours ago",
    type: "system",
    read: true,
  },
];

const TYPE_CONFIG = {
  urgent: {
    Icon: AlertTriangle,
    color: "#FF3B5C",
    bg: "rgba(255,59,92,0.12)",
    border: "rgba(255,59,92,0.25)",
    glow: "rgba(255,59,92,0.30)",
  },
  correlation: {
    Icon: Network,
    color: "#00D4FF",
    bg: "rgba(0,212,255,0.10)",
    border: "rgba(0,212,255,0.22)",
    glow: "rgba(0,212,255,0.25)",
  },
  threat: {
    Icon: ShieldAlert,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.10)",
    border: "rgba(245,158,11,0.22)",
    glow: "rgba(245,158,11,0.25)",
  },
  system: {
    Icon: CheckCircle2,
    color: "#10B981",
    bg: "rgba(16,185,129,0.10)",
    border: "rgba(16,185,129,0.20)",
    glow: "rgba(16,185,129,0.20)",
  },
};

export default function NotificationsPopover({ isOpen, onClose, anchorRef }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notif) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    onClose();
    if (notif.caseId) navigate(`/cases/${notif.caseId}/graph`);
  };

  return (
    <div
      className="fixed w-96 max-w-[92vw] z-[200] overflow-hidden select-none animate-fade-in-up"
      style={{
        top: "56px",
        right: "56px",
        background: "rgba(4,8,20,0.98)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(0,212,255,0.18)",
        borderRadius: "8px",
        boxShadow: "0 12px 48px rgba(0,0,0,0.70), 0 0 24px rgba(0,212,255,0.08)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          borderBottom: "1px solid rgba(0,212,255,0.10)",
          background: "rgba(0,212,255,0.04)",
        }}
      >
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" style={{ color: "#00D4FF" }} />
          <span className="text-[13px] font-semibold text-text">Operational Alerts</span>
          {unreadCount > 0 && (
            <span
              className="px-1.5 py-0 text-[10px] font-mono font-bold rounded-full"
              style={{
                background: "#FF3B5C",
                color: "#fff",
                boxShadow: "0 0 8px rgba(255,59,92,0.60)",
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-[11px] font-mono transition-all"
            style={{ color: "rgba(0,212,255,0.60)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#00D4FF")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(0,212,255,0.60)")}
          >
            <Check className="w-3 h-3" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="max-h-[360px] overflow-y-auto">
        {notifications.map((notif) => {
          const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
          const { Icon } = cfg;

          return (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className="p-3.5 cursor-pointer flex items-start gap-3 transition-all"
              style={{
                borderBottom: "1px solid rgba(0,212,255,0.06)",
                background: !notif.read ? "rgba(0,212,255,0.03)" : "transparent",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,212,255,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = !notif.read ? "rgba(0,212,255,0.03)" : "transparent")}
            >
              {/* Icon */}
              <div
                className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                  boxShadow: `0 0 8px ${cfg.glow}`,
                }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[12.5px] font-semibold text-text truncate">{notif.title}</span>
                  {!notif.read && (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: "#00D4FF", boxShadow: "0 0 6px rgba(0,212,255,0.80)" }}
                    />
                  )}
                </div>
                <p className="text-[11.5px] text-textDim leading-snug">{notif.desc}</p>
                <div className="flex items-center gap-2 mt-1.5 text-[10.5px]" style={{ color: "rgba(100,116,139,0.70)" }}>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {notif.time}
                  </span>
                  {notif.caseNumber && (
                    <>
                      <span>•</span>
                      <span className="font-mono font-semibold flex items-center gap-0.5" style={{ color: "#00D4FF" }}>
                        {notif.caseNumber}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="p-2.5 text-center"
        style={{ borderTop: "1px solid rgba(0,212,255,0.08)", background: "rgba(0,0,0,0.20)" }}
      >
        <span className="text-[10.5px] font-mono" style={{ color: "rgba(0,212,255,0.30)" }}>
          Real-time updates from correlation &amp; threat intel pipelines
        </span>
      </div>
    </div>
  );
}
