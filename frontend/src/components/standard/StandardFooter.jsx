import React from "react";
import { Shield, PhoneCall, Mail, ExternalLink, Scale, CheckCircle2 } from "lucide-react";
import { useMode } from "../../context/ModeContext";

export default function StandardFooter() {
  const { language } = useMode();

  return (
    <footer className="w-full bg-[#07263F] text-white border-t-2 border-[#0B3B60] mt-16 overflow-hidden">
      {/* Indian Tricolor Accent Line */}
      <div className="h-1 w-full flex">
        <div className="h-full w-1/3 bg-[#FF9933]" />
        <div className="h-full w-1/3 bg-white" />
        <div className="h-full w-1/3 bg-[#128807]" />
      </div>

      {/* Upper Footer: 4 Categorized Columns */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-[12px]">
          {/* Column 1: Portals & Initiatives */}
          <div className="space-y-3">
            <h4 className="text-[13px] font-bold text-yellow-400 uppercase tracking-wider border-b border-white/10 pb-2">
              National Portals
            </h4>
            <ul className="space-y-2 text-white/80">
              <li>
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <span>National Cybercrime Reporting Portal</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://i4c.mha.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <span>Indian Cyber Crime Coordination Centre (I4C)</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://cert-in.org.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <span>CERT-In National Incident Response</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <span className="text-white/60">Citizen Financial Cyber Fraud Management System</span>
              </li>
            </ul>
          </div>

          {/* Column 2: Investigative Forensics */}
          <div className="space-y-3">
            <h4 className="text-[13px] font-bold text-yellow-400 uppercase tracking-wider border-b border-white/10 pb-2">
              Forensic Capabilities
            </h4>
            <ul className="space-y-2 text-white/80">
              <li>Telecom Tower &amp; CDR Parser</li>
              <li>NPCI UPI &amp; Bank Account Mule Tracer</li>
              <li>IMEI/IMSI Device Association Graph</li>
              <li>Section 91 CrPC Automated Notice Generator</li>
              <li>Malicious APK Sandbox &amp; C2 Extraction</li>
            </ul>
          </div>

          {/* Column 3: Statutory Framework */}
          <div className="space-y-3">
            <h4 className="text-[13px] font-bold text-yellow-400 uppercase tracking-wider border-b border-white/10 pb-2">
              Statutory Compliance
            </h4>
            <ul className="space-y-2 text-white/80">
              <li>IT Act 2000 — Section 66C &amp; 66D</li>
              <li>IT Act 2000 — Section 69A Takedown Orders</li>
              <li>Bharatiya Nyaya Sanhita (BNS 2023)</li>
              <li>Indian Evidence Act — Section 65B Certification</li>
              <li>IT (Intermediary Guidelines) Rules 2021</li>
            </ul>
          </div>

          {/* Column 4: Official Helplines & Assistance */}
          <div className="space-y-3">
            <h4 className="text-[13px] font-bold text-yellow-400 uppercase tracking-wider border-b border-white/10 pb-2">
              Official Helplines
            </h4>
            <div className="space-y-2 text-white/80 leading-relaxed">
              <div className="p-2.5 rounded bg-black/25 border border-white/10">
                <div className="text-[10.5px] uppercase font-mono text-yellow-400">Emergency Helpline</div>
                <div className="text-base font-bold text-white tracking-wide">1930 (Toll Free)</div>
                <div className="text-[10px] text-white/60">24x7 Citizen Cyber Financial Assistance</div>
              </div>
              <div className="text-[11px] text-white/70 space-y-1">
                <div>Operational Desk: <code>nodal@cybercrime.gov.in</code></div>
                <div>National Police Cyber Forensic Lab (NCFL)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Footer: Attribution & Disclaimers */}
      <div className="bg-[#051829] border-t border-white/10 text-white/60 text-[11px] py-4 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="space-y-0.5">
            <p className="font-medium text-white/80">
              This portal is maintained by the Cyber Crime Investigation &amp; Forensics Wing, Ministry of Home Affairs, Government of India.
            </p>
            <p className="text-[10px] text-white/50">
              © 2026 TraceX National Cyber Intelligence Network. All Rights Reserved. Designed strictly in accordance with USWDS &amp; Government of India Web Guidelines.
            </p>
          </div>
          <div className="text-[10.5px] font-mono text-yellow-400/90 whitespace-nowrap">
            SECURE ENCRYPTED NETWORK (TLS 1.3)
          </div>
        </div>
      </div>
    </footer>
  );
}
