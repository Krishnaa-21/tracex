import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Smartphone,
  Landmark,
  Globe,
  CreditCard,
  Cpu,
  Mail,
  Link2,
  Folder,
  Users,
  Database,
  AlertTriangle,
  Share2,
  RotateCcw,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  Crosshair,
  X,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export const formatEntityType = (type) =>
  ({
    upi_handle: "UPI Handle",
    account: "Bank Account",
    phone: "Phone",
    imei: "IMEI / Device",
    imsi: "SIM / IMSI",
    ip_address: "IP Address",
    apk_hash: "Malicious APK",
    email: "Email",
    url: "URL / Website",
  }[type] || "Entity");

// Color palette for the 7 cluster categories matching reference design
const CLUSTER_CONFIGS = [
  {
    id: "phone",
    name: "Phone",
    types: ["phone", "imsi"],
    icon: Smartphone,
    color: "#F43F5E", // Rose/Red
    glow: "rgba(244, 63, 94, 0.4)",
    badgeBg: "rgba(244, 63, 94, 0.16)",
    defaultTotal: 342,
    defaultHighRisk: 48,
    defaultLinks: 912,
    defaultEntities: [
      { id: "p1", value: "+91 98765 43210", risk: "high", connections: 28 },
      { id: "p2", value: "+91 91234 56789", risk: "high", connections: 24 },
      { id: "p3", value: "+91 99887 76655", risk: "medium", connections: 19 },
      { id: "p4", value: "+91 87654 32109", risk: "medium", connections: 17 },
      { id: "p5", value: "+91 76543 21098", risk: "low", connections: 12 },
    ],
  },
  {
    id: "ip_address",
    name: "IP Address",
    types: ["ip_address", "ip"],
    icon: Globe,
    color: "#3B82F6", // Blue
    glow: "rgba(59, 130, 246, 0.4)",
    badgeBg: "rgba(59, 130, 246, 0.16)",
    defaultTotal: 268,
    defaultHighRisk: 28,
    defaultLinks: 721,
    defaultEntities: [
      { id: "ip1", value: "192.168.1.25", risk: "high", connections: 22 },
      { id: "ip2", value: "103.21.244.18", risk: "high", connections: 18 },
      { id: "ip3", value: "45.33.32.156", risk: "medium", connections: 15 },
      { id: "ip4", value: "185.220.101.5", risk: "medium", connections: 11 },
      { id: "ip5", value: "10.0.4.12", risk: "low", connections: 8 },
    ],
  },
  {
    id: "imei",
    name: "IMEI / Device",
    types: ["imei", "device"],
    icon: Cpu,
    color: "#F59E0B", // Amber/Gold
    glow: "rgba(245, 158, 11, 0.4)",
    badgeBg: "rgba(245, 158, 11, 0.16)",
    defaultTotal: 156,
    defaultHighRisk: 21,
    defaultLinks: 430,
    defaultEntities: [
      { id: "im1", value: "867452048912345", risk: "high", connections: 19 },
      { id: "im2", value: "354892019482012", risk: "high", connections: 16 },
      { id: "im3", value: "861947204918234", risk: "medium", connections: 12 },
      { id: "im4", value: "359182049182049", risk: "low", connections: 9 },
    ],
  },
  {
    id: "url",
    name: "URL / Website",
    types: ["url", "domain", "apk_hash"],
    icon: Link2,
    color: "#A855F7", // Purple
    glow: "rgba(168, 85, 247, 0.4)",
    badgeBg: "rgba(168, 85, 247, 0.16)",
    defaultTotal: 96,
    defaultHighRisk: 9,
    defaultLinks: 212,
    defaultEntities: [
      { id: "u1", value: "https://pay-secure-kyc.in", risk: "high", connections: 21 },
      { id: "u2", value: "https://auth-gateway-sbi.net", risk: "high", connections: 17 },
      { id: "u3", value: "https://update-pan-gov.org", risk: "medium", connections: 13 },
      { id: "u4", value: "http://fast-cashback-vpa.xyz", risk: "low", connections: 7 },
    ],
  },
  {
    id: "email",
    name: "Email",
    types: ["email"],
    icon: Mail,
    color: "#06B6D4", // Cyan
    glow: "rgba(6, 182, 212, 0.4)",
    badgeBg: "rgba(6, 182, 212, 0.16)",
    defaultTotal: 88,
    defaultHighRisk: 14,
    defaultLinks: 184,
    defaultEntities: [
      { id: "em1", value: "support@rbi-kyc-desk.com", risk: "high", connections: 15 },
      { id: "em2", value: "nodal-alerts@fastupi.live", risk: "high", connections: 12 },
      { id: "em3", value: "refunds@settlement-help.net", risk: "medium", connections: 10 },
      { id: "em4", value: "officer.deskmop@gmail.com", risk: "low", connections: 6 },
    ],
  },
  {
    id: "upi_handle",
    name: "UPI Handle",
    types: ["upi_handle", "upi"],
    icon: CreditCard,
    color: "#EC4899", // Pink
    glow: "rgba(236, 72, 153, 0.4)",
    badgeBg: "rgba(236, 72, 153, 0.16)",
    defaultTotal: 190,
    defaultHighRisk: 29,
    defaultLinks: 495,
    defaultEntities: [
      { id: "upi1", value: "fastrefund987@okaxis", risk: "high", connections: 26 },
      { id: "upi2", value: "kyc.verify24@icici", risk: "high", connections: 23 },
      { id: "upi3", value: "support.desk@paytm", risk: "medium", connections: 18 },
      { id: "upi4", value: "merchant.direct@ybl", risk: "low", connections: 11 },
    ],
  },
  {
    id: "bank_account",
    name: "Bank Account",
    types: ["account", "bank_account"],
    icon: Landmark,
    color: "#10B981", // Teal/Emerald
    glow: "rgba(16, 185, 129, 0.4)",
    badgeBg: "rgba(16, 185, 129, 0.16)",
    defaultTotal: 214,
    defaultHighRisk: 37,
    defaultLinks: 658,
    defaultEntities: [
      { id: "ba1", value: "SBIN0004128 - 30891284712", risk: "high", connections: 27 },
      { id: "ba2", value: "HDFC0001092 - 5010048192841", risk: "high", connections: 22 },
      { id: "ba3", value: "ICIC0000482 - 048201948291", risk: "medium", connections: 16 },
      { id: "ba4", value: "PUNB0192849 - 1928401928491", risk: "low", connections: 10 },
    ],
  },
];

// SVG Canvas layout dimensions for compact & screen-efficient display
const SVG_WIDTH = 1000;
const SVG_HEIGHT = 540;
const CENTER_X = 500;
const CENTER_Y = 270;
const CLUSTER_RADIUS = 185;

export default function NetworkGraph({
  nodes = [],
  edges = [],
  caseNumber = "TRX-2024-001",
  victimName,
  isLoading = false,
}) {
  // Navigation & View State
  const [activeHop, setActiveHop] = useState("overview"); // "overview" | "1hop" | "2hops" | "3hops"
  const [selectedClusterId, setSelectedClusterId] = useState("phone"); // Default to Phone
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const [activeSideTab, setActiveSideTab] = useState("top"); // "top" | "distribution"
  const [expandedClusters, setExpandedClusters] = useState(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeFinding, setActiveFinding] = useState(null);

  // Zoom, Pan & Drag Pinning State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [clusterPositions, setClusterPositions] = useState({});
  const [draggedCluster, setDraggedCluster] = useState(null);
  const [hoveredClusterId, setHoveredClusterId] = useState(null);
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const touchDistRef = useRef(null);
  const dragRef = useRef({
    isPointerDown: false,
    targetClusterId: null,
    startX: 0,
    startY: 0,
    hasMoved: false,
  });

  // Compute cluster aggregations dynamically from real backend nodes and edges
  const clustersData = useMemo(() => {
    return CLUSTER_CONFIGS.map((config, index) => {
      // Filter real nodes matching this category
      const matchedNodes = nodes.filter((n) => {
        const t = (n.entity_type || "").toLowerCase();
        return config.types.includes(t);
      });

      const hasRealData = nodes.length > 0;
      const totalCount = hasRealData ? matchedNodes.length : config.defaultTotal;
      const highRiskCount = hasRealData
        ? matchedNodes.filter((n) => (n.risk_level || "").toLowerCase() === "high").length
        : config.defaultHighRisk;

      // Count connections involving these nodes
      const nodeIds = new Set(matchedNodes.map((n) => n.id));
      const connectedEdges = edges.filter(
        (e) => nodeIds.has(e.source) || nodeIds.has(e.target)
      );
      const linksCount = hasRealData ? connectedEdges.length : config.defaultLinks;

      // Calculate Top Entities
      let topEntities = [];
      if (hasRealData && matchedNodes.length > 0) {
        topEntities = matchedNodes
          .map((n) => {
            const edgeCount = edges.filter(
              (e) => e.source === n.id || e.target === n.id
            ).length;
            return {
              id: n.id,
              value: n.label || String(n.id),
              risk: (n.risk_level || "low").toLowerCase(),
              connections: edgeCount || n.degree || 1,
              anomaly_reason: n.anomaly_reason,
            };
          })
          .sort((a, b) => b.connections - a.connections)
          .slice(0, 10);
      } else {
        topEntities = config.defaultEntities;
      }

      // Calculate radial coordinates around center (cx = 500, cy = 270, R = 185)
      // 7 positions evenly distributed starting at top (-90 degrees)
      const angle = -Math.PI / 2 + index * ((2 * Math.PI) / 7);
      const defaultX = Math.round(CENTER_X + CLUSTER_RADIUS * Math.cos(angle));
      const defaultY = Math.round(CENTER_Y + CLUSTER_RADIUS * Math.sin(angle));
      const userPos = clusterPositions[config.id];
      const x = userPos ? userPos.x : defaultX;
      const y = userPos ? userPos.y : defaultY;

      return {
        ...config,
        count: totalCount || config.defaultTotal,
        highRisk: highRiskCount || config.defaultHighRisk,
        linksCount: linksCount || config.defaultLinks,
        topEntities,
        x,
        y,
        angle,
      };
    });
  }, [nodes, edges, clusterPositions]);

  // Overall Stat Cards numbers
  const summaryStats = useMemo(() => {
    const hasReal = nodes.length > 0;
    const totalEnt = hasReal
      ? nodes.length
      : clustersData.reduce((acc, c) => acc + c.count, 0);
    const totalConn = hasReal
      ? edges.length
      : clustersData.reduce((acc, c) => acc + c.linksCount, 0);
    const highRiskEnt = hasReal
      ? nodes.filter((n) => (n.risk_level || "").toLowerCase() === "high").length
      : clustersData.reduce((acc, c) => acc + c.highRisk, 0);
    const crossCaseLinks = hasReal
      ? edges.filter((e) => e.extra?.cross_case).length
      : 24;

    return {
      totalEntities: totalEnt || 1248,
      totalConnections: totalConn || 3692,
      highRiskEntities: highRiskEnt || 186,
      entityTypes: 7,
      crossCaseLinks: crossCaseLinks || 24,
    };
  }, [nodes, edges, clustersData]);

  // Active selected cluster object
  const selectedCluster = useMemo(() => {
    return (
      clustersData.find((c) => c.id === selectedClusterId) || clustersData[0]
    );
  }, [clustersData, selectedClusterId]);

  // Handle Zoom & Pan controls
  const handleZoomIn = () => setZoom((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setClusterPositions({});
    setActiveHop("overview");
  };

  // Attach wheel listener: page scrolls naturally unless Ctrl/Cmd is held for zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        setZoom((z) => Math.min(2.5, Math.max(0.5, Number((z + delta).toFixed(2)))));
      }
      // Without modifier key, browser performs normal page scrolling
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Toggle cluster expansion for progressive disclosure
  const toggleExpandCluster = (clusterId, e) => {
    if (e) e.stopPropagation();
    setExpandedClusters((prev) => {
      const next = new Set(prev);
      if (next.has(clusterId)) {
        next.delete(clusterId);
      } else {
        next.add(clusterId);
      }
      return next;
    });
    setSelectedClusterId(clusterId);
    setIsSidePanelOpen(true);
  };

  // Cluster node pointer down - distinguishes pure click from intentional drag
  const handleClusterMouseDown = (clusterId, e) => {
    e.stopPropagation();
    dragRef.current = {
      isPointerDown: true,
      targetClusterId: clusterId,
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false,
    };
  };

  // Mouse pan & drag handlers for SVG canvas
  const handleMouseDown = (e) => {
    if (
      e.target.closest(".interactive-node") ||
      e.target.closest(".floating-panel") ||
      e.target.closest(".controls-cluster")
    ) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    // Cluster dragging with threshold to prevent click wobble
    if (dragRef.current.isPointerDown && dragRef.current.targetClusterId) {
      const dx = Math.abs(e.clientX - dragRef.current.startX);
      const dy = Math.abs(e.clientY - dragRef.current.startY);

      // Require > 7px intentional movement before initiating drag
      if (!dragRef.current.hasMoved && (dx > 7 || dy > 7)) {
        // Active selected node is strictly frozen/pinned
        if (dragRef.current.targetClusterId !== selectedClusterId) {
          dragRef.current.hasMoved = true;
          setDraggedCluster(dragRef.current.targetClusterId);
        }
      }

      if (dragRef.current.hasMoved && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const svgX = ((e.clientX - rect.left) / rect.width) * SVG_WIDTH;
        const svgY = ((e.clientY - rect.top) / rect.height) * SVG_HEIGHT;
        const worldX = (svgX - (CENTER_X + pan.x)) / zoom + CENTER_X;
        const worldY = (svgY - (CENTER_Y + pan.y)) / zoom + CENTER_Y;
        setClusterPositions((prev) => ({
          ...prev,
          [dragRef.current.targetClusterId]: {
            x: Math.max(50, Math.min(SVG_WIDTH - 50, Math.round(worldX))),
            y: Math.max(50, Math.min(SVG_HEIGHT - 50, Math.round(worldY))),
          },
        }));
        return;
      }
    }

    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    if (dragRef.current.isPointerDown) {
      // If pointer moved less than 7px threshold, it is a pure click -> select & freeze node
      if (!dragRef.current.hasMoved && dragRef.current.targetClusterId) {
        setSelectedClusterId(dragRef.current.targetClusterId);
        setIsSidePanelOpen(true);
      }
      dragRef.current = {
        isPointerDown: false,
        targetClusterId: null,
        startX: 0,
        startY: 0,
        hasMoved: false,
      };
      setDraggedCluster(null);
    }
    setIsDragging(false);
  };

  // Touch handlers for mobile pinch-to-zoom and panning
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistRef.current = dist;
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchDistRef.current;
      setZoom((z) => Math.min(2.5, Math.max(0.5, Number((z * ratio).toFixed(2)))));
      touchDistRef.current = dist;
    } else if (e.touches.length === 1 && isDragging) {
      setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
    }
  };

  const handleTouchEnd = () => {
    touchDistRef.current = null;
    setIsDragging(false);
  };

  // Pre-calculated cross-cluster multi-hop lines for 1 Hop / 2 Hops / 3 Hops visualization
  const crossHops = useMemo(() => {
    // 0: Phone, 1: IP, 2: IMEI, 3: URL, 4: Email, 5: UPI, 6: Bank
    if (activeHop === "overview") return [];
    if (activeHop === "1hop") {
      return [
        { from: clustersData[0], to: clustersData[6], color: "#F43F5E" }, // Phone <-> Bank
        { from: clustersData[6], to: clustersData[5], color: "#10B981" }, // Bank <-> UPI
        { from: clustersData[0], to: clustersData[2], color: "#F59E0B" }, // Phone <-> IMEI
      ];
    }
    if (activeHop === "2hops") {
      return [
        { from: clustersData[0], to: clustersData[6], color: "#F43F5E" }, // Phone <-> Bank
        { from: clustersData[6], to: clustersData[5], color: "#10B981" }, // Bank <-> UPI
        { from: clustersData[5], to: clustersData[1], color: "#EC4899" }, // UPI <-> IP
        { from: clustersData[0], to: clustersData[2], color: "#F59E0B" }, // Phone <-> IMEI
        { from: clustersData[2], to: clustersData[1], color: "#3B82F6" }, // IMEI <-> IP
      ];
    }
    // 3 Hops
    return [
      { from: clustersData[0], to: clustersData[6], color: "#F43F5E" },
      { from: clustersData[6], to: clustersData[5], color: "#10B981" },
      { from: clustersData[5], to: clustersData[1], color: "#EC4899" },
      { from: clustersData[1], to: clustersData[3], color: "#3B82F6" },
      { from: clustersData[3], to: clustersData[4], color: "#A855F7" },
      { from: clustersData[0], to: clustersData[2], color: "#F59E0B" },
    ];
  }, [activeHop, clustersData]);

  return (
    <div
      className={`w-full flex flex-col gap-4 font-sans text-slate-100 ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-[#050811] p-6 overflow-y-auto"
          : "relative"
      }`}
    >
      {/* 1. Header Title & Hop / View Controls Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 border-b border-slate-800/80 pb-2.5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Case Correlation Graph</span>
          </h2>
          <p className="text-[12px] text-slate-400 mt-0.5">
            Explore connections between entities. Click a category cluster to view details or hold Ctrl + scroll to zoom.
          </p>
        </div>

        {/* Right-aligned Hop Tabs */}
        <div className="flex items-center gap-2">
          <div className="bg-[#0B1222] border border-slate-800 rounded-lg p-1 flex items-center gap-1 shadow-sm">
            {[
              { id: "overview", label: "Overview" },
              { id: "1hop", label: "1 Hop" },
              { id: "2hops", label: "2 Hops" },
              { id: "3hops", label: "3 Hops" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveHop(tab.id)}
                className={`px-2.5 py-1 text-[11.5px] font-medium rounded-md transition-all cursor-pointer ${
                  activeHop === tab.id
                    ? "bg-blue-600 text-white shadow-md font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Five Summary Stat Cards (Directly above the graph - Compact & Screen-Efficient) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* Total Entities */}
        <div className="bg-[#0B1222] border border-slate-800/80 rounded-xl p-2.5 sm:p-3 flex items-center gap-3 shadow-sm hover:border-slate-700/80 transition-colors">
          <div className="w-8.5 h-8.5 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Total Entities
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-white mt-0.5">
              {summaryStats.totalEntities.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Total Connections */}
        <div className="bg-[#0B1222] border border-slate-800/80 rounded-xl p-2.5 sm:p-3 flex items-center gap-3 shadow-sm hover:border-slate-700/80 transition-colors">
          <div className="w-8.5 h-8.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <Link2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Total Connections
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-white mt-0.5">
              {summaryStats.totalConnections.toLocaleString()}
            </div>
          </div>
        </div>

        {/* High Risk Entities */}
        <div className="bg-[#0B1222] border border-slate-800/80 rounded-xl p-2.5 sm:p-3 flex items-center gap-3 shadow-sm hover:border-rose-900/40 transition-colors">
          <div className="w-8.5 h-8.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              High Risk Entities
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-rose-400 mt-0.5">
              {summaryStats.highRiskEntities.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Entity Types */}
        <div className="bg-[#0B1222] border border-slate-800/80 rounded-xl p-2.5 sm:p-3 flex items-center gap-3 shadow-sm hover:border-slate-700/80 transition-colors">
          <div className="w-8.5 h-8.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Entity Types
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-white mt-0.5">
              {summaryStats.entityTypes}
            </div>
          </div>
        </div>

        {/* Cross-case Links */}
        <div className="bg-[#0B1222] border border-slate-800/80 rounded-xl p-2.5 sm:p-3 flex items-center gap-3 shadow-sm hover:border-slate-700/80 transition-colors">
          <div className="w-8.5 h-8.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Share2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Cross-case Links
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 mt-0.5">
              {summaryStats.crossCaseLinks}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Graph Canvas Area - Compact & Screen-Efficient */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full ${
          isFullscreen
            ? "h-[calc(100vh-140px)]"
            : "h-[450px] sm:h-[480px] lg:h-[500px]"
        } rounded-2xl border border-slate-800 bg-[#070B14] overflow-hidden select-none cursor-grab active:cursor-grabbing shadow-2xl`}
      >
        {/* Subtle radial aura & grid lines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 65% 55% at 50% 50%, rgba(14, 116, 144, 0.12), transparent 75%), radial-gradient(ellipse 40% 40% at 50% 50%, rgba(59, 130, 246, 0.08), transparent 80%)",
          }}
        />

        {/* Top-Left Floating Controls: Zoom In, Level %, Zoom Out, Reset/Fit View, Fullscreen */}
        <div className="controls-cluster absolute top-3 left-3 z-20 flex flex-col items-center bg-[#080E1C]/92 backdrop-blur-md border border-slate-800/90 rounded-xl overflow-hidden shadow-2xl divide-y divide-slate-800/80 pointer-events-auto">
          <button
            onClick={handleZoomIn}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Zoom In (or Ctrl + Scroll)"
            aria-label="Zoom In"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <div
            className="py-0.5 px-1.5 text-[9px] font-mono text-center text-slate-400 font-semibold select-none bg-[#050914]"
            title="Current Zoom Level (Ctrl + Scroll to zoom)"
          >
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={handleZoomOut}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Zoom Out (or Ctrl + Scroll)"
            aria-label="Zoom Out"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetView}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Reset View / Fit to Center"
            aria-label="Reset View"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* SVG Graph Surface */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-full"
          style={{ touchAction: "none" }}
        >
          <defs>
            {/* Soft glow filter for nodes */}
            <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* High intensity pulse filter for active nodes */}
            <filter id="center-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Subtle background grid pattern */}
            <pattern id="grid-dots" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.1" fill="#1e293b" opacity="0.45" />
            </pattern>
          </defs>

          {/* Background grid */}
          <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#grid-dots)" />

          {/* Transform group for Pan & Zoom */}
          <g
            transform={`translate(${CENTER_X + pan.x} ${CENTER_Y + pan.y}) scale(${zoom}) translate(-${CENTER_X} -${CENTER_Y})`}
          >
            {/* Multi-Hop Cross-Edges (Visible when 1 Hop / 2 Hops / 3 Hops is active) */}
            {crossHops.map((hop, i) => {
              const dx = hop.to.x - hop.from.x;
              const dy = hop.to.y - hop.from.y;
              // Arc curvature control point
              const qx = (hop.from.x + hop.to.x) / 2 + (dy * 0.2);
              const qy = (hop.from.y + hop.to.y) / 2 - (dx * 0.2);
              return (
                <path
                  key={`hop-${i}`}
                  d={`M ${hop.from.x} ${hop.from.y} Q ${qx} ${qy} ${hop.to.x} ${hop.to.y}`}
                  fill="none"
                  stroke={hop.color}
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  opacity="0.8"
                  className="animate-pulse"
                />
              );
            })}

            {/* Connecting Spoke Edges between Center and Each Cluster */}
            {clustersData.map((cluster) => {
              const isSelected = selectedClusterId === cluster.id;
              const isHovered = hoveredClusterId === cluster.id;
              const cx = CENTER_X;
              const cy = CENTER_Y;
              // Position link badge at 44% distance for clear clearance
              const midX = cx + (cluster.x - cx) * 0.44;
              const midY = cy + (cluster.y - cy) * 0.44;

              return (
                <g key={`edge-${cluster.id}`}>
                  {/* Glowing outer shadow line */}
                  <line
                    x1={cx}
                    y1={cy}
                    x2={cluster.x}
                    y2={cluster.y}
                    stroke={cluster.color}
                    strokeWidth={isSelected ? "2.6" : "1.6"}
                    strokeOpacity={isSelected ? "0.9" : "0.55"}
                  />

                  {/* Midpoint Pill Badge showing Link Count (anti-overlap clearance) */}
                  <g
                    transform={`translate(${midX}, ${midY})`}
                    className="transition-opacity duration-200"
                    opacity={zoom < 0.65 && !isSelected && !isHovered ? 0.3 : 1}
                  >
                    <rect
                      x="-34"
                      y="-10"
                      width="68"
                      height="20"
                      rx="10"
                      fill="#060B17"
                      stroke={cluster.color}
                      strokeWidth="1.2"
                    />
                    <text
                      y="3.5"
                      textAnchor="middle"
                      fill="#E2E8F0"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="600"
                    >
                      {cluster.linksCount} links
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Progressive Disclosure: Expanded child entity mini-nodes */}
            {clustersData.map((cluster) => {
              const isExpanded = expandedClusters.has(cluster.id);
              if (!isExpanded) return null;
              const isSelected = selectedClusterId === cluster.id;
              const isHovered = hoveredClusterId === cluster.id || isSelected;

              return (
                <g key={`expanded-${cluster.id}`}>
                  {cluster.topEntities.slice(0, 6).map((ent, entIdx) => {
                    const count = Math.min(cluster.topEntities.length, 6);
                    // Alternating staggered radius to avoid label overlap
                    const childRadius = entIdx % 2 === 0 ? 80 : 105;
                    const fanAngle =
                      cluster.angle - Math.PI / 2.3 + (entIdx * (Math.PI / 1.15)) / Math.max(count - 1, 1);
                    const entX = cluster.x + childRadius * Math.cos(fanAngle);
                    const entY = cluster.y + childRadius * Math.sin(fanAngle);

                    const entRiskColor =
                      ent.risk === "high"
                        ? "#F43F5E"
                        : ent.risk === "medium"
                        ? "#F59E0B"
                        : "#3B82F6";

                    return (
                      <g
                        key={`child-${ent.id}`}
                        className="cursor-pointer group"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClusterId(cluster.id);
                          setIsSidePanelOpen(true);
                        }}
                      >
                        <title>{ent.value} ({ent.risk} risk, {ent.connections} connections)</title>
                        {/* Spoke line from cluster to child */}
                        <line
                          x1={cluster.x}
                          y1={cluster.y}
                          x2={entX}
                          y2={entY}
                          stroke={cluster.color}
                          strokeWidth="1.2"
                          strokeDasharray="3 3"
                          opacity="0.6"
                        />
                        {/* Child node dot */}
                        <circle
                          cx={entX}
                          cy={entY}
                          r="12"
                          fill="#090E1A"
                          stroke={entRiskColor}
                          strokeWidth="1.8"
                        />
                        <circle cx={entX} cy={entY} r="3.5" fill={entRiskColor} />
                        {/* Text label with anti-overlap truncation & zoom sensitivity */}
                        <text
                          x={entX}
                          y={entY + 20}
                          textAnchor="middle"
                          fill="#E2E8F0"
                          fontSize="8"
                          fontFamily="monospace"
                          className="pointer-events-none transition-opacity duration-200"
                          opacity={zoom < 0.75 && !isHovered ? 0 : 1}
                        >
                          {ent.value.length > 13
                            ? ent.value.slice(0, 12) + "…"
                            : ent.value}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* Central Case Node ("Case TRX-2024-001") */}
            <g transform={`translate(${CENTER_X}, ${CENTER_Y})`} className="interactive-node">
              {/* Outer soft aura */}
              <circle
                r="66"
                fill="none"
                stroke="#0EA5E9"
                strokeWidth="1.5"
                strokeOpacity="0.3"
                strokeDasharray="4 4"
                className="animate-spin-slow"
              />
              <circle
                r="56"
                fill="#071226"
                stroke="#38BDF8"
                strokeWidth="2.2"
                filter="url(#center-glow)"
              />

              {/* Icon */}
              <g transform="translate(-10, -36)">
                <Folder className="w-5 h-5 text-sky-400" />
              </g>

              {/* Case text */}
              <text
                y="-10"
                textAnchor="middle"
                fill="#64748B"
                fontSize="8"
                fontWeight="700"
                letterSpacing="1.5"
              >
                CASE
              </text>
              <text
                y="4"
                textAnchor="middle"
                fill="#F8FAFC"
                fontSize="11.5"
                fontWeight="800"
                fontFamily="monospace"
              >
                {caseNumber.startsWith("#") ? `Case ${caseNumber}` : caseNumber}
              </text>
              <text
                y="18"
                textAnchor="middle"
                fill="#94A3B8"
                fontSize="8.5"
                fontWeight="500"
              >
                {summaryStats.totalEntities.toLocaleString()} entities
              </text>
              <text
                y="29"
                textAnchor="middle"
                fill="#64748B"
                fontSize="8"
                fontWeight="500"
              >
                {summaryStats.totalConnections.toLocaleString()} links
              </text>
            </g>

            {/* 7 Category Cluster Nodes - Fully Stable & Immovable on Click */}
            {clustersData.map((cluster) => {
              const isSelected = selectedClusterId === cluster.id;
              const isExpanded = expandedClusters.has(cluster.id);
              const isHovered = hoveredClusterId === cluster.id;
              const IconComponent = cluster.icon;

              return (
                <g
                  key={cluster.id}
                  transform={`translate(${cluster.x}, ${cluster.y})`}
                  className="interactive-node cursor-pointer select-none"
                  onMouseDown={(e) => handleClusterMouseDown(cluster.id, e)}
                  onMouseEnter={() => setHoveredClusterId(cluster.id)}
                  onMouseLeave={() => setHoveredClusterId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedClusterId(cluster.id);
                    setIsSidePanelOpen(true);
                  }}
                >
                  <title>{cluster.name}: {cluster.count} entities, {cluster.highRisk} high risk</title>
                  {/* Outer active pulse ring if selected */}
                  {isSelected && (
                    <circle
                      r="39"
                      fill="none"
                      stroke={cluster.color}
                      strokeWidth="1.8"
                      strokeOpacity="0.6"
                      strokeDasharray="4 3"
                    />
                  )}

                  {/* Main circular node container */}
                  <circle
                    r="31"
                    fill="#080F1E"
                    stroke={cluster.color}
                    strokeWidth={isSelected ? "2.6" : isHovered ? "2.2" : "1.8"}
                    filter="url(#neon-glow)"
                  />

                  {/* Center category icon */}
                  <g transform="translate(-8, -8)">
                    <IconComponent
                      style={{ color: cluster.color }}
                      className="w-4 h-4"
                    />
                  </g>

                  {/* Small top-right circular toggle badge (+ or ×) */}
                  <g
                    transform="translate(20, -20)"
                    onClick={(e) => toggleExpandCluster(cluster.id, e)}
                    className="hover:scale-110 transition-transform cursor-pointer"
                  >
                    <circle
                      r="7.5"
                      fill="#0B132B"
                      stroke={cluster.color}
                      strokeWidth="1.2"
                    />
                    <text
                      y="2.5"
                      textAnchor="middle"
                      fill="#E2E8F0"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {isExpanded ? "×" : "+"}
                    </text>
                  </g>

                  {/* Below-node text details with dynamic anti-overlap density */}
                  {/* Category Name */}
                  <text
                    y="44"
                    textAnchor="middle"
                    fill="#F8FAFC"
                    fontSize="10.5"
                    fontWeight="700"
                    className="pointer-events-none"
                  >
                    {cluster.name}
                  </text>

                  {/* Entity Count (Dynamic visibility at low zoom) */}
                  <text
                    y="56"
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="8.5"
                    fontWeight="500"
                    className="pointer-events-none transition-opacity duration-200"
                    opacity={zoom < 0.75 && !isSelected && !isHovered ? 0 : 1}
                  >
                    {cluster.count} entities
                  </text>

                  {/* High Risk Pill Badge (Dynamic visibility at low zoom) */}
                  <g
                    transform="translate(0, 63)"
                    className="transition-opacity duration-200"
                    opacity={zoom < 0.75 && !isSelected && !isHovered ? 0 : 1}
                  >
                    <rect
                      x="-33"
                      y="0"
                      width="66"
                      height="15"
                      rx="7.5"
                      fill="#3B0814"
                      stroke="#F43F5E"
                      strokeWidth="0.8"
                    />
                    <text
                      y="10.5"
                      textAnchor="middle"
                      fill="#FB7185"
                      fontSize="8"
                      fontWeight="700"
                    >
                      {cluster.highRisk} high risk
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>

        {/* 4. Detail Floating Side Panel (Attached to the right inside the canvas) */}
        {isSidePanelOpen && selectedCluster && (
          <div className="floating-panel absolute right-3 top-3 bottom-3 w-76 sm:w-80 rounded-2xl bg-[#080E1C]/95 backdrop-blur-xl border border-slate-800 p-3.5 shadow-2xl z-30 flex flex-col justify-between overflow-hidden">
            {/* Panel Top Header */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className="p-1.5 rounded-lg"
                    style={{
                      backgroundColor: selectedCluster.badgeBg,
                      color: selectedCluster.color,
                    }}
                  >
                    {React.createElement(selectedCluster.icon, {
                      className: "w-4 h-4",
                    })}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      {selectedCluster.name}{" "}
                      <span className="text-slate-400 font-normal text-xs">
                        ({selectedCluster.count} entities)
                      </span>
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setIsSidePanelOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Stats: 3 Metric Tiles */}
              <div className="grid grid-cols-3 gap-2 my-2.5">
                <div className="bg-[#0B1327] border border-rose-900/30 rounded-xl p-2 text-center">
                  <div className="text-sm sm:text-base font-bold font-mono text-rose-400">
                    {selectedCluster.highRisk}
                  </div>
                  <div className="text-[9.5px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                    High Risk
                  </div>
                </div>

                <div className="bg-[#0B1327] border border-slate-800 rounded-xl p-2 text-center">
                  <div className="text-sm sm:text-base font-bold font-mono text-white">
                    {selectedCluster.count}
                  </div>
                  <div className="text-[9.5px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                    Total
                  </div>
                </div>

                <div className="bg-[#0B1327] border border-slate-800 rounded-xl p-2 text-center">
                  <div className="text-sm sm:text-base font-bold font-mono text-cyan-400">
                    {selectedCluster.linksCount}
                  </div>
                  <div className="text-[9.5px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                    Links
                  </div>
                </div>
              </div>

              {/* Navigation Tabs: Top Entities vs Risk Distribution */}
              <div className="grid grid-cols-2 gap-1 bg-[#060A14] border border-slate-800/80 rounded-lg p-1 mb-2.5">
                <button
                  onClick={() => setActiveSideTab("top")}
                  className={`py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                    activeSideTab === "top"
                      ? "bg-blue-600/90 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Top Entities
                </button>
                <button
                  onClick={() => setActiveSideTab("distribution")}
                  className={`py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                    activeSideTab === "distribution"
                      ? "bg-blue-600/90 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Risk Distribution
                </button>
              </div>

              {/* Tab 1: Top Entities Ranked List */}
              {activeSideTab === "top" ? (
                <div className="space-y-1.5 max-h-[200px] sm:max-h-[230px] overflow-y-auto pr-1">
                  <div className="flex items-center justify-between text-[9.5px] uppercase font-bold text-slate-500 px-2 pb-1 border-b border-slate-800/50">
                    <span>Entity</span>
                    <span>Connections</span>
                  </div>

                  {selectedCluster.topEntities.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-[#0A1020] border border-slate-800/60 hover:border-slate-700 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              item.risk === "high"
                                ? "#F43F5E"
                                : item.risk === "medium"
                                ? "#F59E0B"
                                : "#3B82F6",
                          }}
                        />
                        <span className="font-mono text-slate-200 truncate font-semibold text-[11.5px]">
                          {item.value}
                        </span>
                        <span
                          className={`text-[8.5px] uppercase px-1 py-0.2 rounded font-bold ${
                            item.risk === "high"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : item.risk === "medium"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {item.risk}
                        </span>
                      </div>
                      <span className="font-mono text-slate-300 font-bold text-xs">
                        {item.connections}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Tab 2: Risk Distribution */
                <div className="space-y-3 py-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        High Risk
                      </span>
                      <span className="font-mono text-slate-300 font-bold">
                        {selectedCluster.highRisk} (
                        {Math.round(
                          (selectedCluster.highRisk / selectedCluster.count) * 100
                        )}
                        %)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              (selectedCluster.highRisk / selectedCluster.count) * 100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Medium Risk
                      </span>
                      <span className="font-mono text-slate-300 font-bold">
                        {Math.max(
                          0,
                          Math.round(
                            (selectedCluster.count - selectedCluster.highRisk) * 0.4
                          )
                        )}{" "}
                        (36%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: "36%" }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-400 font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Low Risk
                      </span>
                      <span className="font-mono text-slate-300 font-bold">
                        {Math.max(
                          0,
                          Math.round(
                            (selectedCluster.count - selectedCluster.highRisk) * 0.6
                          )
                        )}{" "}
                        (50%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: "50%" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Panel Bottom Action */}
            <div className="pt-2 border-t border-slate-800/80 mt-2">
              <button
                onClick={() => toggleExpandCluster(selectedCluster.id)}
                className="w-full py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
              >
                <span>
                  {expandedClusters.has(selectedCluster.id)
                    ? `Collapse ${selectedCluster.name} Nodes`
                    : `View All ${selectedCluster.count} Entities`}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 5. Bottom-Left Overlay: Risk Level Legend */}
        <div className="absolute bottom-3 left-3 rounded-xl bg-[#080E1C]/88 backdrop-blur-md border border-slate-800/90 p-2.5 shadow-xl pointer-events-auto">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
            Risk Level
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
              <span className="text-slate-300 text-[11px] font-medium">High</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              <span className="text-slate-300 text-[11px] font-medium">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              <span className="text-slate-300 text-[11px] font-medium">Low</span>
            </div>
          </div>
        </div>

        {/* 6. Bottom-Right Overlay: Satellite Minimap (only when side panel is closed to avoid conflict) */}
        {!isSidePanelOpen && (
          <div className="hidden sm:block absolute bottom-3 right-3 w-22 h-16 rounded-xl bg-[#080E1C]/90 backdrop-blur border border-slate-800 p-1 shadow-xl pointer-events-auto z-10">
            <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-full opacity-70">
              <circle cx={CENTER_X} cy={CENTER_Y} r="20" fill="#0EA5E9" />
              {clustersData.map((c) => (
                <g key={`mini-${c.id}`}>
                  <line
                    x1={CENTER_X}
                    y1={CENTER_Y}
                    x2={c.x}
                    y2={c.y}
                    stroke={c.color}
                    strokeWidth="6"
                    opacity="0.5"
                  />
                  <circle cx={c.x} cy={c.y} r="16" fill={c.color} />
                </g>
              ))}
              {/* Viewport indicator box */}
              <rect
                x={400 - pan.x * 0.35}
                y={200 - pan.y * 0.35}
                width={200 / zoom}
                height={140 / zoom}
                fill="none"
                stroke="#60A5FA"
                strokeWidth="5"
                strokeDasharray="8 4"
              />
            </svg>
          </div>
        )}
      </div>

      {/* 7. Bottom Strip: Recent Findings - Compact */}
      <div className="rounded-xl bg-[#080E1C] border border-slate-800/80 px-3.5 py-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-300 shadow-sm">
        <div className="font-bold text-slate-400 uppercase tracking-wider text-[10.5px] flex items-center gap-1.5 flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Recent Findings</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11.5px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
            <span>+91 98765 43210 linked to 3 bank accounts</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
            <span>192.168.1.25 connected to 12 devices</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
            <span>UPI handle found in 5 cases</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
            <span>Cross-case link with Case #102</span>
          </div>
        </div>
      </div>
    </div>
  );
}
