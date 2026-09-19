import React from "react";
import {
  Shield,
  PhoneCall,
  Landmark,
  Radio,
  FileCode2,
  ArrowRight,
  ExternalLink,
  Plus,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import { useMode } from "../../context/ModeContext";

export default function StandardHero({ onOpenNewInvestigation }) {
  const { language } = useMode();

  const inFocusCards = [
    {
      title: "1930 Citizen Ingestion",
      desc: "Live stream of verified financial cyber fraud complaints with immediate transaction hold timestamps.",
      icon: PhoneCall,
      code: "NCRP-FEED",
    },
    {
      title: "NPCI / Bank Mule Tracer",
      desc: "Automated multi-hop beneficiary account mapping and Section 91 CrPC debit freeze notice generation.",
      icon: Landmark,
      code: "SEC-91-CRPC",
    },
    {
      title: "Telecom CDR & Cell Sites",
      desc: "Instant IMEI / IMSI pairing, suspect device mobility tracks, and tower triangulation analytics.",
      icon: Radio,
      code: "CDR-PARSER",
    },
    {
      title: "CERT-In Threat Feeds",
      desc: "Synchronized repository of flagged malicious APK signatures, C2 server IPs, and fraudulent domains.",
      icon: FileCode2,
      code: "CERT-REGISTRY",
    },
  ];

  return (
    <div className="w-full space-y-6 mb-8">
      {/* ── Official Navy Hero Banner ── */}
      <div className="bg-[#0B3B60] text-white rounded-lg p-6 sm:p-8 shadow-sm border border-[#082C48] relative overflow-hidden">
        {/* Subtle official watermark emblem in background */}
        <div className="absolute right-4 -bottom-10 opacity-5 pointer-events-none">
          <Shield className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 max-w-4xl space-y-4">
          {/* Official Announcement / Helpline Ribbon */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#B45309] text-white rounded text-[11px] font-bold tracking-wider uppercase shadow-xs">
            <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
            <span>
              {language === "hi"
                ? "राष्ट्रीय साइबर हेल्पलाइन: 1930 | आपातकालीन वित्तीय साइबर धोखाधड़ी सहायता"
                : "National Cyber Crime Helpline: 1930 | Citizen Portal: cybercrime.gov.in"}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight font-sans">
            {language === "hi"
              ? "केंद्रीकृत साइबर अपराध विश्लेषिकी एवं बहु-स्रोत आसूचना प्रणाली"
              : "Centralized Cybercrime Analytics & Multi-Source Intelligence System"}
          </h2>

          <p className="text-[13.5px] text-white/85 leading-relaxed max-w-3xl">
            {language === "hi"
              ? "दूरसंचार सीडीआर, यूपीआई लेनदेन, म्यूल बैंक खातों और दुर्भावनापूर्ण एपीके एंडपॉइंट्स का रीयल-टाइम संबंधन एवं स्वचालित जांच समाधान।"
              : "TraceX provides investigating officers with real-time multi-hop correlation across telecom CDR logs, banking UPI trails, device IMEI identities, and phishing infrastructure. Fully aligned with Bharatiya Nyaya Sanhita (BNS) and Section 65B Indian Evidence Act certification."}
          </p>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenNewInvestigation}
              aria-label="Register New Cyber Complaint or Evidence"
              className="px-4 py-2 bg-white text-[#0B3B60] hover:bg-slate-100 font-bold text-xs rounded transition-colors flex items-center gap-2 shadow-xs cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 text-[#0B3B60]" />
              <span>Register New Cyber Complaint / Evidence</span>
            </button>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open National Citizen Portal (cybercrime.gov.in) in new tab"
              className="px-4 py-2 bg-[#07263F] hover:bg-[#051C30] text-white/90 font-medium text-xs rounded border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>National Citizen Portal (cybercrime.gov.in)</span>
              <ExternalLink className="w-3 h-3 text-white/60" />
            </a>
          </div>
        </div>
      </div>

      {/* ── In Focus Quick Access Strip ── */}
      <div>
        <div className="flex items-center justify-between mb-3 border-b border-[#CBD5E1] pb-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-[#0B3B60] rounded-xs" />
            <h3 className="text-sm font-bold text-[#0F172A] tracking-tight uppercase">
              {language === "hi" ? "प्रमुख फोरेंसिक क्षमताएं (In Focus)" : "Forensic Capabilities (In Focus)"}
            </h3>
          </div>
          <span className="text-[11px] text-[#64748B] font-mono">Status: All Nodal Feeds Synchronized</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {inFocusCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-white border border-[#CBD5E1] rounded-lg p-4 shadow-xs hover:border-[#0B3B60] transition-all group flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded bg-[#EEF2F6] group-hover:bg-[#0B3B60] text-[#0B3B60] group-hover:text-white flex items-center justify-center transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded">
                      {card.code}
                    </span>
                  </div>
                  <h4 className="text-[13px] font-bold text-[#0F172A] leading-tight">
                    {card.title}
                  </h4>
                  <p className="text-[11.5px] text-[#475569] leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
