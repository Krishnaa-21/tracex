"""
Generates the revised, ultra-clean, high-contrast, professional 9-slide presentation
for EPINOIA 2026 (Atharv Ranbhoomi, IIM Indore).
Adheres strictly to the 9-slide narrative:
Slide 1: Cover / Project Hook
Slide 2: The Challenge (Problem)
Slide 3: Our Solution (TraceX)
Slide 4: How It Works (Simple Linear Pipeline)
Slide 5: Key Implemented Features (Top 4 Features, High Spacing)
Slide 6: Technology & Simple Architecture
Slide 7: Innovation + Real-World Impact
Slide 8: Team Members (Dedicated, Clean 4-Member Grid)
Slide 9: Demo / Video & Closing (Dedicated Live Links & Walkthrough Summary)
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # --- High-Contrast Professional Palette ---
    BG_COLOR = RGBColor(10, 15, 29)         # #0A0F1D Deep Midnight Blue
    CARD_BG = RGBColor(18, 28, 47)          # #121C2F Clean Dark Slate Surface
    CARD_BORDER = RGBColor(40, 58, 90)      # #283A5A Clean Visible Border
    CYAN = RGBColor(0, 212, 255)            # #00D4FF Electric Cyan (Brand Accent)
    CYAN_LIGHT = RGBColor(125, 227, 255)    # #7DE3FF High contrast cyan
    EMERALD = RGBColor(16, 185, 129)        # #10B981 Success / Low Risk
    CORAL = RGBColor(244, 63, 94)           # #F43F5E High Risk / Problem
    AMBER = RGBColor(245, 158, 11)          # #F59E0B Warning / Metric
    PURPLE = RGBColor(147, 156, 250)        # #939CFA Syndicate Link
    WHITE = RGBColor(255, 255, 255)         # #FFFFFF Pure White (Headings & Key Text)
    TEXT_LIGHT = RGBColor(218, 228, 240)    # #DAE4F0 High-contrast body text (readable)
    TEXT_MUTED = RGBColor(148, 163, 184)    # #94A3B8 Secondary labels

    assets_dir = os.path.join(os.path.dirname(__file__), "assets")
    atharv_logo_path = os.path.join(assets_dir, "atharv_ranbhoomi_logo.png")
    tracex_logo_path = os.path.join(assets_dir, "tracex_logo.png")

    def apply_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_COLOR
        bg.line.fill.background()
        return bg

    def add_header(slide, category_tag, main_title, slide_num):
        # Category Tag
        tag_box = slide.shapes.add_textbox(Inches(0.9), Inches(0.45), Inches(8.5), Inches(0.3))
        tf_tag = tag_box.text_frame
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = category_tag.upper()
        p_tag.font.size = Pt(10)
        p_tag.font.bold = True
        p_tag.font.color.rgb = CYAN
        p_tag.font.name = "Arial"

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.9), Inches(0.72), Inches(9.5), Inches(0.6))
        tf_title = title_box.text_frame
        p_title = tf_title.paragraphs[0]
        p_title.text = main_title
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = WHITE
        p_title.font.name = "Arial"

        # Slide Number & Event
        num_box = slide.shapes.add_textbox(Inches(10.0), Inches(0.45), Inches(2.4), Inches(0.4))
        tf_num = num_box.text_frame
        p_num = tf_num.paragraphs[0]
        p_num.alignment = PP_ALIGN.RIGHT
        p_num.text = f"EPINOIA '26  •  {slide_num}"
        p_num.font.size = Pt(10)
        p_num.font.bold = True
        p_num.font.color.rgb = TEXT_MUTED
        p_num.font.name = "Arial"

    def add_card(slide, left, top, width, height, bg_rgb=CARD_BG, border_rgb=CARD_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_rgb
        card.line.color.rgb = border_rgb
        card.line.width = Pt(1.2)
        return card

    # =========================================================================
    # SLIDE 1: COVER / HOOK (Clean, uncluttered, focused)
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    apply_background(s1)

    # Event Badge
    badge = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.9), Inches(0.9), Inches(6.8), Inches(0.4))
    badge.fill.solid()
    badge.fill.fore_color.rgb = RGBColor(16, 32, 58)
    badge.line.color.rgb = CYAN
    badge.line.width = Pt(1)
    tf_b = badge.text_frame
    p_b = tf_b.paragraphs[0]
    p_b.text = "EPINOIA 2026  •  FLAGSHIP HACKATHON  •  ATHARV RANBHOOMI, IIM INDORE"
    p_b.font.size = Pt(9.5)
    p_b.font.bold = True
    p_b.font.color.rgb = CYAN
    p_b.alignment = PP_ALIGN.CENTER

    # Project Title
    t_box = s1.shapes.add_textbox(Inches(0.9), Inches(1.6), Inches(8.0), Inches(1.2))
    tf_t = t_box.text_frame
    p_t = tf_t.paragraphs[0]
    p_t.text = "TraceX"
    p_t.font.size = Pt(56)
    p_t.font.bold = True
    p_t.font.color.rgb = WHITE
    p_t.font.name = "Arial"

    # Subtitle
    sub_box = s1.shapes.add_textbox(Inches(0.9), Inches(2.7), Inches(8.0), Inches(0.6))
    tf_sub = sub_box.text_frame
    p_sub = tf_sub.paragraphs[0]
    p_sub.text = "AI-Powered Cyber Fraud Intelligence & Correlation Console"
    p_sub.font.size = Pt(18)
    p_sub.font.bold = True
    p_sub.font.color.rgb = CYAN_LIGHT
    p_sub.font.name = "Arial"

    # One-Line Hook
    hook_box = s1.shapes.add_textbox(Inches(0.9), Inches(3.35), Inches(7.8), Inches(1.2))
    tf_hook = hook_box.text_frame
    tf_hook.word_wrap = True
    p_hook = tf_hook.paragraphs[0]
    p_hook.text = (
        "Empowering police investigating officers to connect disparate telecom, banking, "
        "and digital evidence within minutes—stopping illicit fund transfers during the critical Golden Hour."
    )
    p_hook.font.size = Pt(12.5)
    p_hook.font.color.rgb = TEXT_LIGHT
    p_hook.font.name = "Arial"

    # Atharv Ranbhoomi Logo Card on the Right
    logo_card = add_card(s1, Inches(9.2), Inches(1.3), Inches(3.2), Inches(3.8), bg_rgb=RGBColor(15, 23, 42))
    if os.path.exists(atharv_logo_path):
        s1.shapes.add_picture(atharv_logo_path, Inches(9.55), Inches(1.5), Inches(2.5), Inches(2.5))
    
    lbl_box = s1.shapes.add_textbox(Inches(9.2), Inches(4.1), Inches(3.2), Inches(0.8))
    tf_lbl = lbl_box.text_frame
    p_l1 = tf_lbl.paragraphs[0]
    p_l1.alignment = PP_ALIGN.CENTER
    p_l1.text = "Atharv Ranbhoomi '26"
    p_l1.font.size = Pt(13)
    p_l1.font.bold = True
    p_l1.font.color.rgb = WHITE
    p_l2 = tf_lbl.add_paragraph()
    p_l2.alignment = PP_ALIGN.CENTER
    p_l2.text = "IIM Indore  •  Round 1 Qualifier"
    p_l2.font.size = Pt(10)
    p_l2.font.color.rgb = CYAN

    # Bottom Banner: Team Attribution & Tagline
    bot_card = add_card(s1, Inches(0.9), Inches(5.5), Inches(11.5), Inches(1.3))
    tb_bot = s1.shapes.add_textbox(Inches(1.1), Inches(5.6), Inches(11.1), Inches(1.1))
    tf_bot = tb_bot.text_frame
    tf_bot.word_wrap = True
    p_b1 = tf_bot.paragraphs[0]
    p_b1.text = "PRESENTED BY TEAM THUNDERBYTES  •  SHRI VAISHNAV VIDYAPEETH VISHWAVIDYALAYA (SVVV), INDORE"
    p_b1.font.size = Pt(11)
    p_b1.font.bold = True
    p_b1.font.color.rgb = CYAN
    p_b2 = tf_bot.add_paragraph()
    p_b2.text = "Ankit Tank (Leader)  |  Krishna Prajapat (Architect)  |  Avnish Sharma (Backend)  |  Tarun Pandya (Forensics)"
    p_b2.font.size = Pt(10.5)
    p_b2.font.color.rgb = TEXT_LIGHT

    s1.notes_slide.notes_text_frame.text = (
        "Good day judges. We are Team Thunderbytes presenting TraceX for EPINOIA at Atharv Ranbhoomi, IIM Indore. "
        "TraceX is a digital cyber intelligence operations room engineered for law enforcement to cut evidence correlation "
        "time from 48 hours to under 3 minutes during the critical Golden Hour."
    )

    # =========================================================================
    # SLIDE 2: THE PROBLEM (Clear, high-contrast, non-overlapping)
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    apply_background(s2)
    add_header(s2, "The Real-World Challenge", "Why Investigating Cyber Fraud Takes Days Instead of Hours", "02 / 09")

    col_w = Inches(3.6)
    gap = Inches(0.4)
    top_y = Inches(1.6)
    h_y = Inches(5.1)

    problem_data = [
        ("1. FRAGMENTED EVIDENCE", CORAL, [
            ("Multi-Vendor Formats", "Officers receive raw Excel sheets from 10+ different banks, plain text CDR/IPDR dumps from telcos, and .eml email logs."),
            ("Manual Spreadsheet Checks", "Investigating Officers spend hours running VLOOKUPs across 10,000+ transaction rows by hand."),
            ("Zero Interoperability", "No standard schema connects cellular tower coordinates, bank transactions, and UPI handles.")
        ]),
        ("2. THE LOST GOLDEN HOUR", AMBER, [
            ("Rapid Fund Layering", "Stolen money is routed through 4 to 6 mule accounts and withdrawn at ATMs within 45 minutes of the crime."),
            ("48-Hour Delay", "Manual spreadsheet analysis takes 24 to 72 hours. By the time links are spotted, accounts are empty."),
            ("Disposable Infrastructure", "Fraudsters quickly abandon burner SIMs and temporary VPAs, leaving cold trails.")
        ]),
        ("3. CROSS-CASE BLIND SPOTS", PURPLE, [
            ("Organized Syndicates", "The same mule account or burner phone is frequently active across 15+ FIRs in multiple districts simultaneously."),
            ("Station-Level Silos", "A police cyber cell in Bhopal has no automated way to know that Indore Police is tracking the exact same IMEI device."),
            ("Officer Burnout", "Hundreds of new complaints flood in daily on the 1930 portal with limited specialized cyber personnel.")
        ])
    ]

    for i, (p_title, p_col, items) in enumerate(problem_data):
        card_x = Inches(0.9) + i * (col_w + gap)
        add_card(s2, card_x, top_y, col_w, h_y)
        
        tb = s2.shapes.add_textbox(card_x + Inches(0.2), top_y + Inches(0.2), col_w - Inches(0.4), h_y - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p_h = tf.paragraphs[0]
        p_h.text = p_title
        p_h.font.size = Pt(13)
        p_h.font.bold = True
        p_h.font.color.rgb = p_col

        for sub_h, sub_d in items:
            p_sub = tf.add_paragraph()
            p_sub.text = f"\n▸ {sub_h}"
            p_sub.font.size = Pt(11)
            p_sub.font.bold = True
            p_sub.font.color.rgb = WHITE

            p_desc = tf.add_paragraph()
            p_desc.text = sub_d
            p_desc.font.size = Pt(10)
            p_desc.font.color.rgb = TEXT_LIGHT

    s2.notes_slide.notes_text_frame.text = (
        "In financial cyber fraud, the first 2 hours are the Golden Hour. When an officer receives a complaint, the evidence is "
        "scattered across Excel sheets from multiple banks and raw CDR logs. Sifting through them manually takes days, by which time "
        "fraudsters have already withdrawn the money. Isolated police stations also cannot see cross-district syndicates."
    )

    # =========================================================================
    # SLIDE 3: OUR SOLUTION (Clean value proposition)
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    apply_background(s3)
    add_header(s3, "Our Solution", "TraceX: A Unified Operations Console for Law Enforcement", "03 / 09")

    # Left Column: The 2 Core Innovations
    left_w = Inches(6.8)
    top_3 = Inches(1.6)

    # Box 1
    add_card(s3, Inches(0.9), top_3, left_w, Inches(2.4))
    tb_sol1 = s3.shapes.add_textbox(Inches(1.15), top_3 + Inches(0.2), left_w - Inches(0.5), Inches(2.0))
    tf_sol1 = tb_sol1.text_frame
    tf_sol1.word_wrap = True
    p_s1_t = tf_sol1.paragraphs[0]
    p_s1_t.text = "1. INGESTION TO CORRELATION IN MINUTES"
    p_s1_t.font.size = Pt(13)
    p_s1_t.font.bold = True
    p_s1_t.font.color.rgb = CYAN
    p_s1_d = tf_sol1.add_paragraph()
    p_s1_d.text = (
        "\nTraceX ingests messy, real-world evidence—CDRs, bank account sheets, UPI logs, IPDR dumps, "
        "and email headers. Our automated normalization pipeline standardizes and links all entities "
        "on an interactive visual graph in seconds."
    )
    p_s1_d.font.size = Pt(11)
    p_s1_d.font.color.rgb = TEXT_LIGHT

    # Box 2
    add_card(s3, Inches(0.9), top_3 + Inches(2.7), left_w, Inches(2.4))
    tb_sol2 = s3.shapes.add_textbox(Inches(1.15), top_3 + Inches(2.9), left_w - Inches(0.5), Inches(2.0))
    tf_sol2 = tb_sol2.text_frame
    tf_sol2.word_wrap = True
    p_s2_t = tf_sol2.paragraphs[0]
    p_s2_t.text = "2. GROUNDED AI & STATUTORY FREEZE DIRECTIVES"
    p_s2_t.font.size = Pt(13)
    p_s2_t.font.bold = True
    p_s2_t.font.color.rgb = EMERALD
    p_s2_d = tf_sol2.add_paragraph()
    p_s2_d.text = (
        "\nCombines an evidence-grounded AI Co-pilot with automated PDF generators that produce "
        "court-ready Section 91 CrPC Bank Debit-Freeze notices and Section 69A IT Act Emergency Takedowns "
        "with tamper-evident SHA-256 cryptographic verification."
    )
    p_s2_d.font.size = Pt(11)
    p_s2_d.font.color.rgb = TEXT_LIGHT

    # Right Column: Key Metrics Card
    right_w = Inches(4.3)
    right_x = Inches(8.1)
    add_card(s3, right_x, top_3, right_w, Inches(5.1), bg_rgb=RGBColor(14, 23, 40))

    tb_sol3 = s3.shapes.add_textbox(right_x + Inches(0.25), top_3 + Inches(0.25), right_w - Inches(0.5), Inches(4.6))
    tf_sol3 = tb_sol3.text_frame
    tf_sol3.word_wrap = True
    p_m_head = tf_sol3.paragraphs[0]
    p_m_head.text = "OPERATIONAL IMPACT"
    p_m_head.font.size = Pt(13)
    p_m_head.font.bold = True
    p_m_head.font.color.rgb = WHITE

    sol_metrics = [
        ("From 48h to 3m", "Case triage and entity correlation accelerated by 95% within the Golden Hour."),
        ("100% Schema Agnostic", "Parses telecom and banking files without requiring departments to change formats."),
        ("Cross-Case Alerts", "Instantly highlights when a suspect account is tied to multiple police FIRs."),
        ("Dual Operational UX", "Tactical Dark Mode for cyber analysts + Formal Government Skin for court documentation.")
    ]
    for m_title, m_desc in sol_metrics:
        p_mt = tf_sol3.add_paragraph()
        p_mt.text = f"\n▸ {m_title}"
        p_mt.font.size = Pt(11)
        p_mt.font.bold = True
        p_mt.font.color.rgb = CYAN_LIGHT
        p_md = tf_sol3.add_paragraph()
        p_md.text = m_desc
        p_md.font.size = Pt(10)
        p_md.font.color.rgb = TEXT_LIGHT

    s3.notes_slide.notes_text_frame.text = (
        "TraceX replaces manual spreadsheets with a single, intelligent operations console. It extracts entities automatically, "
        "builds a multi-hop correlation graph, calculates threat scores, and generates legal freeze directives in under three minutes."
    )

    # =========================================================================
    # SLIDE 4: HOW IT WORKS (Simple, Linear, 5-Second Diagram)
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    apply_background(s4)
    add_header(s4, "System Workflow", "How TraceX Works: A Simple 4-Step Pipeline", "04 / 09")

    # 4 Clean Horizontal Step Cards
    step_w = Inches(2.65)
    step_gap = Inches(0.3)
    step_top = Inches(1.6)
    step_h = Inches(5.1)

    steps = [
        ("01", "INGESTION & ETL", CYAN, [
            ("Raw File Upload", "Drop in CDR, Bank Excel sheets, UPI transaction dumps, and .eml logs."),
            ("Sanitization", "Standardizes phone numbers (E.164), UPI handles, and bank account numbers."),
            ("Evidence Seal", "Indexes files with cryptographic SHA-256 integrity hashes.")
        ]),
        ("02", "CORRELATION", PURPLE, [
            ("Entity Extraction", "Isolates Phones, Accounts, VPAs, IPs, IMEIs, and Domains."),
            ("Multi-Hop Graph", "NetworkX builds 1st, 2nd, and 3rd-degree relationship chains."),
            ("Syndicate Match", "Auto-flags entities shared across multiple police cases.")
        ]),
        ("03", "RISK SCORING", CORAL, [
            ("Fraud Profiles", "Rules calibrated for UPI scams, investment fraud, and sextortion."),
            ("Velocity Indicators", "Detects rapid fund transfers across multiple mule layers."),
            ("Composite Score", "Produces an intuitive 0–100 threat severity rating.")
        ]),
        ("04", "ACTION & OUTPUT", EMERALD, [
            ("Interactive Graph", "Force-directed visual workspace with category filters."),
            ("Legal Directives", "One-click generation of Section 91 CrPC Bank Freeze orders."),
            ("AI Assistant", "Grounded Co-pilot answers case queries with offline fallback.")
        ])
    ]

    for idx, (num_str, s_title, col_rgb, items) in enumerate(steps):
        s_left = Inches(0.9) + idx * (step_w + step_gap)
        add_card(s4, s_left, step_top, step_w, step_h)

        tb = s4.shapes.add_textbox(s_left + Inches(0.18), step_top + Inches(0.2), step_w - Inches(0.36), step_h - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p_num = tf.paragraphs[0]
        p_num.text = f"STEP {num_str}"
        p_num.font.size = Pt(10)
        p_num.font.bold = True
        p_num.font.color.rgb = col_rgb

        p_st = tf.add_paragraph()
        p_st.text = s_title
        p_st.font.size = Pt(12)
        p_st.font.bold = True
        p_st.font.color.rgb = WHITE

        for bullet_t, bullet_d in items:
            p_bt = tf.add_paragraph()
            p_bt.text = f"\n▸ {bullet_t}"
            p_bt.font.size = Pt(10.5)
            p_bt.font.bold = True
            p_bt.font.color.rgb = CYAN_LIGHT

            p_bd = tf.add_paragraph()
            p_bd.text = bullet_d
            p_bd.font.size = Pt(9.5)
            p_bd.font.color.rgb = TEXT_LIGHT

    s4.notes_slide.notes_text_frame.text = (
        "Here is the simple, logical flow. First, raw telecom and bank files are uploaded and standardized. Second, our NetworkX "
        "engine builds an entity correlation graph. Third, multi-factor risk heuristics score the severity. Finally, the officer "
        "interacts with the visual graph and exports court-admissible legal orders."
    )

    # =========================================================================
    # SLIDE 5: KEY IMPLEMENTED FEATURES (Top 4, Generous Spacing)
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    apply_background(s5)
    add_header(s5, "Implemented Capabilities", "Core Features Built & Working in GitHub Today", "05 / 09")

    # 4 Big Cards in 2x2 Grid with generous spacing
    card_w2 = Inches(5.6)
    card_h2 = Inches(2.4)
    top_r1 = Inches(1.6)
    top_r2 = Inches(4.3)
    left_c1 = Inches(0.9)
    left_c2 = Inches(6.8)

    feature_cards = [
        (left_c1, top_r1, "1. HETEROGENEOUS EVIDENCE ETL", CYAN, "backend/app/services/ingestion/",
         "Ingests and normalizes real-world CDRs, bank Excel dumps, UPI statements, and .eml email headers into clean entity records without requiring strict schemas."),
        (left_c2, top_r1, "2. CLUSTERED MULTI-HOP GRAPH", PURPLE, "frontend/src/pages/ConnectionsGraph.jsx",
         "Interactive force-directed graph with hub-and-spoke grouping, physics pause, and entity category color coding (phone, bank, UPI, IP, IMEI)."),
        (left_c1, top_r2, "3. SCAM-PROFILE RISK SCORING", CORAL, "backend/app/services/risk/scoring.py",
         "Calculates composite 0–100 threat ratings based on transaction velocity, mule account reuse, burner SIMs, and cross-case linkage confidence."),
        (left_c2, top_r2, "4. STATUTORY FREEZE DIRECTIVES", EMERALD, "backend/app/services/reports/pdf_generator.py",
         "Instant ReportLab vector generation of Section 91 CrPC Bank Debit Freeze notices and Section 69A IT Act Takedown orders with SHA-256 seal.")
    ]

    for l_pos, t_pos, f_title, f_col, f_path, f_desc in feature_cards:
        add_card(s5, l_pos, t_pos, card_w2, card_h2)
        tb = s5.shapes.add_textbox(l_pos + Inches(0.25), t_pos + Inches(0.2), card_w2 - Inches(0.5), card_h2 - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p_ft = tf.paragraphs[0]
        p_ft.text = f_title
        p_ft.font.size = Pt(13)
        p_ft.font.bold = True
        p_ft.font.color.rgb = f_col

        p_mod = tf.add_paragraph()
        p_mod.text = f"Repository Module: {f_path}"
        p_mod.font.size = Pt(9)
        p_mod.font.color.rgb = TEXT_MUTED

        p_fd = tf.add_paragraph()
        p_fd.text = f"\n{f_desc}"
        p_fd.font.size = Pt(10.5)
        p_fd.font.color.rgb = TEXT_LIGHT

    s5.notes_slide.notes_text_frame.text = (
        "Every single feature shown here is completely functional in our repository. We built real ingestion parsers, an interactive "
        "graph visualization, heuristic risk scoring, and automated PDF generators for statutory police orders."
    )

    # =========================================================================
    # SLIDE 6: TECHNOLOGY & SIMPLE ARCHITECTURE
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    apply_background(s6)
    add_header(s6, "Technical Implementation", "Technology Stack & High-Level Architecture", "06 / 09")

    # Left Side: Intuitive Flow Diagram Box
    add_card(s6, Inches(0.9), Inches(1.6), Inches(5.6), Inches(5.1))
    tb_diag = s6.shapes.add_textbox(Inches(1.15), Inches(1.8), Inches(5.1), Inches(4.7))
    tf_diag = tb_diag.text_frame
    tf_diag.word_wrap = True

    p_d_title = tf_diag.paragraphs[0]
    p_d_title.text = "SIMPLE ARCHITECTURAL FLOW"
    p_d_title.font.size = Pt(13)
    p_d_title.font.bold = True
    p_d_title.font.color.rgb = CYAN

    diag_boxes = [
        ("USER INTERFACE (React 18 + Vite SPA)", "Dual UX Cockpit: Tactical Dark Mode + Government Skin"),
        ("↓ REST API (FastAPI + Uvicorn)", "OAuth2 JWT Authentication, Pydantic Data Validation, CORS"),
        ("↓ ANALYTICS ENGINE (NetworkX + Pandas)", "Multi-hop graph builder, E.164 normalization, Risk Heuristics"),
        ("↓ PERSISTENCE & REPORTS (SQLAlchemy + ReportLab)", "Case Database, SHA-256 Hashing, Court-Ready Directives")
    ]
    for layer_h, layer_d in diag_boxes:
        p_lh = tf_diag.add_paragraph()
        p_lh.text = f"\n{layer_h}"
        p_lh.font.size = Pt(11)
        p_lh.font.bold = True
        p_lh.font.color.rgb = WHITE

        p_ld = tf_diag.add_paragraph()
        p_ld.text = layer_d
        p_ld.font.size = Pt(9.5)
        p_ld.font.color.rgb = TEXT_LIGHT

    # Right Side: Clean Tech Stack Cards
    add_card(s6, Inches(6.8), Inches(1.6), Inches(5.6), Inches(5.1))
    tb_stack = s6.shapes.add_textbox(Inches(7.05), Inches(1.8), Inches(5.1), Inches(4.7))
    tf_stack = tb_stack.text_frame
    tf_stack.word_wrap = True

    p_s_head = tf_stack.paragraphs[0]
    p_s_head.text = "ACTUAL GITHUB TECH STACK"
    p_s_head.font.size = Pt(13)
    p_s_head.font.bold = True
    p_s_head.font.color.rgb = EMERALD

    stack_details = [
        ("Frontend", "React 18, Vite 5, Tailwind CSS, React Router v6, Lucide Icons"),
        ("Backend Server", "Python 3.11+, FastAPI (ASGI), Uvicorn High-Concurrency Server"),
        ("Graph & Analytics", "NetworkX (multi-hop graph theory), Pandas, OpenPyXL"),
        ("AI Co-Pilot", "GPT-4o-mini with Grounded RAG + 100% Offline Rule Engine Fallback"),
        ("Document Engine", "ReportLab Vector PDF Generator (with WeasyPrint fallback)"),
        ("Security & Auth", "OAuth2 JWT (HS256), Bcrypt Password Hashing, SHA-256 Verification")
    ]
    for st_cat, st_val in stack_details:
        p_st = tf_stack.add_paragraph()
        p_st.text = f"\n▸ {st_cat}:"
        p_st.font.size = Pt(11)
        p_st.font.bold = True
        p_st.font.color.rgb = CYAN_LIGHT

        p_sv = tf_stack.add_paragraph()
        p_sv.text = st_val
        p_sv.font.size = Pt(10)
        p_sv.font.color.rgb = TEXT_LIGHT

    s6.notes_slide.notes_text_frame.text = (
        "Our architecture follows a clean linear pipeline: React frontend communicates with a FastAPI server, which invokes "
        "NetworkX and Pandas for sub-second correlation, with ReportLab generating tamper-evident PDF dossiers."
    )

    # =========================================================================
    # SLIDE 7: INNOVATION & REAL-WORLD IMPACT
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    apply_background(s7)
    add_header(s7, "Innovation & Impact", "Why TraceX Wins: Operational Reality & Governance Impact", "07 / 09")

    col_w7 = Inches(5.6)
    # Left Column: Key Differentiators
    add_card(s7, Inches(0.9), Inches(1.6), col_w7, Inches(5.1))
    tb_diff = s7.shapes.add_textbox(Inches(1.15), Inches(1.8), col_w7 - Inches(0.5), Inches(4.7))
    tf_diff = tb_diff.text_frame
    tf_diff.word_wrap = True

    p_d_head = tf_diff.paragraphs[0]
    p_d_head.text = "KEY TECHNICAL DIFFERENTIATORS"
    p_d_head.font.size = Pt(13)
    p_d_head.font.bold = True
    p_d_head.font.color.rgb = CYAN

    diff_points = [
        ("Zero-Disruption Police Workflow", "Works natively with the raw Excel and CDR dumps police already receive daily. No proprietary database formatting required."),
        ("Dual-Engine Resilient AI", "Grounded RAG strictly constrained to case evidence + a 100% offline deterministic rule engine fallback for zero courtroom hallucinations."),
        ("Dual Operational UX", "Tactical Dark SOC cockpit for forensic analysts + Minimalist Standard Government skin for senior administrative review.")
    ]
    for d_h, d_b in diff_points:
        p_dh = tf_diff.add_paragraph()
        p_dh.text = f"\n▸ {d_h}"
        p_dh.font.size = Pt(11)
        p_dh.font.bold = True
        p_dh.font.color.rgb = WHITE
        p_db = tf_diff.add_paragraph()
        p_db.text = d_b
        p_db.font.size = Pt(10)
        p_db.font.color.rgb = TEXT_LIGHT

    # Right Column: Measurable Impact
    add_card(s7, Inches(6.8), Inches(1.6), col_w7, Inches(5.1))
    tb_imp7 = s7.shapes.add_textbox(Inches(7.05), Inches(1.8), col_w7 - Inches(0.5), Inches(4.7))
    tf_imp7 = tb_imp7.text_frame
    tf_imp7.word_wrap = True

    p_i_head = tf_imp7.paragraphs[0]
    p_i_head.text = "MEASURABLE REAL-WORLD IMPACT"
    p_i_head.font.size = Pt(13)
    p_i_head.font.bold = True
    p_i_head.font.color.rgb = EMERALD

    impact_points = [
        ("For Investigating Officers", "Cuts evidence parsing and correlation from 48+ hours to under 3 minutes, solving the Golden Hour bottleneck."),
        ("For Cyber Crime Victims", "Freezes destination mule accounts before money is laundered through ATMs, drastically improving recovery rates."),
        ("For Police Leadership & Courts", "Produces court-admissible forensic dossiers sealed with SHA-256 hashes to secure high conviction rates.")
    ]
    for i_h, i_b in impact_points:
        p_ih = tf_imp7.add_paragraph()
        p_ih.text = f"\n▸ {i_h}"
        p_ih.font.size = Pt(11)
        p_ih.font.bold = True
        p_ih.font.color.rgb = WHITE
        p_ib = tf_imp7.add_paragraph()
        p_ib.text = i_b
        p_ib.font.size = Pt(10)
        p_ib.font.color.rgb = TEXT_LIGHT

    s7.notes_slide.notes_text_frame.text = (
        "Unlike generic prototypes, TraceX was built for the ground realities of Indian police work. We don't ask officers to change "
        "their evidence formats. Our AI never hallucinates in court because it is strictly grounded in evidence with offline fallback. "
        "And most importantly, we bridge the gap between intelligence and legal action through automated statutory freeze directives."
    )

    # =========================================================================
    # SLIDE 8: DEDICATED TEAM SLIDE (Clean, spacious, 4 equal cards)
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    apply_background(s8)
    add_header(s8, "Team & Ownership", "Team Thunderbytes • Shri Vaishnav Vidyapeeth Vishwavidyalaya", "08 / 09")

    # 4 Equal Horizontal Cards (or 2x2 Grid) - 2x2 Grid gives the cleanest spacious layout!
    t_card_w = Inches(5.6)
    t_card_h = Inches(2.4)
    t_r1 = Inches(1.6)
    t_r2 = Inches(4.3)
    t_c1 = Inches(0.9)
    t_c2 = Inches(6.8)

    team_members = [
        (t_c1, t_r1, "Ankit Tank", "Team Leader & Product Strategist", "ankittank9977@gmail.com", "+91 9977577014",
         "Lead coordination, legal workflow research, product scope, and police operational requirements."),
        (t_c2, t_r1, "Krishna Prajapat", "System Architect & Frontend Lead", "krishnaaaprajapattt@gmail.com", "LinkedIn: krishna-prajapat-k2102",
         "React 18 architecture, interactive SVG network graph visualization, state engine, and deployment."),
        (t_c1, t_r2, "Avnish Sharma", "Backend & Correlation Lead", "avnishsharma4316@gmail.com", "LinkedIn: avnish-sharma-92a964376",
         "FastAPI backend, NetworkX multi-hop correlation engine, E.164 phone & UPI ingestion parsers."),
        (t_c2, t_r2, "Tarun Pandya", "Forensics & Risk Engine Lead", "pandyatarun65@gmail.com", "LinkedIn: tarun-pandya-9b91523a4",
         "ReportLab statutory legal PDF generation, scam-profile risk scoring models, test validation.")
    ]

    for l_pos, t_pos, m_name, m_role, m_email, m_extra, m_bio in team_members:
        add_card(s8, l_pos, t_pos, t_card_w, t_card_h)
        tb = s8.shapes.add_textbox(l_pos + Inches(0.25), t_pos + Inches(0.18), t_card_w - Inches(0.5), t_card_h - Inches(0.36))
        tf = tb.text_frame
        tf.word_wrap = True

        p_name = tf.paragraphs[0]
        p_name.text = m_name
        p_name.font.size = Pt(14)
        p_name.font.bold = True
        p_name.font.color.rgb = CYAN

        p_role = tf.add_paragraph()
        p_role.text = m_role
        p_role.font.size = Pt(10.5)
        p_role.font.bold = True
        p_role.font.color.rgb = WHITE

        p_contact = tf.add_paragraph()
        p_contact.text = f"{m_email}  •  {m_extra}"
        p_contact.font.size = Pt(9)
        p_contact.font.color.rgb = CYAN_LIGHT

        p_bio = tf.add_paragraph()
        p_bio.text = f"\n{m_bio}"
        p_bio.font.size = Pt(9.5)
        p_bio.font.color.rgb = TEXT_LIGHT

    s8.notes_slide.notes_text_frame.text = (
        "Our team, Thunderbytes, brings together frontend architecture, backend systems, and cyber forensic research. "
        "Led by Ankit Tank, Krishna Prajapat architected the frontend, Avnish Sharma engineered the graph backend, "
        "and Tarun Pandya implemented the statutory legal report generators."
    )

    # =========================================================================
    # SLIDE 9: DEDICATED DEMO, VERIFICATION & CLOSING
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    apply_background(s9)
    add_header(s9, "Demonstration & Verification", "Live Demo, Open-Source Codebase & Final Synthesis", "09 / 09")

    # Left Column: Verified Links Card
    add_card(s9, Inches(0.9), Inches(1.6), Inches(5.6), Inches(4.3))
    tb_links = s9.shapes.add_textbox(Inches(1.15), Inches(1.8), Inches(5.1), Inches(3.9))
    tf_links = tb_links.text_frame
    tf_links.word_wrap = True

    p_l_head = tf_links.paragraphs[0]
    p_l_head.text = "VERIFIED PROJECT ASSETS"
    p_l_head.font.size = Pt(13)
    p_l_head.font.bold = True
    p_l_head.font.color.rgb = EMERALD

    verified_links = [
        ("Live Deployment URL", "https://tracex-frontend-3.onrender.com/"),
        ("Officer Test Login", "Badge ID: MP-IO-4471   |   Password: demo1234"),
        ("Video Walkthrough", "https://youtu.be/oUuxdL-CVBA"),
        ("GitHub Repository", "https://github.com/Krishnaa-21/tracex")
    ]
    for v_lbl, v_val in verified_links:
        p_vl = tf_links.add_paragraph()
        p_vl.text = f"\n▸ {v_lbl}:"
        p_vl.font.size = Pt(11)
        p_vl.font.bold = True
        p_vl.font.color.rgb = WHITE

        p_vv = tf_links.add_paragraph()
        p_vv.text = v_val
        p_vv.font.size = Pt(10)
        p_vv.font.color.rgb = CYAN_LIGHT

    # Right Column: What Judges Will See in the Demo
    add_card(s9, Inches(6.8), Inches(1.6), Inches(5.6), Inches(4.3))
    tb_demo = s9.shapes.add_textbox(Inches(7.05), Inches(1.8), Inches(5.1), Inches(3.9))
    tf_demo = tb_demo.text_frame
    tf_demo.word_wrap = True

    p_d_head = tf_demo.paragraphs[0]
    p_d_head.text = "WHAT YOU WILL SEE IN THE DEMO"
    p_d_head.font.size = Pt(13)
    p_d_head.font.bold = True
    p_d_head.font.color.rgb = CYAN

    demo_steps = [
        ("1. Multi-Format Evidence Ingestion", "Upload raw bank Excel sheets and CDR logs into an active case."),
        ("2. Real-Time Network Graph", "Automatic force-directed correlation clustering suspect phones, accounts, and IPs."),
        ("3. Dynamic Threat Scoring", "Composite 0-100 risk score calculation highlighting mule accounts."),
        ("4. One-Click Statutory Orders", "Instant generation of court-admissible Section 91 CrPC Bank Freeze directives.")
    ]
    for d_num, d_text in demo_steps:
        p_dt = tf_demo.add_paragraph()
        p_dt.text = f"\n▸ {d_num}"
        p_dt.font.size = Pt(10.5)
        p_dt.font.bold = True
        p_dt.font.color.rgb = WHITE

        p_dd = tf_demo.add_paragraph()
        p_dd.text = d_text
        p_dd.font.size = Pt(9.5)
        p_dd.font.color.rgb = TEXT_LIGHT

    # Bottom Full-Width Closing Banner
    add_card(s9, Inches(0.9), Inches(6.1), Inches(11.5), Inches(0.9), bg_rgb=RGBColor(14, 24, 44), border_rgb=CYAN)
    tb_close = s9.shapes.add_textbox(Inches(1.1), Inches(6.15), Inches(11.1), Inches(0.8))
    tf_close = tb_close.text_frame
    p_c_txt = tf_close.paragraphs[0]
    p_c_txt.text = (
        "\"Cyber criminals operate at machine speed. Law enforcement can no longer investigate at human speed. "
        "TraceX levels the playing field.\""
    )
    p_c_txt.font.size = Pt(11)
    p_c_txt.font.italic = True
    p_c_txt.font.bold = True
    p_c_txt.font.color.rgb = WHITE
    p_c_txt.alignment = PP_ALIGN.CENTER

    s9.notes_slide.notes_text_frame.text = (
        "Thank you esteemed jury. TraceX is live and ready for testing with our pre-seeded officer credentials. "
        "You can inspect our open-source codebase on GitHub and watch our video walkthrough. We look forward to "
        "advancing to the offline finale at IIM Indore!"
    )

    # Save to both requested locations:
    # 1. tracex/TraceX_EPINOIA_Presentation.pptx (Root level as requested)
    # 2. tracex/ppt/TraceX_EPINOIA_Presentation.pptx (Inside ppt/ folder)
    root_out = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "TraceX_EPINOIA_Presentation.pptx"))
    ppt_out = os.path.abspath(os.path.join(os.path.dirname(__file__), "TraceX_EPINOIA_Presentation.pptx"))

    prs.save(root_out)
    prs.save(ppt_out)
    print(f"Presentation saved successfully to:\n1. {root_out}\n2. {ppt_out}")

if __name__ == "__main__":
    create_presentation()
