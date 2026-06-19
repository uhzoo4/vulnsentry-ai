# VULNSENTRY AI — MVP UX Architecture Alignment

**Status:** Architecture Freeze Candidate  
**Date:** June 18, 2026  
**Scope:** Solo developer · 7-day hackathon · Python/FastAPI + React/TypeScript · Gemini · Localhost-only · No database · No cloud

---

## 1. Revised UX Architecture Summary

### What Remains (Core Identity Preserved)

| Pillar | MVP Manifestation | Judge Impact |
|--------|-------------------|--------------|
| **Observe** | Live connection graph (psutil/netstat polling, 2s interval) — animated, zero-wait engagement | "It's already alive" moment at launch |
| **Understand** | Ranked findings list + Finding Detail panel with process→port mapping + AI teach blocks | "Oh, that's MY MySQL server" recognition |
| **Improve** | Recommended Fix display with copy-to-clipboard + inline teach blocks | "Here's exactly what to run" clarity |
| **Verify** | Before/After delta comparison (scan diff) + Posture Score evolution | "Score went 58→72" emotional payoff |

### Experience Quality Preserved

- **5-second comprehension**: Score + Top 3 risks + live graph visible without scroll
- **Progressive disclosure**: Novice sees "3 critical issues"; expert sees "mysqld.exe PID 4821 → port 3306 → fix: net stop MySQL"
- **Security through understanding**: Every finding includes 2-sentence plain-language teach block
- **Transformation over reporting**: Delta view is the hero, not the scan report

### Emotional Journey Preserved

| Phase | Target Emotion | MVP Mechanism |
|-------|---------------|---------------|
| **Launch** | Curiosity + Confidence | Live graph breathing, score visible, "3 critical findings" badge |
| **Diagnosis** | Clarity + Control | Ranked list, process context, inline teach, Recommended Fix button |
| **Improvement** | Agency + Momentum | Copy command → run manually → graph node disappears on re-scan |
| **Verification** | Satisfaction + Trust | Side-by-side diff, score delta animation, "14% smaller attack surface" |

---

## 2. Removed Features

### Explicitly Removed (Enterprise Complexity)

| Removed Concept | Why Removed | MVP Replacement |
|-----------------|-------------|-----------------|
| **Threat Intelligence / Shodan Integration** | External API, rate limits, scope creep | Local process resolution (`psutil`) — higher credibility, zero latency |
| **Compliance Frameworks** | Enterprise-only, no hackathon judge cares | Posture Score (0-100) — universal, gamified, instantly understandable |
| **Enterprise SOC Features** | Multi-user, database, workflow engine | Single-user, session-only, local-first |
| **Asset Inventory Management** | CMDB territory, persistent storage | Live connection graph — processes as nodes, ephemeral, real-time |
| **Historical Security Analytics** | Database required, time-series complexity | Single-scan delta (before/after) — narrative > analytics |
| **Ticketing Systems** | External integration, workflow | Dismiss/Snooze — local UX only |
| **External Intelligence Sources** | External dependency, auth, scope | Local evidence only: process path, port state, banner grab |
| **SIEM Concepts** | Wrong abstraction layer | Risk Engine (30-rule dictionary) — lightweight, explainable |
| **SOC Workflows** | Team features | Solo user journey |
| **Domain Controller Attack Paths** | Enterprise AD assumption | Generic attack path: `Internet → Port → Process → Data` |
| **Enterprise Risk Governance** | Policy/compliance layer | Severity ÷ Fix Effort ranking — actionable prioritization |
| **Multi-Team Collaboration** | Multi-user | N/A — single user |
| **Long-Term Trend Dashboards** | Database, time-series | Session delta only (current vs previous scan) |

### Simplified (Reduced Scope, Preserved Intent)

| Original | MVP Simplification |
|----------|-------------------|
| Three-pane resizable Findings Workspace | Two-pane: List (left) + Detail Slide-over (right) |
| AI Mentor conversational chat | Inline Teach Block (2-3 sentences) + "Explain More" expandable |
| Multiple remediation alternatives | Single Recommended Fix per finding (highest impact/effort ratio) |
| Scan modes: Quick/Deep/SYN/Docker | Single scan: Top 1000 TCP ports + live monitor (always on) |
| Exportable PDF report | JSON export only (MVP) |
| Keyboard navigation / accessibility polish | Post-MVP (Day 7 buffer if time) |
| Docker awareness | Post-MVP (V2) |
| Service fingerprinting probes | Post-MVP (V2) |

---

## 3. Simplified Dashboard Specification

### Layout: Single-Page, Three-Zone Grid

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  VULNSENTRY AI                                    [Score: 73] ████████░░  │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌─────────────────────────────────────┐  ┌─────────────────────────────┐  │
│  │        LIVE TOPOLOGY GRAPH          │  │      CRITICAL FINDINGS      │  │
│  │         (60% width)                 │  │        (40% width)          │  │
│  │                                     │  │                             │  │
│  │   ● mysqld.exe:3306  🔴 CRITICAL   │  │  🔴 1. MySQL (3306)         │  │
│  │        │                            │  │     Process: mysqld.exe     │  │
│  │   ● nginx:80,443     🟡 MEDIUM     │  │     PID: 4821               │  │
│  │        │                            │  │     Risk: 9.8/10            │  │
│  │   ● sshd:22          🟠 HIGH       │  │     [Recommended Fix] [→]    │  │
│  │                                     │  │  ─────────────────────────  │  │
│  │   [Animated pulses on connections]  │  │  🟠 2. SSH (22)             │  │
│  │   [Node size = connection count]    │  │     Password auth enabled   │  │
│  │   [Color = risk severity]           │  │     [Recommended Fix] [→]    │  │
│  │                                     │  │  ─────────────────────────  │  │
│  │   Legend: 🔴 Critical  🟠 High      │  │  🟡 3. Redis (6379)         │  │
│  │           🟡 Medium  🟢 Low         │  │     No auth configured      │  │
│  │                                     │  │     [Recommended Fix] [→]    │  │
│  └─────────────────────────────────────┘  └─────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  AI INSIGHT: "MySQL on 3306 is your #1 risk — exposes all data.   │   │
│  │  Fix: Use 'net stop MySQL' or click Recommended Fix below.          │   │
│  │  [Apply Fix (Experimental)]  [Copy Command]  [Learn More]          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [Full Scan]                    Last scan: 2 min ago    [Export JSON]     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Zone Specifications

**Zone A: Live Topology Graph (60%, Hero)**

- **Tech**: Canvas API (lighter than Three.js, ~200 lines TS)
- **Data Source**: `/api/live/connections` (SSE stream, 2s poll)
- **Nodes**: Process name + port(s), sized by connection count
- **Edges**: Animated pulses = active data flow
- **Color**: Risk severity (Critical=Red, High=Orange, Medium=Yellow, Low=Green)
- **Interaction**: Click node → opens Finding Detail slide-over
- **Empty State**: "No active connections detected" + "Start Full Scan" CTA

**Zone B: Critical Findings List (40%, Action)**

- Max 5 items (top 3 critical + next 2 high)
- Each row: Severity badge · Service:Port · Process · PID · Risk score · [Recommended Fix] [→]
- Sort: `severity / fix_difficulty` (impact/effort ratio)
- Click [→]: Opens Finding Detail slide-over (same as graph click)
- Click [Recommended Fix]: Shows remediation panel in detail view

**Zone C: AI Insight Banner (Full width, Contextual)**

- Single recommendation (highest impact/quickest win)
- Plain language, action-oriented
- Primary CTA: [Apply Fix (Experimental)] attempts automated execution
- Secondary: [Copy Command] clipboard copy
- Tertiary: [Learn More] expands teach block
- Dismiss: Removes until next scan

### Persistent Elements

- **Posture Score** (top-right): Large, animated, color-coded (🟢>70 🟡40-70 🔴<40)
- **Scan Controls** (bottom): [Full Scan] [Export JSON] + last scan timestamp
- **Live Indicator**: Pulsing dot + "LIVE" label when graph streaming

### Responsive Behavior

- **≥1200px**: Side-by-side (60/40 split)
- **<1200px**: Stacked — Graph top (50vh), Findings bottom (scrollable)
- **Mobile**: Graph collapsed by default, expandable; Findings full-width cards

---

## 4. Simplified Findings Workspace

### Two-Pane Layout (No Resizing, No Three-Pane Complexity)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FINDINGS                          [Severity ▼] [Status ▼] [Sort ▼]        │
├──────────────────────────────┬──────────────────────────────────────────────┤
│  FINDINGS LIST (320px)       │  FINDING DETAIL (slide-over, 480px)         │
│  ──────────────────────────  │  ─────────────────────────────────────────  │
│                              │                                              │
│  🔴 MySQL (3306)             │  ┌─────────────────────────────────────┐   │
│     mysqld.exe · PID 4821    │  │  MySQL Database Exposure            │   │
│     Risk: 9.8  [Rec. Fix] [→]│  │  ─────────────────────────────────  │   │
│                              │  │  WHAT: Port 3306 open, no auth      │   │
│  🟠 SSH (22)                 │  │  PROCESS: mysqld.exe (PID 4821)     │   │
│     sshd.exe · PID 1240      │  │  PATH: C:\Program Files\MySQL\...    │   │
│     Risk: 7.2  [Rec. Fix] [→]│  │  RISK: Any local process can read  │   │
│                              │  │  your databases without password.  │   │
│  🟡 Redis (6379)             │  │  ─────────────────────────────────  │   │
│     redis-server · PID 3102  │  │  WHY IT MATTERS (Teach Block):    │   │
│     Risk: 5.4  [Rec. Fix] [→]│  │  "Databases listen on ports so    │   │
│                              │  │  apps can connect. When auth is   │   │
│  🔵 HTTP (80)                │  │  disabled, ANY program on your    │   │
│     nginx.exe · PID 2201     │  │  machine — including malware —    │   │
│     Risk: 2.1  [→]           │  │  can steal or corrupt your data.  │   │
│                              │  │  This is the #1 cause of local   │   │
│  🔵 HTTPS (443)              │  │  data leaks in dev environments." │   │
│     nginx.exe · PID 2201     │  │  ─────────────────────────────────  │   │
│     Risk: 1.8  [→]           │  │  REMEDIATION:                      │   │
│                              │  │  ┌─────────────────────────────┐  │   │
│  [12 findings total]         │  │  │ net stop MySQL              │  │   │
│                              │  │  │ (Stops service, closes port)│  │   │
│                              │  │  └─────────────────────────────┘  │   │
│                              │  │  [Apply Fix (Experimental)]       │   │
│                              │  │  [Copy Command]  [Learn More]     │   │
│                              │  └─────────────────────────────────────┘   │
└──────────────────────────────┴──────────────────────────────────────────────┘
```

### Findings List — MVP Spec

| Column | Content | Visual |
|--------|---------|--------|
| **Severity** | 🔴🟠🟡🔵 badge | Color-coded, 24px |
| **Service:Port** | "MySQL (3306)" | Bold, monospace port |
| **Process** | "mysqld.exe" | Monospace, truncated |
| **PID** | "4821" | Monospace, muted |
| **Risk Score** | "9.8/10" | Large, color-matched |
| **Actions** | [Rec. Fix] [→] | Primary + secondary |

### Finding Detail — MVP Spec

| Section | Content | Implementation |
|---------|---------|----------------|
| **Header** | Service name, severity badge, port | Static data |
| **Process Info** | Name, PID, full path, command line | From `process_resolver.py` |
| **Risk Explanation** | 2-3 sentence plain language | Pre-written per rule in `risk_engine.py` |
| **Teach Block** | Contextual "Why this matters" | Gemini-generated on first load, cached |
| **Remediation** | Command + explanation | Hard-coded per rule in `remediation_rules.py` |
| **Actions** | [Apply Fix (Experimental)], [Copy Command], [Snooze], [Dismiss] | Local state only |
| **Explain More** | Expandable deeper explanation | Gemini-generated, cached |

### Interaction Flow

1. **Discovery**: List loads pre-grouped by severity (critical first)
2. **Selection**: Click row or graph node → detail panel slides in
3. **Exploration**: Detail shows What → Process → Why → Teach → Remediation
4. **Resolution**: User copies command, runs manually, or clicks [Apply Fix (Experimental)]
5. **Verification**: Re-scan shows delta — finding disappears or drops severity

---

## 5. Simplified Verification Experience

### Layout: Side-by-Side Delta Comparison

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  VERIFICATION                                        [Score: 58 → 87 ████] │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌──────────────────────────┐  ┌──────────────────────────┐                │
│  │     BEFORE SCAN          │  │      AFTER SCAN          │                │
│  │     (Score: 58)          │  │      (Score: 87)         │                │
│  │     ───────────          │  │      ───────────         │                │
│  │                          │  │                          │                │
│  │  🔴 MySQL (3306)         │  │  🟡 SSH (22)             │                │
│  │     Risk: 9.8            │  │     Risk: 5.1            │                │
│  │                          │  │     (password auth now)  │                │
│  │  🟠 SSH (22)             │  │                          │                │
│  │     Risk: 7.2            │  │  🔵 HTTP (80)            │                │
│  │                          │  │     Risk: 2.1            │                │
│  │  🟡 Redis (6379)         │  │                          │                │
│  │     Risk: 5.4            │  │  🔵 HTTPS (443)          │                │
│  │                          │  │     Risk: 1.8            │                │
│  │  🔵 HTTP (80)            │  │                          │                │
│  │     Risk: 2.1            │  │  ✓ 2 findings resolved   │                │
│  │                          │  │  ✓ Attack surface: -20%  │                │
│  │  🔵 HTTPS (443)          │  │  ✓ 2 services secured   │                │
│  │     Risk: 1.8            │  │                          │                │
│  │                          │  │  [Run Full Re-Scan]      │                │
│  │  5 findings total        │  │                          │                │
│  └──────────────────────────┘  └──────────────────────────┘                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  TRANSFORMATION SUMMARY                                             │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │  Posture Score: 58 → 87  (+29 points)                              │   │
│  │  Attack Surface: 5 open services → 3 (40% reduction)               │   │
│  │  Critical Findings: 1 → 0 (fully resolved)                         │   │
│  │  Time to improve: ~3 minutes                                       │   │
│  │                                                                     │   │
│  │  [Share Snapshot]  [Export JSON]  [Return to Dashboard]            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### State: No Previous Scan (First Run)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  VERIFICATION                                             [Score: 73 ████] │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │                    ⏱  No previous scan to compare                    │   │
│  │                                                                     │   │
│  │       Run a scan first, then come here to see your improvement.     │   │
│  │                                                                     │   │
│  │       [Start First Scan]                                            │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Score Delta Animation Sequence

1. Before scan renders on left (muted, static)
2. After scan renders on right (full color, animated entrance)
3. Resolved findings animate: red → green check with checkmark appear
4. Score counter animates from old value to new value (paced: 1 point per 200ms)
5. Transformation summary fades in below
6. User can toggle between side-by-side and overlay (difference highlighting)

---

## 6. Posture Score System

### Score Display (Top-Right, Persistent)

```
┌─────────────────────────────────────────────────────────────────┐
│  VULNSENTRY AI                [Score: 73] ████████░░  +3 today │
└─────────────────────────────────────────────────────────────────┘
```

### Score Calculation (Simplified for MVP)

```
Score = 100 - (sum(weighted_risks) / max_possible_risk) * 100

Where:
  - Each finding contributes risk_weight based on severity + exposure
  - Critical = 25, High = 15, Medium = 8, Low = 3
  - max_possible_risk = 100 (calibrated for top-1000 port scan)
```

### Score Color Thresholds

| Range | Color | Label | User Interpretation |
|-------|-------|-------|---------------------|
| 80-100 | 🟢 Green | Strong | "Your machine is well-protected" |
| 50-79 | 🟡 Yellow/Amber | Moderate | "Some attention needed" |
| 0-49 | 🔴 Red | Critical | "Immediate action required" |

### Score Animation Behavior

- **On load**: Number counts up from 0 to current score (500ms)
- **On improvement**: Number animates from old to new; bar fills with green pulse
- **On regression**: Number animates down; bar shrinks with amber flash
- **Tooltip on hover**: Shows breakdown (critical count / high count / total services)

---

## 7. Topology Graph Design System

### MVP Scope: Live Connection Graph (Not Enterprise Topology)

Unlike enterprise topology tools that map networks, containers, cloud resources, and dependencies, the MVP graph maps **active OS processes + their listening ports** on the local machine. This is a deliberate simplification that preserves the "wow" of a live, breathing graph while remaining implementable in <200 lines of Canvas code.

### Node Types

| Type | Visual | Size | Example |
|------|--------|------|---------|
| **Process** | Circle | Radius = connection count × 8 (min 16px) | `mysqld.exe` |
| **Port** | Small dot, attached to process | 8px | `3306` |
| **Internet** | Cloud icon (SVG, top of canvas) | Fixed 32px | `WAN` |

### Node Hierarchy

```
      [INTERNET] ──────────────────┐
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
              [mysqld.exe]   [nginx.exe]    [sshd.exe]
                   │              │              │
                   ▼              ▼              ▼
                :3306          :80 :443         :22
              🔴 CRITICAL    🟡 MEDIUM       🟠 HIGH
```

### Color Language

| Severity | Color | Hex | Meaning |
|----------|-------|-----|---------|
| Critical | Red | `#EF4444` | Immediate risk (public-facing, no auth) |
| High | Orange | `#F97316` | Significant risk (exposed, weak config) |
| Medium | Yellow | `#EAB308` | Moderate risk (internal, outdated) |
| Low | Green | `#22C55E` | Low risk (optional hardening) |
| Resolved | Muted Green | `#86EFAC` | Was previously critical, now fixed |

### Motion Language

| Animation | Duration | Trigger | Purpose |
|-----------|----------|---------|---------|
| Node pulse | Continuous | Active connection | Shows life |
| Edge pulse | 2s cycle | Data flow | Shows activity direction |
| Node appear | 300ms ease-out | New process detected | Draws attention to change |
| Node disappear | 200ms fade | Process stopped | Clean removal |
| Severity color shift | 400ms | Risk level changes | Visceral feedback |
| Graph repulse | 500ms ease | Score improved | Subtle celebration |

### Connection Language

| Connection Type | Line Style | Example |
|-----------------|-----------|---------|
| Active TCP | Solid, animated pulse | `mysqld.exe → 3306` |
| Listening (no connections) | Dashed, static | `httpd.exe → 80 (idle)` |
| Resolved (previously risky) | Faded green, fading out | Fixed port |

### Interaction Model

| Action | Result |
|--------|--------|
| **Hover node** | Highlight connected edges, show tooltip (process name, PID, port, risk) |
| **Click node** | Open Finding Detail slide-over for that process:port pair |
| **Hover edge** | Show connection type (TCP/UDP) + state (LISTEN/ESTABLISHED) |
| **Double-click canvas** | Recenter and zoom to fit all nodes |
| **Scroll** | Zoom in/out (min 0.5x, max 3x) |
| **Drag** | Pan canvas |

### Instant Understanding Guarantee

A user must understand the graph within 3 seconds. To guarantee this:

1. **Max 8 visible nodes** — if more processes detected, cluster least-risky into "Other (N)" group
2. **Critical nodes glow** — pulsing red ring draws eye immediately
3. **Severity legend** — always visible bottom-right of graph
4. **Process name + port** always visible on node (no pure-icon nodes)
5. **Empty state is impossible** — if no processes, show "Monitor running... check back in 2s" with pulsing indicator

---

## 8. Teaching Layer

### MVP Scope: Inline Teach Blocks (Not Conversational AI Mentor)

The MVP teaching layer is a set of pre-written and Gemini-generated explainer blocks embedded directly in the Finding Detail panel. There is no persistent chat bot, no threaded conversation, and no AI Mentor avatar. This preserves educational value while eliminating chat state management and conversation context overhead.

### Teach Block Structure

Every teach block follows the same template:

```
WHY IT MATTERS
──────────────
[2-3 sentences in plain language explaining what this finding means]

FIX THIS
────────
[One command-line remediation, with explanation of what it does]

WHY THIS FIX WORKS
──────────────────
[1-2 sentences explaining the mechanism]
```

### Example — MySQL (3306)

```
WHY IT MATTERS
──────────────
Databases listen on ports so apps can connect. When authentication is
disabled, ANY program on your machine — including malware — can steal or
corrupt your data. This is the #1 cause of local data leaks in dev
environments.

FIX THIS
────────
> net stop MySQL
(Stops the MySQL service and closes port 3306)

WHY THIS FIX WORKS
──────────────────
Stopping the service kills the process that's listening on port 3306.
Once the process is gone, the port closes and no program can connect
to your database.
```

### Progressive Disclosure Architecture

| Layer | Content | Trigger | User |
|-------|---------|---------|------|
| **L1 — Glance** | 1-line summary in Findings list | Always visible | Everyone |
| **L2 — Understanding** | "WHY IT MATTERS" block | Default expanded | Beginners |
| **L3 — Action** | "FIX THIS" command | Default expanded | Everyone |
| **L4 — Deeper** | "WHY THIS FIX WORKS" | Collapsed, click "Learn More" | Intermediate |
| **L5 — Technical** | Process path, full command line, port state | Collapsed, click "Show Technical" | Advanced |

### Gemini Integration

| Trigger | Prompt | Cache Strategy |
|---------|--------|----------------|
| Finding detail loaded | "Explain (finding) in 2-3 plain English sentences. Target: junior developer." | Per-session cache (Map<finding_id, string>) |
| "Learn More" clicked | "Explain (finding) technical detail. Include attack mechanism and remediation rationale." | Per-session cache |
| "Show Technical" clicked | Return raw data (no LLM needed) | N/A — static data |

### Anti-Abuse Guard

- All prompts include: "Do not invent technical details. If uncertain, say 'This requires further investigation.'"
- Cached blocks cannot be regenerated more than once per finding per session
- Network timeout: 5s — if Gemini is unavailable, fall back to static hard-coded explanation

---

## 9. AI Mentor — MVP Specification

### MVP Scope: Contextual Recommendation Panel (Not Chat Bot)

The AI Mentor in MVP is a single contextual recommendation banner on the Dashboard and a set of inline teach blocks in the Finding Detail. It does not have a persistent chat interface, conversation history, or avatar.

### Dashboard AI Insight Banner

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  AI INSIGHT                                                                 │
│  ────────────────────────────────────────────────────────────────────────  │
│  "MySQL on port 3306 is your #1 risk — it exposes your database to every  │
│   program running on this machine. Fix: Stop the MySQL service, or set     │
│   a root password. You can copy the fix command below."                    │
│                                                                            │
│  [Copy Command]  [Learn More]  [Dismiss]                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### AI Mentor Interaction Model

| Trigger | Response |
|---------|----------|
| Dashboard loads | Show single highest-impact recommendation in banner |
| Finding detail opens | Show teach block for that specific finding |
| "Learn More" clicked | Expand deeper technical explanation |
| "Dismiss" clicked | Collapse banner until next scan |
| Scan completes | Update recommendation based on new findings |

### AI Mentor Constraints (MVP)

- No persistent conversation history
- No chat UI / message list
- No avatar or personification
- No streaming responses (block generation only)
- Single recommendation at a time
- Max 3 sentences per recommendation
- Copy command + learn more expandable only

---

## 10. Scan Experience

### MVP Scope: Single Scan Mode (Top 1000 TCP Ports)

No quick/deep/docker/selective modes. The scan always checks the top 1000 TCP ports plus all currently active listening ports reported by the OS. The user starts a scan, watches progress, and sees results stream in.

### State: Idle (Default, First Launch)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  No scan yet. Ready when you are.                                          │
│                                                                            │
│  [Start Scan]  ·  Scans top 1000 TCP ports · Takes ~15-30 seconds          │
└─────────────────────────────────────────────────────────────────────────────┘
```

Wait... wait. No. That violates Principle 1 (Immediate Insight).

Revised: On first launch, the live monitor is already running. The graph is already populated with active connections from netstat output. There is no "Press Scan to begin" moment — the system is already alive.

The Full Scan button triggers the deeper port probe, but the user already sees value from the moment they open the app.

### Revised State: Live (Always-On Monitor Running)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  VULNSENTRY AI                                    [Score: 73] ████████░░  │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  [Graph already populated with live connections from netstat]              │
│                                                                             │
│  Full scan available for deeper analysis:                                  │
│  [Run Full Scan]  ·  Last live check: 2s ago                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Scan Progress: Loading

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Full scan in progress...                                                  │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ████████████░░░░░░░░░░  1423 / 1000 ports scanned                         │
│                                                                             │
│  [●] Discovery      [●] Assessment    [●] Correlation     [○] Complete     │
│                                                                             │
│  Live findings streaming in:                                               │
│    🔴 NEW  MySQL (3306) — mysqld.exe — Risk: 9.8                           │
│    🟠 NEW  SSH (22) — sshd.exe — Risk: 7.2                                 │
│    🟡 NEW  Redis (6379) — redis-server.exe — Risk: 5.4                     │
│                                                                             │
│  [Pause]  [Background]  [Skip to Results]                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Scan Progress: Live Streaming

As each port is scanned, findings appear in real-time in a scrollable overlay. The topology graph updates live — new nodes appear with a fade-in animation, edges draw with a stroke animation.

### Scan Complete

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Scan complete — 27 ports open, 5 findings                                 │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌──────────┬──────────┬──────────┬──────────┐                             │
│  │ CRITICAL │   HIGH   │  MEDIUM  │   LOW    │                             │
│  │    1     │    1     │    2     │    1     │                             │
│  └──────────┴──────────┴──────────┴──────────┘                             │
│                                                                             │
│  Top Risk: MySQL (3306) — Risk: 9.8/10                                     │
│                                                                             │
│  [Review Findings]  [View Topology]  [Go to Verification]                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Transition to Verification

After scan completes:
1. Score display animates from previous → new value
2. "View Verification" button appears with delta badge ("+14 since last scan")
3. Clicking navigates to Verification view with Before/After comparison automatically populated

---

## 11. Demo Script — 90-Second Judge Flow

### Opening (0s — 15s) — App Launch

**Screen**: Dashboard loads

**What judge sees**: Live topology graph already breathing. Score: 73. "3 Critical Findings" badge. Process nodes with animated connections. It looks alive before anyone clicked anything.

**Narrator**: "This is VulnSentry AI. It's watching your machine's security posture — live, from the moment you open it."

### Discovery (15s — 30s)

**Screen**: Click a critical finding → Detail slide-over opens

**What judge sees**: Process info, risk explanation, teach block, Recommended Fix with copy command.

**Narrator**: "Click any finding and VulnSentry shows you what's happening, why it matters, and exactly how to fix it. No guesswork."

### Understanding (30s — 45s)

**Screen**: "Learn More" expanded → deeper explanation + attack path

**What judge sees**: Progressive disclosure — from plain language to technical detail. AI-generated context.

**Narrator**: "The AI explains every finding in plain language. Beginners learn, experts get the detail they need."

### Improvement (45s — 60s)

**Screen**: Apply Fix (Experimental) clicked → command copied → user runs it

**What judge sees**: Minimal friction — command is copied, user pastes into terminal, service stops.

**Narrator**: "Apply Fix (Experimental) attempts automated remediation. At minimum, the command is copied and ready to run. No navigating to settings panels or searching Stack Overflow."

### Verification (60s — 75s)

**Screen**: Navigate to Verification → Before/After delta

**What judge sees**: Side-by-side comparison. Score: 73 → 87. MySQL finding is gone. Attack surface reduced 20%.

**Narrator**: "Re-scan confirms the fix. The score went from 73 to 87. You can see exactly what changed."

### Close (75s — 90s)

**Screen**: Final score animation + transformation summary

**What judge sees**: Score animates to final value. Green checkmark animation. "2 findings resolved. Attack surface: -20%."

**Narrator**: "VulnSentry AI — Your Machine's Immune System. Observe. Understand. Improve. Verify."

---

## 12. Component Inventory (Frontend)

### Pages / Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `DashboardPage` | Live topology graph + critical findings list + AI insight banner |
| `/findings` | `FindingsPage` | Two-pane findings workspace |
| `/findings/:id` | `FindingDetailPage` | Slide-over detail with teach block + remediation |
| `/verification` | `VerificationPage` | Before/after delta comparison + score evolution |

### Shared Components

| Component | Props | Used By |
|-----------|-------|---------|
| `TopologyGraph` | `connections: Connection[]`, `onNodeClick: (id) => void` | Dashboard |
| `FindingsList` | `findings: Finding[]`, `onSelect: (id) => void`, `filters: FilterState` | Dashboard, Findings |
| `FindingCard` | `finding: Finding`, `onFix: (id) => void`, `onSelect: (id) => void` | FindingsList |
| `FindingDetail` | `finding: Finding`, `mentorContext: MentorBlock` | FindingDetailPage |
| `TeachBlock` | `finding: Finding`, `depth: 'basic' \| 'deep' \| 'technical'` | FindingDetail |
| `ScoreBadge` | `score: number`, `delta?: number`, `size: 'sm' \| 'lg'` | Persistent header |
| `DeltaComparison` | `before: Finding[]`, `after: Finding[]`, `beforeScore: number`, `afterScore: number` | Verification |
| `AiInsightBanner` | `finding: Finding`, `onDismiss: () => void` | Dashboard |
| `ScanProgress` | `progress: ScanState`, `findings: Finding[]` | Dashboard (modal) |
| `ScanButton` | `onStart: () => void`, `isScanning: boolean` | Dashboard |
| `RecommendationPanel` | `finding: Finding`, `onApply: () => void`, `onCopy: () => void` | FindingDetail |

### Data Models (TypeScript)

```typescript
interface Finding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  serviceName: string;
  port: number;
  protocol: 'tcp' | 'udp';
  processName: string;
  processPid: number;
  processPath?: string;
  riskScore: number; // 0-10
  ruleId: string;
  status: 'open' | 'mitigated' | 'dismissed' | 'snoozed';
  teachBlock?: string;
  remediation?: Remediation;
  discoveredAt: string;
}

interface Remediation {
  command: string;
  description: string;
  os: 'windows' | 'linux' | 'macos';
  requiresAdmin: boolean;
}

interface Connection {
  processName: string;
  processPid: number;
  processPath?: string;
  port: number;
  protocol: 'tcp' | 'udp';
  state: 'listening' | 'established' | 'time_wait';
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface ScanState {
  status: 'idle' | 'running' | 'complete' | 'error';
  progress: number; // 0-100
  phase: 'discovery' | 'assessment' | 'correlation';
  findings: Finding[];
  startedAt?: string;
  completedAt?: string;
}
```

---

## 13. Directory Structure (Simplified for MVP)

```
vulnsentry-ai/
├── frontend/
│   ├── src/
│   │   ├── App.tsx                      # Router + layout
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx         # Live graph + findings + AI insight
│   │   │   ├── FindingsPage.tsx          # Two-pane findings workspace
│   │   │   ├── FindingDetailPage.tsx     # Detail slide-over
│   │   │   └── VerificationPage.tsx      # Before/after delta
│   │   ├── components/
│   │   │   ├── TopologyGraph.tsx         # Canvas-based live graph
│   │   │   ├── FindingsList.tsx          # Filterable findings list
│   │   │   ├── FindingCard.tsx           # Individual finding row
│   │   │   ├── FindingDetail.tsx         # Detail panel
│   │   │   ├── TeachBlock.tsx            # AI explainer block
│   │   │   ├── ScoreBadge.tsx            # Posture score display
│   │   │   ├── DeltaComparison.tsx       # Before/after comparison
│   │   │   ├── AiInsightBanner.tsx       # Dashboard recommendation
│   │   │   ├── ScanProgress.tsx          # Scan progress overlay
│   │   │   ├── ScanButton.tsx            # Scan trigger
│   │   │   └── RecommendationPanel.tsx   # Fix display + copy
│   │   ├── hooks/
│   │   │   ├── useLiveConnections.ts     # SSE stream for graph data
│   │   │   ├── useScan.ts               # Scan lifecycle management
│   │   │   └── useMentor.ts             # Gemini teach block caching
│   │   ├── services/
│   │   │   ├── api.ts                   # FastAPI client
│   │   │   ├── gemini.ts                # Gemini integration
│   │   │   └── scanner.ts               # Port scan state mgmt
│   │   ├── types/
│   │   │   └── index.ts                 # All TS interfaces
│   │   └── styles/
│   │       └── global.css                # Token-based CSS
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── backend/
│   ├── main.py                           # FastAPI entry point
│   ├── routers/
│   │   ├── connections.py                 # GET /api/live/connections (SSE)
│   │   ├── scan.py                        # POST /api/scan, GET /api/scan/status
│   │   ├── findings.py                    # GET /api/findings, GET /api/findings/:id
│   │   └── remediation.py                 # POST /api/remediate (experimental)
│   ├── services/
│   │   ├── connection_monitor.py          # psutil/netstat polling
│   │   ├── port_scanner.py               # socket-based port scanning
│   │   ├── risk_engine.py                # 30-rule risk evaluation
│   │   ├── process_resolver.py           # PID → process name/path
│   │   ├── remediation_engine.py         # Command generation
│   │   └── gemini_service.py             # Teach block generation
│   ├── models/
│   │   └── schemas.py                    # Pydantic models
│   └── requirements.txt
└── README.md
```

**Total file count**: ~35 files  
**Estimated implementation time**: 7 days (solo)

---

## 14. Day-by-Day Implementation Plan

### Day 1: Foundation (Backend)

```
Goal: Working FastAPI server with connection monitor + port scanner

Morning (4h)
  - Initialize project structure
  - FastAPI server with CORS, health endpoint
  - Pydantic models (Finding, Connection, ScanState)
  - /api/live/connections endpoint
    - psutil-based connection polling
    - SSE streaming

Afternoon (4h)
  - /api/scan endpoint (trigger asynchronous)
  - /api/scan/status endpoint (poll for completion)
  - socket-based port scanner (top 1000 TCP)
  - /api/findings endpoint
    - Return findings from latest scan
```

### Day 2: Risk Engine + Backend Polish

```
Goal: Findings have risk scores, process resolution, remediation commands

Morning (4h)
  - risk_engine.py (30-rule dictionary)
    - Port-based rules (3306 → critical, 22 → high, 6379 → medium, etc.)
    - Process-aware rules (MySQL without auth → critical + 1)
    - Service exposure rules (listening on 0.0.0.0 → +2 risk)
  - process_resolver.py
    - PID → process name + path
    - Service/display name resolution

Afternoon (4h)
  - remediation_engine.py
    - Per-rule command generation
    - OS-aware (windows vs linux commands)
    - Admin requirement flagging
  - /api/findings/:id endpoint (full detail)
  - /api/remediate POST (experimental execution)
```

### Day 3: Gemini Integration

```
Goal: Teach blocks and AI recommendations powered by Gemini

Morning (4h)
  - gemini_service.py
    - Prompt templates for teach blocks
    - Prompt templates for recommendations
    - Response parsing
  - Cache layer (in-memory per-session)

Afternoon (4h)
  - AI Insight banner data generation
  - "Explain More" depth levels
  - Fallback to static explanations when Gemini unavailable
  - Rate limiting and timeout guards
```

### Day 4: React Foundation + Dashboard

```
Goal: Working React app with live dashboard

Morning (4h)
  - Vite + React + TypeScript setup
  - TypeScript interfaces (Finding, Connection, ScanState)
  - API client module
  - TopologyGraph component (Canvas API)
    - Node rendering with severity colors
    - Edge drawing with animated pulses
    - Click/hover interaction

Afternoon (4h)
  - FindingsList component
  - FindingsCard component
  - ScoreBadge component
  - DashboardPage layout (graph + list + AI banner)
  - SSE stream integration (useLiveConnections hook)
```

### Day 5: Findings Workspace + Teach Blocks

```
Goal: Full findings detail experience with AI explanations

Morning (4h)
  - FindingsPage layout (two-pane)
  - FindingDetail component
  - RecommendationPanel component
  - Filter/sort/group controls

Afternoon (4h)
  - TeachBlock component (basic/deep/technical)
  - useMentor hook (Gemini caching)
  - AiInsightBanner component
  - ScanProgress + ScanButton components
```

### Day 6: Verification + Scoring + Animation

```
Goal: Before/after comparison, score evolution, celebrations

Morning (4h)
  - VerificationPage layout
  - DeltaComparison component
  - Score delta animation
  - Verification empty state (first run)

Afternoon (4h)
  - Verification complete state
  - Transformation summary
  - 90-second demo flow testing
  - ScoreBadge animation (count-up, pulse on change)
  - Dismiss/Snooze state management
```

### Day 7: Polish + Demo Prep

```
Goal: Demo-ready product

Morning (4h)
  - Cross-browser testing
  - Error states (API down, Gemini timeout, permission denied)
  - Loading states for all async operations
  - Empty states for all views

Afternoon (4h)
  - Copy-to-clipboard for remediation commands
  - JSON export
  - README with setup instructions
  - Demo script walkthrough
  - Buffer for unexpected issues
```

---

## 15. MVP UX Freeze — Final Scope

### Delivered

| Component | Status | Priority |
|-----------|--------|----------|
| Live topology graph (Canvas) | ✅ MVP | P0 |
| SSE stream (2s poll) | ✅ MVP | P0 |
| Full scan (top 1000 TCP) | ✅ MVP | P0 |
| Findings list (sorted, filtered) | ✅ MVP | P0 |
| Finding detail slide-over | ✅ MVP | P0 |
| Process resolution (PID → name) | ✅ MVP | P0 |
| Risk scoring (30-rule engine) | ✅ MVP | P0 |
| Teach blocks (plain language) | ✅ MVP | P0 |
| Recommended Fix (display + copy) | ✅ MVP | P0 |
| Apply Fix (Experimental) | ✅ MVP (optional execution) | P0 |
| Before/After verification | ✅ MVP | P0 |
| Posture Score (0-100) | ✅ MVP | P0 |
| Score delta animation | ✅ MVP | P0 |
| AI Insight banner | ✅ MVP | P1 |
| "Learn More" expandable | ✅ MVP | P1 |
| Dismiss/Snooze | ✅ MVP | P1 |
| JSON export | ✅ MVP | P2 |
| Responsive layout | ✅ MVP | P2 |

### Not Delivered (MVP)

| Component | Rationale | Future |
|-----------|-----------|--------|
| Threat Intelligence | External dependency, scope creep | V2 |
| Compliance Frameworks | Enterprise-only | V3 |
| SOC Workflows | Multi-user requirement | V3 |
| Asset Inventory | Persistent storage requirement | V2 |
| Historical Analytics | Database requirement | V2 |
| Ticketing System | External integration | V3 |
| Conversational AI Mentor | State management overhead | V2 |
| Docker awareness | Scope expansion | V2 |
| Service fingerprinting | Accuracy tuning required | V2 |
| PDF export | Library dependency | V2 |
| Keyboard navigation | Accessibility polish | Post-MVP |
| Multi-platform scan modes | UX complexity | V2 |

### Architecture Freeze Sign-Off

The following is the final, frozen architecture for the VulnSentry AI MVP. No new features, no new views, no new data sources may be added without explicit re-alignment.

```
FINAL SCOPE:

  Views:      Dashboard · Findings · Finding Detail · Verification
  Data:       Live connections (netstat) · Port scan (top 1000 TCP)
  Scoring:    30-rule risk engine · Posture score 0-100
  AI:         Teach blocks · Contextual recommendations (Gemini)
  Actions:    Recommended Fix · Apply Fix (Experimental) · Copy · Dismiss · Snooze
  Export:     JSON
  Auth:       None (localhost-only)
  Storage:    None (in-memory session only)
  Cloud:      None
  Database:   None
```

**VulnSentry AI — Your Machine's Immune System**  
**Observe · Understand · Improve · Verify**
