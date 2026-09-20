"""
Script to generate the official 9-slide TraceX presentation for EPINOIA (Atharv Ranbhoomi 2026, IIM Indore).
Uses 16:9 widescreen layout, dark cyber-intelligence theme, card-based visual structures, and embedded speaker notes.
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def build_presentation():
    prs = Presentation()
    # 16:9 Widescreen layout
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette
    BG_COLOR = RGBColor(11, 17, 32)        # #0B1120 Deep Dark Navy
    CARD_BG = RGBColor(19, 30, 50)         # #131E32 Card Surface
    CARD_BORDER = RGBColor(37, 53, 79)     # #25354F Border
    CYAN = RGBColor(0, 212, 255)           # #00D4FF Neon Cyan Accent
    CYAN_MUTED = RGBColor(56, 189, 248)    # #38BDF8
    EMERALD = RGBColor(16, 185, 129)       # #10B981 Success / Low Risk
    CORAL = RGBColor(244, 63, 94)          # #F43F5E High Risk / Alert
    AMBER = RGBColor(245, 158, 11)         # #F59E0B Warning / Medium
    PURPLE = RGBColor(129, 140, 248)       # #818CF8 Syndicate Purple
    WHITE = RGBColor(255, 255, 255)        # Pure White
    TEXT_MUTED = RGBColor(148, 163, 184)   # #94A3B8 Slate 400
    TEXT_DIM = RGBColor(100, 116, 139)     # #64748B Slate 500

    assets_dir = os.path.join(os.path.dirname(__file__), "assets")
    atharv_logo_path = os.path.join(assets_dir, "atharv_ranbhoomi_logo.png")
    tracex_logo_path = os.path.join(assets_dir, "tracex_logo.png")
    tracex_icon_path = os.path.join(assets_dir, "tracex_icon.png")

    def set_slide_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_COLOR
        bg.line.fill.background() # No line
        return bg

    def add_header(slide, tag_text, title_text, slide_num_str):
        # Category Tag
        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(8.0), Inches(0.3))
        tf_tag = tag_box.text_frame
        tf_tag.word_wrap = True
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = tag_text.upper()
        p_tag.font.size = Pt(10)
        p_tag.font.bold = True
        p_tag.font.color.rgb = CYAN
        p_tag.font.name = "Arial"

        # Main Slide Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.68), Inches(10.5), Inches(0.65))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = WHITE
        p_title.font.name = "Arial"

        # Top Right Branding / Event info
        brand_box = slide.shapes.add_textbox(Inches(9.5), Inches(0.4), Inches(3.0), Inches(0.5))
        tf_brand = brand_box.text_frame
        p_brand = tf_brand.paragraphs[0]
        p_brand.alignment = PP_ALIGN.RIGHT
        p_brand.text = f"EPINOIA '26  |  {slide_num_str}"
        p_brand.font.size = Pt(11)
        p_brand.font.bold = True
        p_brand.font.color.rgb = TEXT_DIM
        p_brand.font.name = "Arial"

    def add_card(slide, left, top, width, height, bg_rgb=CARD_BG, border_rgb=CARD_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_rgb
        card.line.color.rgb = border_rgb
        card.line.width = Pt(1)
        return card

    # =========================================================================
    # SLIDE 1: COVER / HOOK
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)

    # Top Badge: Event & Fest Info
    badge = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.8), Inches(6.5), Inches(0.42))
    badge.fill.solid()
    badge.fill.fore_color.rgb = RGBColor(16, 32, 60)
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
    t_box = s1.shapes.add_textbox(Inches(0.8), Inches(1.4), Inches(8.5), Inches(1.4))
    tf_t = t_box.text_frame
    p_t = tf_t.paragraphs[0]
    p_t.text = "TraceX"
    p_t.font.size = Pt(56)
    p_t.font.bold = True
    p_t.font.color.rgb = WHITE
    p_t.font.name = "Arial"

    # Subtitle / Hook
    p_sub = tf_t.add_paragraph()
    p_sub.text = "Unified Cyber Fraud Intelligence & Forensic Correlation Console"
    p_sub.font.size = Pt(20)
    p_sub.font.bold = True
    p_sub.font.color.rgb = CYAN_MUTED
    p_sub.font.name = "Arial"

    # One-line Pitch Narrative
    p_desc = tf_t.add_paragraph()
    p_desc.text = "Automating multi-hop entity correlation, cross-case syndicate discovery, and statutory freeze directives for Law Enforcement during the critical Golden Hour."
    p_desc.font.size = Pt(13)
    p_desc.font.color.rgb = TEXT_MUTED
    p_desc.font.name = "Arial"

    # Right Side: Atharv Ranbhoomi Logo / Branding Card
    logo_card = add_card(s1, Inches(9.3), Inches(1.2), Inches(3.2), Inches(3.6), bg_rgb=RGBColor(15, 23, 42), border_rgb=CARD_BORDER)
    if os.path.exists(atharv_logo_path):
        s1.shapes.add_picture(atharv_logo_path, Inches(9.65), Inches(1.4), Inches(2.5), Inches(2.5))
    
    lbl_box = s1.shapes.add_textbox(Inches(9.4), Inches(4.0), Inches(3.0), Inches(0.7))
    tf_lbl = lbl_box.text_frame
    p_lbl1 = tf_lbl.paragraphs[0]
    p_lbl1.text = "Atharv Ranbhoomi '26"
    p_lbl1.font.size = Pt(13)
    p_lbl1.font.bold = True
    p_lbl1.font.color.rgb = WHITE
    p_lbl1.alignment = PP_ALIGN.CENTER
    p_lbl2 = tf_lbl.add_paragraph()
    p_lbl2.text = "IIM Indore  •  Round 1 Submission"
    p_lbl2.font.size = Pt(10.5)
    p_lbl2.font.color.rgb = CYAN
    p_lbl2.alignment = PP_ALIGN.CENTER

    # Bottom Cards: Team & Verified Project Credentials
    c1 = add_card(s1, Inches(0.8), Inches(4.8), Inches(7.2), Inches(2.1))
    tf_c1 = c1.text_frame
    p_c1_t = tf_c1.paragraphs[0]
    p_c1_t.text = "TEAM THUNDERBYTES  |  Shri Vaishnav Vidyapeeth Vishwavidyalaya (SVVV), Indore"
    p_c1_t.font.size = Pt(11)
    p_c1_t.font.bold = True
    p_c1_t.font.color.rgb = CYAN

    members = [
        ("Ankit Tank", "Team Leader", "ankittank9977@gmail.com", "+91 9977577014"),
        ("Krishna Prajapat", "System Architect & Frontend", "krishnaaaprajapattt@gmail.com", "LinkedIn: krishna-prajapat-k2102"),
        ("Avnish Sharma", "Backend & Correlation Engine", "avnishsharma4316@gmail.com", "LinkedIn: avnish-sharma-92a964376"),
        ("Tarun Pandya", "Forensics & Report Engine", "pandyatarun65@gmail.com", "LinkedIn: tarun-pandya-9b91523a4")
    ]
    for name, role, email, phone in members:
        p_m = tf_c1.add_paragraph()
        p_m.text = f"• {name}  ({role})  —  {email}  |  {phone}"
        p_m.font.size = Pt(9.5)
        p_m.font.color.rgb = WHITE

    # Project Verified Links Card
    c2 = add_card(s1, Inches(8.2), Inches(4.8), Inches(4.3), Inches(2.1))
    tf_c2 = c2.text_frame
    p_c2_t = tf_c2.paragraphs[0]
    p_c2_t.text = "VERIFIED PROJECT LINKS"
    p_c2_t.font.size = Pt(11)
    p_c2_t.font.bold = True
    p_c2_t.font.color.rgb = EMERALD

    links = [
        ("Live Deployment", "https://tracex-frontend-3.onrender.com/"),
        ("Video Walkthrough", "https://youtu.be/oUuxdL-CVBA"),
        ("GitHub Repository", "https://github.com/Krishnaa-21/tracex"),
        ("Default Officer Login", "Badge: MP-IO-4471  |  Pass: demo1234")
    ]
    for lbl, val in links:
        p_l = tf_c2.add_paragraph()
        p_l.text = f"• {lbl}: {val}"
        p_l.font.size = Pt(9)
        p_l.font.color.rgb = WHITE

    # Speaker Notes
    s1.notes_slide.notes_text_frame.text = (
        "Good day respected jury members. We are Team Thunderbytes from SVVV Indore, presenting TraceX for EPINOIA "
        "at Atharv Ranbhoomi, IIM Indore. TraceX is a fully operational, end-to-end digital cyber fraud intelligence console "
        "engineered for Law Enforcement officers to connect disparate telecom, banking, and digital evidence within seconds "
        "during the critical Golden Hour."
    )

    # =========================================================================
    # SLIDE 2: THE PROBLEM
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    add_header(s2, "Context & Problem Statement", "The Golden Hour Paralysis in Cyber Crime Investigation", "02 / 09")

    # 3 Structured Problem Cards
    col_w = Inches(3.64)
    gap = Inches(0.4)
    top_pos = Inches(1.5)
    card_h = Inches(5.3)

    # Card 1: Evidence Silos
    add_card(s2, Inches(0.8), top_pos, col_w, card_h)
    tb1 = s2.shapes.add_textbox(Inches(0.95), Inches(1.65), Inches(3.34), Inches(5.0))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    p1 = tf1.paragraphs[0]
    p1.text = "FRAGMENTED EVIDENCE SILOS"
    p1.font.size = Pt(13)
    p1.font.bold = True
    p1.font.color.rgb = CORAL

    p1_desc = tf1.add_paragraph()
    p1_desc.text = (
        "\n• Multiple Raw Formats: Officers receive Excel dumps from 10+ different banks, CDR/IPDR text files from telcos, "
        "and email .eml logs.\n\n"
        "• Manual Reconciliation: Investigating Officers (IOs) cross-check 10,000+ line spreadsheets cell-by-cell using VLOOKUP.\n\n"
        "• Zero Interoperability: No standard schema exists between bank statements, UPI merchant sheets, and cellular tower logs."
    )
    p1_desc.font.size = Pt(11)
    p1_desc.font.color.rgb = TEXT_MUTED

    # Card 2: Golden Hour Window
    add_card(s2, Inches(0.8) + col_w + gap, top_pos, col_w, card_h)
    tb2 = s2.shapes.add_textbox(Inches(0.95) + col_w + gap, Inches(1.65), Inches(3.34), Inches(5.0))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    p2 = tf2.paragraphs[0]
    p2.text = "LOST GOLDEN HOUR (<2 HOURS)"
    p2.font.size = Pt(13)
    p2.font.bold = True
    p2.font.color.rgb = AMBER

    p2_desc = tf2.add_paragraph()
    p2_desc.text = (
        "\n• Rapid Fund Layering: Stolen funds are routed across 4 to 6 mule accounts and converted into cash at ATMs within 45 minutes.\n\n"
        "• 48-Hour Investigation Lag: Manual analysis takes 24 to 72 hours per case. By the time links are spotted, money is gone.\n\n"
        "• Burner Infrastructure: Fraudsters discard SIM cards and UPI VPAs within hours, leaving cold trails."
    )
    p2_desc.font.size = Pt(11)
    p2_desc.font.color.rgb = TEXT_MUTED

    # Card 3: Isolated Police Stations
    add_card(s2, Inches(0.8) + (col_w + gap)*2, top_pos, col_w, card_h)
    tb3 = s2.shapes.add_textbox(Inches(0.95) + (col_w + gap)*2, Inches(1.65), Inches(3.34), Inches(5.0))
    tf3 = tb3.text_frame
    tf3.word_wrap = True
    p3 = tf3.paragraphs[0]
    p3.text = "CROSS-CASE BLIND SPOTS"
    p3.font.size = Pt(13)
    p3.font.bold = True
    p3.font.color.rgb = PURPLE

    p3_desc = tf3.add_paragraph()
    p3_desc.text = (
        "\n• Organized Crime Syndicates: The same mule account is used across 15 FIRs in 4 different districts simultaneously.\n\n"
        "• Station-Level Silos: Bhopal Cyber Cell has no automated way of knowing that an IMEI under scrutiny is also active in Indore or Jabalpur.\n\n"
        "• High Officer Burnout: Hundreds of fresh cyber complaints are filed daily on 1930/NCRP with limited technical manpower."
    )
    p3_desc.font.size = Pt(11)
    p3_desc.font.color.rgb = TEXT_MUTED

    s2.notes_slide.notes_text_frame.text = (
        "In cyber fraud investigations, the first 2 hours are known as the 'Golden Hour'. Right now, Indian police officers receive "
        "unstructured CDR text logs and bank spreadsheets from dozens of financial institutions. Sifting through these manually takes days, "
        "allowing cyber syndicates to layer and withdraw funds through mule networks. Furthermore, police stations work in isolation, "
        "failing to detect syndicates operating across state borders."
    )

    # =========================================================================
    # SLIDE 3: OUR SOLUTION
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    add_header(s3, "Product Value Proposition", "TraceX: Unified Cyber Crime Operations Console", "03 / 09")

    # Left Column: Value Pillars (2 cards)
    add_card(s3, Inches(0.8), Inches(1.5), Inches(6.0), Inches(2.55))
    tb_s1 = s3.shapes.add_textbox(Inches(1.0), Inches(1.65), Inches(5.6), Inches(2.2))
    tf_s1 = tb_s1.text_frame
    tf_s1.word_wrap = True
    ps1_t = tf_s1.paragraphs[0]
    ps1_t.text = "1. INGESTION TO CORRELATION IN SECONDS"
    ps1_t.font.size = Pt(13)
    ps1_t.font.bold = True
    ps1_t.font.color.rgb = CYAN

    ps1_d = tf_s1.add_paragraph()
    ps1_d.text = (
        "TraceX ingests heterogeneous evidence—CDRs, bank account sheets, UPI transaction logs, "
        "IPDR records, and email headers. Our automated normalization pipeline extracts, standardizes, "
        "and resolves entities into a unified graph in real time."
    )
    ps1_d.font.size = Pt(11)
    ps1_d.font.color.rgb = TEXT_MUTED

    add_card(s3, Inches(0.8), Inches(4.25), Inches(6.0), Inches(2.55))
    tb_s2 = s3.shapes.add_textbox(Inches(1.0), Inches(4.4), Inches(5.6), Inches(2.2))
    tf_s2 = tb_s2.text_frame
    tf_s2.word_wrap = True
    ps2_t = tf_s2.paragraphs[0]
    ps2_t.text = "2. GROUNDED AI & STATUTORY DIRECTIVES"
    ps2_t.font.size = Pt(13)
    ps2_t.font.bold = True
    ps2_t.font.color.rgb = EMERALD

    ps2_d = tf_s2.add_paragraph()
    ps2_d.text = (
        "Combines an offline-resilient AI Co-pilot grounded in case evidence with automated PDF generators "
        "that produce Section 91 CrPC Bank Debit Freeze notices and Section 69A IT Act Emergency Takedown "
        "directives with cryptographic SHA-256 integrity verification."
    )
    ps2_d.font.size = Pt(11)
    ps2_d.font.color.rgb = TEXT_MUTED

    # Right Column: Metrics & Architecture Breakthroughs (Card)
    add_card(s3, Inches(7.1), Inches(1.5), Inches(5.4), Inches(5.3))
    tb_s3 = s3.shapes.add_textbox(Inches(7.35), Inches(1.65), Inches(4.9), Inches(5.0))
    tf_s3 = tb_s3.text_frame
    tf_s3.word_wrap = True
    ps3_t = tf_s3.paragraphs[0]
    ps3_t.text = "KEY QUANTIFIABLE ADVANTAGES"
    ps3_t.font.size = Pt(14)
    ps3_t.font.bold = True
    ps3_t.font.color.rgb = WHITE

    metrics = [
        ("From 48 Hours to 3 Minutes", "Complete case triage time reduced by over 95% within the Golden Hour."),
        ("100% Schema Agnostic", "Parses messy CSV, Excel, TXT, and EML records from all major Indian telecom and banking providers."),
        ("Multi-Case Syndicate Discovery", "Instantly flags when a mule UPI or phone number has appeared in other police cases."),
        ("Dual-Mode Operational UX", "Tactical Dark SOC Mode for forensic specialists + Standard Light Government Portal for courtroom & senior administration.")
    ]
    for title, detail in metrics:
        p_m_t = tf_s3.add_paragraph()
        p_m_t.text = f"\n▸ {title}"
        p_m_t.font.size = Pt(11.5)
        p_m_t.font.bold = True
        p_m_t.font.color.rgb = CYAN_MUTED

        p_m_d = tf_s3.add_paragraph()
        p_m_d.text = detail
        p_m_d.font.size = Pt(10)
        p_m_d.font.color.rgb = TEXT_MUTED

    s3.notes_slide.notes_text_frame.text = (
        "TraceX solves this by acting as a single, unified operations room. We eliminate manual Excel comparisons by providing "
        "an end-to-end pipeline: evidence ingestion, graph correlation, heuristic risk scoring, and one-click statutory directive "
        "generation. What previously took an officer 48 hours is achieved in under three minutes."
    )

    # =========================================================================
    # SLIDE 4: HOW IT WORKS (END-TO-END PIPELINE)
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    add_header(s4, "System Workflow & Pipeline", "End-to-End Investigative Architecture", "04 / 09")

    # 4 Horizontal Workflow Steps
    step_w = Inches(2.7)
    step_gap = Inches(0.3)
    step_top = Inches(1.6)
    step_h = Inches(5.1)

    steps_data = [
        ("STEP 01", "INGESTION & ETL", CYAN, [
            ("Raw File Uploads", "CDR, Bank Excel, UPI statements, Device Logs, .eml headers."),
            ("Sanitization Engine", "E.164 phone standardizer, UPI VPA cleanups, IFSC validator."),
            ("Evidence Registry", "File hash sealing and metadata indexing in database.")
        ]),
        ("STEP 02", "GRAPH CORRELATION", PURPLE, [
            ("Entity Extraction", "Isolates Phones, Accounts, VPAs, IPs, IMEIs, Domains."),
            ("Multi-Hop Graph", "NetworkX engine resolves 1st, 2nd, and 3rd-degree connection hops."),
            ("Syndicate Matching", "Auto-links cross-case overlap across different FIRs.")
        ]),
        ("STEP 03", "RISK SCORING", CORAL, [
            ("Scam Profiles", "Profile-weighted rules for UPI scam, investment fraud, sextortion."),
            ("Velocity Heuristics", "Rapid fund transfer detection across mule accounts."),
            ("Composite Score", "Calculates 0-100 severity rating with confidence weights.")
        ]),
        ("STEP 04", "ACTION & REPORT", EMERALD, [
            ("Interactive SOC Graph", "Clustered force layout with physics pause and entity filters."),
            ("Statutory Directives", "Auto-drafts Sec 91 CrPC and Sec 69A IT Act PDF orders."),
            ("Forensic Co-Pilot", "AI chat assistant answers grounded case queries.")
        ])
    ]

    for i, (badge_str, step_title, color_rgb, items) in enumerate(steps_data):
        left_p = Inches(0.8) + i * (step_w + step_gap)
        add_card(s4, left_p, step_top, step_w, step_h)
        
        tb = s4.shapes.add_textbox(left_p + Inches(0.15), step_top + Inches(0.15), step_w - Inches(0.3), step_h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p_badge = tf.paragraphs[0]
        p_badge.text = badge_str
        p_badge.font.size = Pt(10.5)
        p_badge.font.bold = True
        p_badge.font.color.rgb = color_rgb

        p_t = tf.add_paragraph()
        p_t.text = step_title
        p_t.font.size = Pt(13)
        p_t.font.bold = True
        p_t.font.color.rgb = WHITE

        for sub_t, sub_d in items:
            p_sub_t = tf.add_paragraph()
            p_sub_t.text = f"\n▸ {sub_t}"
            p_sub_t.font.size = Pt(10.5)
            p_sub_t.font.bold = True
            p_sub_t.font.color.rgb = color_rgb

            p_sub_d = tf.add_paragraph()
            p_sub_d.text = sub_d
            p_sub_d.font.size = Pt(9.5)
            p_sub_d.font.color.rgb = TEXT_MUTED

    s4.notes_slide.notes_text_frame.text = (
        "Here is the exact technical pipeline we built. Step 1 ingests raw evidence and standardizes identifiers like phone numbers "
        "and IFSC codes. Step 2 builds a NetworkX correlation graph that links multiple cases together. Step 3 applies heuristic "
        "risk models based on the specific fraud type. Step 4 presents an interactive visual workspace and generates court-admissible "
        "PDF orders ready to be dispatched to banks and telecom operators."
    )

    # =========================================================================
    # SLIDE 5: KEY IMPLEMENTED FEATURES
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    add_header(s5, "Product Capabilities", "6 Production-Ready Core Features", "05 / 09")

    # 2 Rows of 3 Cards
    grid_w = Inches(3.64)
    grid_gap = Inches(0.4)
    r1_top = Inches(1.5)
    r2_top = Inches(4.25)
    r_h = Inches(2.5)

    features = [
        ("Heterogeneous Evidence ETL", CYAN, "backend/app/services/ingestion",
         "Ingests and parses CDRs, Bank statements, UPI sheets, IPDRs, and .eml email headers into normalized entity records."),
        ("Clustered Multi-Hop Graph", PURPLE, "frontend/src/pages/ConnectionsGraph.jsx",
         "Force-directed interactive visualization with hub-and-spoke clustering, entity category color coding, and physics control."),
        ("Dynamic Scam-Profile Risk Scoring", CORAL, "backend/app/services/risk",
         "Calculates composite 0-100 threat scores using transaction velocity, shared mule accounts, and burner SIM patterns."),
        ("Automated Statutory Legal Orders", EMERALD, "backend/app/services/reports",
         "Instant ReportLab generation of Section 91 CrPC Bank Freeze directives & Section 69A IT Act Takedown orders with SHA-256 hash sealing."),
        ("Grounded Cyber Intelligence Co-Pilot", CYAN_MUTED, "backend/app/services/ai",
         "GPT-4o-mini powered investigative assistant with strict RAG case-grounding and seamless offline rule-based fallback."),
        ("Dual Operational UX Architecture", AMBER, "frontend/src/context/ModeContext.jsx",
         "One-click switch between dark Tactical Analysis Mode (cyber SOC cockpit) and formal Standard Mode (government portal skin).")
    ]

    for idx, (f_title, f_color, f_file, f_body) in enumerate(features):
        row = idx // 3
        col = idx % 3
        t_pos = r1_top if row == 0 else r2_top
        l_pos = Inches(0.8) + col * (grid_w + grid_gap)

        add_card(s5, l_pos, t_pos, grid_w, r_h)
        tb = s5.shapes.add_textbox(l_pos + Inches(0.15), t_pos + Inches(0.12), grid_w - Inches(0.3), r_h - Inches(0.24))
        tf = tb.text_frame
        tf.word_wrap = True

        p_ft = tf.paragraphs[0]
        p_ft.text = f_title
        p_ft.font.size = Pt(12)
        p_ft.font.bold = True
        p_ft.font.color.rgb = f_color

        p_code = tf.add_paragraph()
        p_code.text = f"Module: {f_file}"
        p_code.font.size = Pt(8.5)
        p_code.font.color.rgb = TEXT_DIM

        p_fb = tf.add_paragraph()
        p_fb.text = f"\n{f_body}"
        p_fb.font.size = Pt(9.5)
        p_fb.font.color.rgb = TEXT_MUTED

    s5.notes_slide.notes_text_frame.text = (
        "Every single feature listed here is fully written and running in our repository today. We built real ingestion parsers, "
        "a mathematical graph correlation engine, scam-calibrated risk scoring, automated statutory PDF directives, an offline-resilient "
        "AI Co-pilot, and dual operational skins designed specifically for Indian police workflows."
    )

    # =========================================================================
    # SLIDE 6: TECHNOLOGY & ARCHITECTURE
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6)
    add_header(s6, "Technical Implementation", "Full-Stack Architecture & Codebase Stack", "06 / 09")

    # 4 Stack Cards
    col_w4 = Inches(2.7)
    gap4 = Inches(0.3)
    top4 = Inches(1.5)
    h4 = Inches(5.3)

    stacks = [
        ("FRONTEND LAYER", CYAN, [
            ("Core Framework", "React 18 (SPA) + Vite 5"),
            ("Styling System", "Tailwind CSS + Lucide Icons"),
            ("Client Routing", "React Router DOM v6 with SPA rewrites"),
            ("Graph Engine", "Interactive SVG Clustered Layout"),
            ("State & Context", "ModeContext (Analysis vs Standard)")
        ]),
        ("BACKEND API LAYER", PURPLE, [
            ("Framework", "Python 3.11+ / FastAPI (ASGI)"),
            ("Web Server", "Uvicorn high-concurrency server"),
            ("Data Schemas", "Pydantic v2 strict typing"),
            ("Security & Auth", "OAuth2 JWT (HS256) + Bcrypt"),
            ("CORS & Network", "Dual local + onrender.com regex")
        ]),
        ("ANALYTICS & AI CORE", CORAL, [
            ("Graph Theory", "NetworkX multi-hop entity graphs"),
            ("Evidence Parsing", "Pandas + OpenPyXL tabular ETL"),
            ("AI Assistant", "GPT-4o-mini with Grounded RAG"),
            ("Failover Safety", "Deterministic offline rule engine"),
            ("Scam Profiles", "Custom heuristic weighting models")
        ]),
        ("STORAGE & REPORTS", EMERALD, [
            ("Database ORM", "SQLAlchemy (PostgreSQL / SQLite)"),
            ("PDF Generation", "ReportLab Vector Engine"),
            ("Fallback PDF", "WeasyPrint CSS Paged Media"),
            ("Cryptographic Seal", "SHA-256 integrity verification"),
            ("PDF Security", "Standard AES encryption support")
        ])
    ]

    for i, (layer_title, color_rgb, specs) in enumerate(stacks):
        l_pos = Inches(0.8) + i * (col_w4 + gap4)
        add_card(s6, l_pos, top4, col_w4, h4)

        tb = s6.shapes.add_textbox(l_pos + Inches(0.15), top4 + Inches(0.15), col_w4 - Inches(0.3), h4 - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = layer_title
        p_t.font.size = Pt(13)
        p_t.font.bold = True
        p_t.font.color.rgb = color_rgb

        for category, detail in specs:
            p_c = tf.add_paragraph()
            p_c.text = f"\n▸ {category}"
            p_c.font.size = Pt(10.5)
            p_c.font.bold = True
            p_c.font.color.rgb = WHITE

            p_d = tf.add_paragraph()
            p_d.text = detail
            p_d.font.size = Pt(9.5)
            p_d.font.color.rgb = TEXT_MUTED

    s6.notes_slide.notes_text_frame.text = (
        "Our architecture is modern, clean, and highly scalable. On the frontend, React 18 and Vite deliver a sub-second, "
        "highly responsive interface. On the backend, FastAPI and NetworkX handle multi-hop graph resolution in milliseconds. "
        "Our AI layer features strict RAG grounding, and ReportLab produces court-admissible vector PDFs with cryptographic verification."
    )

    # =========================================================================
    # SLIDE 7: WHAT MAKES US DIFFERENT
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7)
    add_header(s7, "Competitive Advantage", "Evidence-Backed Technical Differentiators", "07 / 09")

    # Comparison Grid / Differentiator Cards
    diff_w = Inches(5.6)
    diff_h = Inches(2.5)
    d_top1 = Inches(1.5)
    d_top2 = Inches(4.25)
    col1_l = Inches(0.8)
    col2_l = Inches(6.85)

    diffs = [
        (col1_l, d_top1, "1. ZERO-DISRUPTION WORKFLOW", CYAN,
         "Conventional forensic tools require custom hardware or expensive proprietary database formats. "
         "TraceX works directly with raw Excel dumps, CDR text files, and bank statements that officers already receive daily."),
        (col2_l, d_top1, "2. DUAL-ENGINE RESILIENT AI (NO HALLUCINATIONS)", EMERALD,
         "Most AI prototypes break when APIs fail or invent fake case facts. TraceX uses strict RAG prompting where the LLM "
         "is constrained to case data, backed by a 100% offline deterministic rule engine fallback for court reliability."),
        (col1_l, d_top2, "3. CROSS-CASE SYNDICATE DETECTION", PURPLE,
         "While standard police tools analyze cases in isolation, TraceX automatically correlates entities across different FIRs "
         "to reveal multi-district mule rings, shared phone numbers, and common infrastructure."),
        (col2_l, d_top2, "4. COURT-READY STATUTORY DIRECTIVES", AMBER,
         "TraceX doesn't just show visual charts; it automates the legal action. Generating Section 91 CrPC and Section 69A IT Act "
         "orders with SHA-256 hashes and password encryption transforms analytical insight into immediate law enforcement action.")
    ]

    for l_pos, t_pos, title_str, color_rgb, body_str in diffs:
        add_card(s7, l_pos, t_pos, diff_w, diff_h)
        tb = s7.shapes.add_textbox(l_pos + Inches(0.2), t_pos + Inches(0.15), diff_w - Inches(0.4), diff_h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p_dt = tf.paragraphs[0]
        p_dt.text = title_str
        p_dt.font.size = Pt(13)
        p_dt.font.bold = True
        p_dt.font.color.rgb = color_rgb

        p_db = tf.add_paragraph()
        p_db.text = f"\n{body_str}"
        p_db.font.size = Pt(10.5)
        p_db.font.color.rgb = TEXT_MUTED

    s7.notes_slide.notes_text_frame.text = (
        "Unlike generic student projects, TraceX is designed around the realities of Indian police work. We don't ask officers to change "
        "their evidence formats. Our AI never hallucinates in court because it is strictly grounded in evidence with offline fallback. "
        "And most importantly, we bridge the gap between intelligence and legal action through automated statutory freeze directives."
    )

    # =========================================================================
    # SLIDE 8: IMPACT, SCALABILITY & ROADMAP
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8)
    add_header(s8, "Real-World Impact & Roadmap", "Measurable Impact & Future Growth", "08 / 09")

    # Left: Immediate Stakeholder Impact (Card)
    add_card(s8, Inches(0.8), Inches(1.5), Inches(5.6), Inches(5.3))
    tb_imp = s8.shapes.add_textbox(Inches(1.0), Inches(1.65), Inches(5.2), Inches(5.0))
    tf_imp = tb_imp.text_frame
    tf_imp.word_wrap = True

    p_it = tf_imp.paragraphs[0]
    p_it.text = "MEASURABLE REAL-WORLD IMPACT"
    p_it.font.size = Pt(14)
    p_it.font.bold = True
    p_it.font.color.rgb = CYAN

    impact_items = [
        ("For Investigating Officers (IOs)", "Cuts evidence parsing and spreadsheet matching from 48+ hours to under 3 minutes, accelerating triage."),
        ("For Cyber Fraud Victims", "Immediate identification of destination accounts allows freezing funds during the Golden Hour before cash is laundered."),
        ("For Police Leadership & Courtrooms", "Provides standardized, tamper-evident forensic dossiers with SHA-256 hash verification for charge sheets."),
        ("For State Cyber Coordination (I4C)", "Reveals statewide criminal syndicates operating across city and district jurisdictions.")
    ]
    for target, detail in impact_items:
        p_ti = tf_imp.add_paragraph()
        p_ti.text = f"\n▸ {target}"
        p_ti.font.size = Pt(11)
        p_ti.font.bold = True
        p_ti.font.color.rgb = WHITE

        p_td = tf_imp.add_paragraph()
        p_td.text = detail
        p_td.font.size = Pt(10)
        p_td.font.color.rgb = TEXT_MUTED

    # Right: Future Scalability Roadmap (Card)
    add_card(s8, Inches(6.85), Inches(1.5), Inches(5.65), Inches(5.3))
    tb_rd = s8.shapes.add_textbox(Inches(7.05), Inches(1.65), Inches(5.25), Inches(5.0))
    tf_rd = tb_rd.text_frame
    tf_rd.word_wrap = True

    p_rt = tf_rd.paragraphs[0]
    p_rt.text = "SCALABILITY & FUTURE ROADMAP"
    p_rt.font.size = Pt(14)
    p_rt.font.bold = True
    p_rt.font.color.rgb = EMERALD

    roadmap_items = [
        ("CURRENTLY IMPLEMENTED (v1.0 Ready)", "Full ingestion, multi-hop graph, scam-profile risk scoring, ReportLab statutory PDFs, dual UX, AI chat."),
        ("PHASE 2: NCRP / 1930 API INTEGRATION", "Direct webhook connector to National Cyber Crime Reporting Portal for real-time complaint ingestion."),
        ("PHASE 3: TELECOM TOWER STREAMING", "Real-time cell-tower triangulation and automated Subscriber Detail Record (SDR) lookup via telecom APIs."),
        ("PHASE 4: BLOCKCHAIN / CRYPTO TRACING", "Automated tracking for crypto-wallet hops and P2P crypto exchanges used in international scam laundering.")
    ]
    for r_title, r_desc in roadmap_items:
        p_ri = tf_rd.add_paragraph()
        p_ri.text = f"\n▸ {r_title}"
        p_ri.font.size = Pt(11)
        p_ri.font.bold = True
        p_ri.font.color.rgb = CYAN_MUTED

        p_rd = tf_rd.add_paragraph()
        p_rd.text = r_desc
        p_rd.font.size = Pt(10)
        p_rd.font.color.rgb = TEXT_MUTED

    s8.notes_slide.notes_text_frame.text = (
        "TraceX directly protects citizen funds by enabling rapid account freezing in the Golden Hour. For scalability, our roadmap "
        "clearly separates what is already implemented today from future integrations like 1930 NCRP portals, telecom tower streams, "
        "and crypto tracking."
    )

    # =========================================================================
    # SLIDE 9: CLOSING & DEMO VERIFICATION
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9)
    add_header(s9, "Conclusion & Pitch Summary", "TraceX: Leveling the Playing Field in Cyber Warfare", "09 / 09")

    # Big Synthesis Card
    add_card(s9, Inches(0.8), Inches(1.5), Inches(11.73), Inches(2.2), bg_rgb=RGBColor(15, 23, 42), border_rgb=CYAN)
    tb_syn = s9.shapes.add_textbox(Inches(1.1), Inches(1.65), Inches(11.1), Inches(1.9))
    tf_syn = tb_syn.text_frame
    tf_syn.word_wrap = True

    p_syn_h = tf_syn.paragraphs[0]
    p_syn_h.text = "THE SYNTHESIS: PROBLEM  ➔  SOLUTION  ➔  TECH  ➔  IMPACT"
    p_syn_h.font.size = Pt(13)
    p_syn_h.font.bold = True
    p_syn_h.font.color.rgb = CYAN

    p_syn_q = tf_syn.add_paragraph()
    p_syn_q.text = (
        "\n\"Cyber criminals operate at machine speed. Law enforcement can no longer investigate at human speed. "
        "TraceX transforms raw, disconnected evidence into immediate, court-admissible legal action within the Golden Hour.\""
    )
    p_syn_q.font.size = Pt(14)
    p_syn_q.font.italic = True
    p_syn_q.font.bold = True
    p_syn_q.font.color.rgb = WHITE

    # Bottom Row: 3 Verification & Access Cards
    bot_w = Inches(3.64)
    bot_h = Inches(2.7)
    bot_top = Inches(4.1)

    # Box 1: Live Demo
    add_card(s9, Inches(0.8), bot_top, bot_w, bot_h)
    tb_b1 = s9.shapes.add_textbox(Inches(0.95), bot_top + Inches(0.15), bot_w - Inches(0.3), bot_h - Inches(0.3))
    tf_b1 = tb_b1.text_frame
    tf_b1.word_wrap = True
    p_b1_t = tf_b1.paragraphs[0]
    p_b1_t.text = "LIVE DEPLOYMENT"
    p_b1_t.font.size = Pt(13)
    p_b1_t.font.bold = True
    p_b1_t.font.color.rgb = EMERALD
    p_b1_d = tf_b1.add_paragraph()
    p_b1_d.text = (
        "\n• URL: https://tracex-frontend-3.onrender.com/\n\n"
        "• Test Credentials:\n"
        "  Badge ID: MP-IO-4471\n"
        "  Password: demo1234\n\n"
        "• Fully interactive demo data pre-seeded."
    )
    p_b1_d.font.size = Pt(10)
    p_b1_d.font.color.rgb = WHITE

    # Box 2: Source Code & Video
    add_card(s9, Inches(0.8) + bot_w + Inches(0.4), bot_top, bot_w, bot_h)
    tb_b2 = s9.shapes.add_textbox(Inches(0.95) + bot_w + Inches(0.4), bot_top + Inches(0.15), bot_w - Inches(0.3), bot_h - Inches(0.3))
    tf_b2 = tb_b2.text_frame
    tf_b2.word_wrap = True
    p_b2_t = tf_b2.paragraphs[0]
    p_b2_t.text = "REPOSITORY & VIDEO"
    p_b2_t.font.size = Pt(13)
    p_b2_t.font.bold = True
    p_b2_t.font.color.rgb = CYAN
    p_b2_d = tf_b2.add_paragraph()
    p_b2_d.text = (
        "\n• GitHub Repository:\n"
        "  github.com/Krishnaa-21/tracex\n\n"
        "• Video Demonstration:\n"
        "  youtu.be/oUuxdL-CVBA\n\n"
        "• Clean commits, test suites & documentation."
    )
    p_b2_d.font.size = Pt(10)
    p_b2_d.font.color.rgb = WHITE

    # Box 3: Contact & Event
    add_card(s9, Inches(0.8) + (bot_w + Inches(0.4))*2, bot_top, bot_w, bot_h)
    tb_b3 = s9.shapes.add_textbox(Inches(0.95) + (bot_w + Inches(0.4))*2, bot_top + Inches(0.15), bot_w - Inches(0.3), bot_h - Inches(0.3))
    tf_b3 = tb_b3.text_frame
    tf_b3.word_wrap = True
    p_b3_t = tf_b3.paragraphs[0]
    p_b3_t.text = "SUBMISSION CONTACT"
    p_b3_t.font.size = Pt(13)
    p_b3_t.font.bold = True
    p_b3_t.font.color.rgb = PURPLE
    p_b3_d = tf_b3.add_paragraph()
    p_b3_d.text = (
        "\n• Team: Thunderbytes\n"
        "• Leader: Ankit Tank\n"
        "• Phone: +91 9977577014\n"
        "• Email: ankittank9977@gmail.com\n"
        "• Institute: SVVV, Indore\n\n"
        "Submitted for EPINOIA 2026, IIM Indore."
    )
    p_b3_d.font.size = Pt(10)
    p_b3_d.font.color.rgb = WHITE

    s9.notes_slide.notes_text_frame.text = (
        "Thank you esteemed jury. TraceX is not just an idea—it is a functional, tested platform with live deployment, "
        "comprehensive test suites, and authentic law-enforcement capabilities. We are ready to answer your questions "
        "and look forward to demonstrating TraceX in the offline finale at IIM Indore."
    )

    out_path = os.path.join(os.path.dirname(__file__), "TraceX_EPINOIA_Pitch_Deck.pptx")
    prs.save(out_path)
    print(f"Presentation successfully saved to: {out_path}")

if __name__ == "__main__":
    build_presentation()
