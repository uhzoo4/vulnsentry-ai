# VULNSENTRY AI — FINAL MASTER BLUEPRINT

**Tagline:** Your Machine's Immune System
**Status:** Architecture Frozen — Implementation Ready
**Scope:** Solo developer · 7-day hackathon build · Localhost + private subnet only · No cloud · No database
**Stack:** Python 3.11+ / FastAPI (backend) · React 18 + TypeScript + TailwindCSS (frontend) · Gemini API (AI layer)

This document is the single source of truth for the VulnSentry AI MVP. It supersedes all prior drafts. Where earlier documents (the original PRD, TRD, and Feasibility Report) conflict with the Architectural Reconstruction or the MVP UX Architecture Alignment, the more recent documents govern. No section of this blueprint introduces a feature, view, or technical approach that is not already present in the source material. This is synthesis, not invention.

---

## 1. Executive Summary

VulnSentry AI is a local-machine security companion that turns an opaque, jargon-heavy question — "what is my computer exposing to the network?" — into a live, visual, actionable answer. It runs entirely on the user's own machine, watches active network connections in real time from the moment the application opens, lets the user run a deeper one-time port scan on demand, explains every finding in plain language, offers a single best-fix recommendation per issue, and proves the fix worked by comparing the machine's security posture before and after.

The product exists because traditional tools force a choice between raw technical power (Nmap, Wireshark) and generic AI chat (HackMentor, RootTron). Neither tells a beginner what is wrong with *their* machine, why it matters, or how to fix it in one click. VulnSentry AI closes that gap by combining three things no single competing tool combines: a live, always-on connection graph that requires no scan to produce value; process-level attribution (which program owns which exposed port); and a closed-loop verification step that shows the user their security posture score improve as a direct result of an action they took.

The MVP is scoped for a single developer working seven days, with zero infrastructure beyond a local FastAPI server and a local React SPA. There is no authentication, no database, no cloud deployment, and no external scanning. The entire system is bound to `127.0.0.1` and RFC 1918 private address ranges by hard constraint, both at the network layer and in application middleware.

---

## 2. Product Vision

VulnSentry AI envisions a world where understanding the security posture of a personal machine is as immediate and intuitive as checking a fitness tracker. The product is not a scanner that a user operates — it is a monitor that is always watching, always explaining, and always offering the next best action. The long-term vision (outside this MVP's frozen scope) extends this same loop — observe, understand, improve, verify — to historical trends, scheduled monitoring, and team-shared posture dashboards. None of that is built in this version; it exists only to clarify the direction the frozen MVP is a first step toward.

The defining design idea is the shift in verb from **scan** to **understand**, and from **report** to **improve**. Every other tool in this space answers "what ports are open?" VulnSentry AI answers "what is my machine doing, what's wrong with it, and how do I make it better?" That shift in verb is the entire product strategy, and it governs every UX and architectural decision in this document.

---

## 3. Product Positioning

| Dimension | Nmap / Wireshark | HackMentor / RootTron (AI security chat) | VulnSentry AI (MVP) |
|---|---|---|---|
| Primary audience | Professionals / experts | Security researchers | Students, homelab users, developers |
| Ease of use | Low (CLI / complex GUI) | Medium (chat-based) | High (visual dashboard, zero config) |
| Time to first insight | 30–120 seconds (manual scan + read) | 60–120 seconds (copy/paste into chat) | ~2 seconds (live graph populated on load) |
| Actionable insight | Raw technical data | General security advice | Specific, local, process-attributed |
| Remediation | Manual (user reads, user fixes) | None | One-click fix with explicit confirmation |
| Learning focus | Tool mastery | Concept exploration | Practical risk understanding, tied to the user's own machine |
| Visual identity | Terminal text | Chat window | Animated topology graph + posture score |

VulnSentry AI does not compete with Nmap on scanning depth, and it does not compete with general AI chat tools on conversational breadth. It competes on a single axis: closing the loop between *finding a problem* and *seeing it fixed*, on the user's own machine, in under two minutes.

---

## 4. Core Narrative

The product story has a beginning, middle, and end, and the UI is built to deliver all three in a single sitting.

**Beginning — "Your machine is already talking."** The user opens VulnSentry AI. There is no empty screen and no "click to scan" button standing between the user and value. A live, animated network graph is already populated with the machine's current active connections. Tiny labeled nodes represent running services; a Security Posture Score is visible in the corner; a badge reads "3 critical findings need your attention." The user has done nothing yet, and the application has already shown them something true and specific about their own machine.

**Middle — "The diagnosis."** The user clicks a glowing red node — a MySQL service on port 3306. A detail panel slides open showing exactly which process owns that port (`mysqld.exe`, PID 4821, full executable path), what the risk is in plain language, and what it would take to fix it. A ranked list of the next most important findings sits alongside it, ordered by impact divided by effort, so the user always knows what to do first.

**End — "The transformation."** The user copies the recommended fix command (or, if they accept the experimental automated path, clicks Apply Fix). The port closes. A re-scan confirms it. The Security Posture Score animates upward — 58 to 87 — and a transformation summary states plainly what changed: two findings resolved, attack surface reduced by 40%, time to improve: about three minutes. The user watched their own machine get measurably safer, and they know exactly what they did to cause it.

This narrative — not a feature list — is what every screen in this document is built to deliver.

---

## 5. Observe → Understand → Improve → Verify

This four-stage loop is the structural backbone of the entire product. Every screen, every component, and every API endpoint in this blueprint maps to exactly one stage.

| Stage | What It Means | MVP Mechanism | Emotional Target |
|---|---|---|---|
| **Observe** | The user sees what their machine is doing without taking any action | Live connection graph, polled every 2 seconds via `psutil`/`netstat`, streamed to the frontend over SSE | Curiosity — "it's already alive" |
| **Understand** | The user learns what a finding means and why it matters | Ranked findings list, Finding Detail panel with process-to-port mapping, plain-language Teach Block | Recognition — "oh, that's MY MySQL server" |
| **Improve** | The user takes a concrete remediation action | Recommended Fix display with copy-to-clipboard, optional experimental one-click execution | Agency — "I can fix this myself" |
| **Verify** | The user confirms the action worked | Before/After delta comparison, Posture Score evolution with animated count-up | Satisfaction — "the score went from 58 to 87" |

No feature in this product exists outside this loop. If a proposed addition does not map cleanly to Observe, Understand, Improve, or Verify, it is out of scope for this MVP by definition.

---

## 6. Problem Statement

Traditional port scanners and security tools present highly technical output that is incomprehensible to the people most likely to benefit from it. A result such as `22/tcp open ssh` or `3306/tcp open mysql` tells a beginner nothing about the significance of the service, the risk of exposing it, the severity of the underlying issue, or what to do about it. This gap leaves three groups underserved:

A computer science student running a homelab understands networking theory but has no tool that connects that theory to the specific state of their own machine. A homelab user managing a personal media or file server cares about security but lacks the expertise to interpret scanner output. A developer running local services wants a fast, specific answer to "am I accidentally exposing something before I deploy this?" — not a wall of raw port data they have to research independently.

Existing AI-assisted tools partially address the language gap but not the specificity gap: they explain security concepts in general terms without reference to what is actually running on the user's machine, who owns it, or how to verify a fix worked. VulnSentry AI is built to close both gaps simultaneously — plain language, anchored to the user's own machine, with a verifiable before/after loop.

---

## 7. Target Users

**Primary — Student (e.g., Alex, 20, Computer Science Major).** Learning networking and cybersecurity theory, running a small homelab of virtual machines, wants to connect classroom knowledge to the real state of their own setup without being overwhelmed by jargon.

**Primary — Homelab User (e.g., Maria, 35, IT Enthusiast).** Runs a home server for media and personal projects, cares about security, lacks deep expertise, wants the tool to scan, identify risk, and explain the fix in plain language.

**Primary — Developer (e.g., Ben, 28, Web Developer).** Frequently runs local services and wants a fast check before deploying — has this development environment accidentally exposed something it shouldn't have?

**Secondary — Small development teams** performing informal security checks on internal tools without dedicated security staff, and **open-source contributors** wanting assurance that their local development setup doesn't introduce easily detectable vulnerabilities. These secondary users are served by the same single-user experience; no team or multi-user features exist in this MVP.

---

## 8. User Journey

The end-to-end journey replaces the original linear "scan, wait, report" flow with a loop that never makes the user wait before seeing value.

1. **Launch.** The user opens VulnSentry AI locally. The Live Topology Graph is already populated from the always-on connection monitor. A Posture Score and a critical-findings badge are visible without scrolling.
2. **Observe.** The user watches the graph for a moment — services appear as nodes, sized by connection count, colored by severity. No action is required to get value.
3. **Trigger a deep scan (optional).** The user clicks Full Scan to run the top-1000-port TCP probe. Progress streams live; newly discovered findings appear in the graph and list as they're found.
4. **Understand.** The user clicks a finding — either from the graph or the ranked list — and a detail panel slides open with process attribution, a plain-language explanation, and a single recommended fix.
5. **Improve.** The user copies the fix command and runs it manually, or accepts the experimental Apply Fix action after explicit confirmation.
6. **Verify.** The user navigates to (or is automatically routed to) the Verification view, which shows a side-by-side Before/After comparison and an animated Posture Score change.
7. **Export (optional).** The user downloads a structured JSON report of the full scan, findings, and remediation history for offline reference.

---

## 9. Final MVP Scope

This is the complete and exclusive feature set for the hackathon build. Anything not listed here is explicitly out of scope.

**In scope:**
- Always-on live connection monitor (`psutil`/`netstat` polling, 2-second interval, streamed via SSE)
- On-demand full port scan (top 1000 TCP ports, `asyncio`-based)
- Process-to-port resolution (PID, process name, executable path)
- Rule-based risk scoring (30-rule engine: port-based, process-aware, and exposure-based rules)
- Posture Score (0–100, weighted by finding severity)
- Ranked findings list, sorted by severity ÷ fix-difficulty
- Finding Detail panel with plain-language Teach Block (Gemini-generated, cached per session, with static fallback)
- Single contextual AI Insight Banner (one holistic Gemini call per scan, not one call per finding)
- Recommended Fix per finding: copy-to-clipboard command, with an experimental one-click Apply Fix path gated by explicit user confirmation
- Before/After delta comparison and animated score evolution (single-session, in-memory only — no database)
- Structured JSON export of the full scan report

**Explicitly out of scope for this MVP (deferred to future versions, not part of this build):**
- External/internet scanning of any kind
- User accounts, authentication, or multi-user support
- Persistent database or historical trend storage across application restarts
- Cloud deployment or any non-local hosting
- Conversational AI chat / persistent AI Mentor with message history
- Docker container awareness and port-mapping inspection
- Service fingerprinting probes beyond banner grab
- SYN/half-open scanning, adaptive concurrency control, and dual-mode (privileged vs. unprivileged) scanning
- PDF export, keyboard navigation polish, and accessibility hardening beyond basic semantic HTML
- Plugin architecture or dynamically loaded rule files
- Exploit generation, payload generation, or any offensive security capability

---

## 10. Architecture Blueprint

VulnSentry AI is a two-process local application: a FastAPI backend bound exclusively to `127.0.0.1` (and `::1`), and a React SPA served separately (e.g., via Vite dev server or a static build) that talks to the backend over REST and Server-Sent Events. There is no third-party backend infrastructure. The only external network call the system makes is to the Gemini API, and only for AI-generated explanation text — never for scan data, never for execution decisions.

```
┌────────────────────────────┐        ┌──────────────────────────────────┐
│        Frontend (SPA)       │        │           Backend (FastAPI)       │
│                              │        │                                    │
│  TopologyGraph  ◄──SSE───────┼────────┤  LiveMonitor (always on)          │
│  FindingsList   ◄──REST──────┼────────┤    psutil / netstat, 2s poll      │
│  FindingDetail  ◄──REST──────┼────────┤  PortScanner (on demand)          │
│  ScoreBadge     ◄──SSE───────┼────────┤    asyncio, semaphore-limited     │
│  AiInsightBanner◄──REST──────┼────────┤  ProcessResolver                  │
│  DeltaComparison◄──REST──────┼────────┤  RiskEngine (30 rules)            │
│  FixButton      ──REST(POST)─┼───────►│  RemediationEngine                │
│                              │        │  GeminiService (teach + insight)  │
└────────────────────────────┘        │  ReportMerger (delta computation) │
                                        └──────────────────────────────────┘
                                                       │
                                                       ▼ (HTTPS, outbound only)
                                              Gemini API (text generation)
```

The architectural decision that defines this system, relative to the originally drafted design, is the separation of the **always-on live signal** from the **on-demand deep scan**. The live monitor produces value with zero latency and zero user action. The deep scan is opt-in and produces a richer, point-in-time dataset that merges with the live signal rather than replacing it.

The second defining decision is collapsing AI calls from one-per-finding to one holistic call per scan for the AI Insight Banner, plus lazy, cached, per-finding calls only when a user actually opens that finding's detail panel. This keeps the AI layer off the critical path of "scan completes → user sees results," and bounds total Gemini usage per scan to a small, predictable number of calls.

---

## 11. Backend Architecture

The backend is a single FastAPI application, organized into routers (HTTP/SSE surface) and services (business logic), with Pydantic models providing the schema boundary between them.

**Routers** (`backend/routers/`):
- `connections.py` — exposes the live connection feed
- `scan.py` — initiates and streams the on-demand deep scan
- `findings.py` — exposes current findings, individual finding detail, and the JSON export
- `remediation.py` — executes (or simulates) a remediation command for a given finding

**Services** (`backend/services/`):
- `connection_monitor.py` — polls `psutil` (cross-platform) and OS-specific tools (`netstat -bno` on Windows, `/proc/net/tcp` on Linux, `lsof -iTCP -sTCP:LISTEN -P -n` on macOS) on a 2-second interval, maintains a rolling cache of the last 5 samples, and publishes updates to connected SSE clients
- `port_scanner.py` — performs the on-demand TCP connect scan across the top 1000 common ports using `asyncio.open_connection`, a `asyncio.Semaphore` capped at 100 concurrent connections, and a 1.0-second per-port timeout; for each open port, attempts a short banner-grab read
- `process_resolver.py` — maps a discovered port back to a PID, process name, and executable path using the platform-specific method appropriate to the host OS
- `risk_engine.py` — applies the 30-rule scoring system (detailed in Section 14) to every discovered open port, whether sourced from the live monitor or the deep scan
- `remediation_engine.py` — maps a finding's `ruleId` to a concrete, OS-aware remediation command, flags whether that command requires administrative privileges, and exposes both a dry "display" path and an "execute" path
- `gemini_service.py` — owns all communication with the Gemini API: prompt templates for Teach Blocks and for the holistic AI Insight recommendation, response parsing and sanitization, an in-memory per-session cache keyed by finding ID, retry-with-backoff on `429`/`5xx`, a 5-second timeout, and a static fallback explanation when Gemini is unavailable
- `report_merger.py` — combines the live connection snapshot, the most recent deep-scan results, and the AI analysis into a single `ScanReport`, and computes the delta against the previous scan held in memory for the current session

**Data layer:** there is no database. All state — current findings, the previous scan snapshot used for delta computation, and the Gemini response cache — lives in process memory for the lifetime of the running server. Restarting the server clears all history. This is an explicit, accepted MVP constraint (Section 9), not an oversight.

**Concurrency model:** `MAX_CONCURRENT_SCANS` is fixed at 1 for the MVP. The live monitor runs as a background `asyncio` task independent of any in-progress deep scan, so the graph keeps updating even while a full scan is running.

---

## 12. Frontend Architecture

The frontend is a Vite-built React 18 + TypeScript single-page application styled with TailwindCSS. State management is intentionally minimal: two custom hooks own the entirety of server communication, replacing the heavier Context/custom-hook/service-layer stack from the original design.

- `useLiveConnections.ts` — opens and manages the SSE connection to the live connection feed, parses incoming `Connection[]` payloads, and exposes them to any component that needs the current graph state
- `useScan.ts` — manages the on-demand scan lifecycle: triggering the scan, consuming the SSE progress stream, and exposing `ScanState` (status, progress percentage, current phase, streamed findings) to consuming components
- `useMentor.ts` — wraps Gemini-backed Teach Block and AI Insight requests, applies the per-session in-memory cache on the client side as a second layer above the backend cache, and exposes loading/error states

Routing is a four-page structure (detailed in Section 23), and the only persisted client-side state across a page reload is the `scanId` of the last completed deep scan, stored in `localStorage`, used purely to restore session continuity within the same browser session — not as a database substitute.

---

## 13. Data Flow

The system has two independent data flows that merge only at the presentation layer.

**Live flow (continuous):**
```
psutil/netstat (2s interval)
  → connection_monitor.py
    → process_resolver.py (attach PID/name/path)
      → risk_engine.py (attach severity per connection)
        → SSE push to /api/live/connections
          → useLiveConnections hook
            → TopologyGraph re-render
```

**Scan flow (on demand, triggered by user):**
```
POST /api/scan
  → port_scanner.py (asyncio TCP connect scan, top 1000 ports)
    → process_resolver.py (attach PID/name/path to each open port)
      → risk_engine.py (score each finding, 30-rule engine)
        → gemini_service.py (ONE holistic call: full finding set → AI Insight recommendation)
          → report_merger.py (merge with live snapshot + compute delta vs. previous scan)
            → SSE stream to GET /api/scan/status until status=complete
              → useScan hook
                → FindingsList, ScoreBadge, AiInsightBanner re-render
```

**On-demand detail flow (lazy, per finding):**
```
User opens Finding Detail
  → GET /api/findings/{id}
    → gemini_service.py (cached lookup; generates Teach Block on first miss, 5s timeout, static fallback on failure)
      → FindingDetail + TeachBlock render
```

This structure is the direct fix for the single biggest defect identified in the prior design: a synchronous, blocking pipeline that called Gemini once per finding before returning any result to the user. In the frozen architecture, the user sees scan results the moment the scan and the single holistic AI call complete — typically within seconds of the scan finishing, not after a separate multi-minute analysis phase — and any additional per-finding AI text loads lazily, only for findings the user actually opens.

---

## 14. Risk Engine Design

The Risk Engine is a deliberately lightweight, explainable, rule-based scoring system — not a behavioral analysis engine and not a CVE-correlation engine. Its job is to convert a `(port, protocol, service, banner, process, binding)` tuple into a risk score from 0–10 and a severity bucket, using three layered rule categories.

**Layer 1 — Port-based base rules.** Each well-known port carries a base risk score reflecting the inherent sensitivity of the service typically running there. Examples: port 3306 (MySQL) → base 8; port 22 (SSH) → base 5; port 6379 (Redis) → base 6; port 80 (HTTP) → base 2; port 443 (HTTPS) → base 1. The full rule set covers 30 distinct port/service patterns, the maximum needed to cover the common protocols the MVP targets (HTTP, HTTPS, SSH, MySQL, PostgreSQL, Redis, MongoDB, FTP, Telnet, SMB, RDP, and similar).

**Layer 2 — Process-aware modifiers.** The base score is adjusted based on what is actually attached to the port. A database process bound to its standard port with no detectable authentication banner receives a `+1` modifier (e.g., MySQL without auth indicators pushes a base 8 toward a 9–10 critical range). A service running under an unexpected or unusually-named process receives a smaller `+0.5` modifier, since it signals a potential misconfiguration the user should investigate.

**Layer 3 — Exposure modifiers.** A service bound to `0.0.0.0` (all interfaces) rather than `127.0.0.1` receives a `+2` modifier, since it is reachable from the wider local network rather than only the local machine. A service confirmed reachable only on loopback receives no exposure penalty.

**Severity mapping** (final risk score, 0–10 scale, to the four-bucket severity used throughout the UI and the Posture Score):

| Score Range | Severity | Posture Score Weight |
|---|---|---|
| 9 – 10 | Critical | 25 |
| 6 – 8 | High | 15 |
| 3 – 5 | Medium | 8 |
| 0 – 2 | Low | 3 |

Each rule in the engine also carries a fixed `fix_difficulty` rating from 1 (trivial — stop a service) to 5 (requires reconfiguration). The Findings List sorts by `severity_score ÷ fix_difficulty`, surfacing the highest-impact, lowest-effort fixes first — the logical "start here" path referenced throughout the UX design.

The Risk Engine runs identically against both the live connection feed and the deep scan results, so every finding the user sees — whether from passive observation or an active scan — carries a consistent score.

---

## 15. AI Orchestrator Design

The AI layer (`gemini_service.py`) has exactly two responsibilities, and no others, in this MVP.

**Responsibility 1 — Holistic AI Insight (one call per scan).** When a deep scan completes, the orchestrator sends Gemini a single prompt containing the full `ScanReport` (all findings, the machine's basic profile, and the delta from the previous scan, if any). The prompt explicitly instructs the model: do not describe each port individually; identify patterns; highlight the single highest-impact, lowest-effort finding; and produce one recommendation of no more than three sentences, written for a junior developer audience, in plain language. This single call populates the Dashboard's AI Insight Banner. It replaces what was originally designed as N sequential per-finding calls, which was the largest source of demo-killing latency and the largest source of Gemini free-tier rate-limit exhaustion in the prior design.

**Responsibility 2 — Lazy, cached Teach Blocks (one call per finding the user actually opens).** When a user opens a Finding Detail panel for the first time in a session, the orchestrator sends a focused prompt for that single finding: "Explain this finding in 2–3 plain-language sentences for a junior developer. Do not invent technical details. If uncertain, say this requires further investigation." The response is cached in memory, keyed by finding ID, for the remainder of the session; reopening the same finding never issues a second call. A "Learn More" action issues one additional, deeper-explanation call per finding, also cached. No finding triggers more than two Gemini calls in a session, and the vast majority of findings — those the user never opens — trigger zero.

**Failure handling.** Every Gemini call carries a 5-second timeout and a single retry with exponential backoff on `429` or `5xx` responses. If the call still fails, the system falls back to a static, pre-written explanation tied to the finding's `ruleId` rather than surfacing an error or blank panel to the user. The AI layer is additive context on top of a system that already works without it — the Risk Engine, Findings List, and Recommended Fix all function correctly with zero Gemini availability.

**Output sanitization.** All AI-generated text is treated as untrusted before rendering: it is never directly interpolated into HTML, and it passes through the same escaping path as any other dynamic string in the frontend, closing the prompt-injection/XSS surface that a malicious service banner could otherwise exploit if banner text is included in any AI prompt context.

---

## 16. UX Architecture

The interface is organized around four information-density levels, ensuring a user can stop at whatever depth matches their need without ever hitting a wall of undifferentiated text.

| Level | Time Budget | Content | Audience |
|---|---|---|---|
| **Glance** | 2 seconds | Posture Score, critical-finding count, live graph silhouette | Everyone, including a judge or passerby |
| **Scan** | 10 seconds | Ranked findings list with severity badges, service/port/process labels | Anyone deciding what to look at next |
| **Deep** | 30 seconds | Finding Detail: process path, risk explanation, Teach Block, Recommended Fix | A user ready to act |
| **Meta** | Any time | Before/After delta, score trend, JSON export | A user verifying or documenting their work |

Three visual-hierarchy rules apply across every screen: the live topology graph is always the largest, most central, most motion-bearing element on the Dashboard — it is the hero. The Posture Score is always visible, in a fixed position, and changes color across three deterministic thresholds (green above 80, amber 50–79, red below 50). The Findings List is always secondary in visual weight to the graph, rendered as a compact, color-coded, scrollable column.

Interaction is split into three modes by expected frequency: passive observation (the user watches the live graph, no action required — the majority of time spent in the app), active exploration (the user clicks nodes or list rows to read explanations — curiosity-driven), and decisive action (the user clicks a fix — the rare, highest-weight moment, which is why it is the only action in the entire product gated by an explicit confirmation step).

---

## 17. Dashboard Architecture

The Dashboard is the default landing view and the only screen most demo viewings will need. It is a single-page, three-zone grid.

**Zone A — Live Topology Graph (60% width, hero element).** Renders the always-on connection feed as an animated Canvas-based graph. Nodes are processes, sized by connection count (minimum 16px radius, scaling at 8px per connection), colored by the severity of their riskiest attached port. Edges pulse to indicate active data flow. A fixed legend (Critical/High/Medium/Low, with hex values from Section 18) sits in the bottom-right corner of the graph at all times. Clicking a node opens the Finding Detail panel for that process/port pair.

**Zone B — Critical Findings List (40% width, action element).** Displays a maximum of five rows: the top three critical findings plus the next two highest by the severity-over-fix-difficulty ranking. Each row shows a severity badge, service name and port, process name and PID, the numeric risk score, and a Recommended Fix action alongside a detail-expand action.

**Zone C — AI Insight Banner (full width, contextual element).** Surfaces the single holistic recommendation from the AI Orchestrator: one plain-language paragraph identifying the highest-impact issue and its fix, with Copy Command, Learn More, and Dismiss actions. Dismissing collapses the banner until the next scan completes.

**Persistent elements** outside the three zones: the Posture Score badge (top-right, always visible, animated on change), the scan controls bar (Full Scan button, last-scan timestamp, Export JSON) fixed at the bottom of the viewport, and a pulsing "LIVE" indicator confirming the SSE connection to the live feed is active.

**Responsive behavior:** at viewport widths of 1200px and above, Zones A and B render side by side at the 60/40 split described above. Below 1200px, they stack vertically, with the graph occupying the top half of the viewport (50vh) and the findings list scrolling beneath it. On mobile widths, the graph collapses to a tap-to-expand summary and the findings list renders as full-width cards.

**Empty state:** an empty graph is treated as a defect, not a valid state. If the live monitor has not yet returned a first sample, the graph displays "Monitor running… check back in 2s" with a pulsing indicator rather than a blank canvas.

---

## 18. Topology Graph Specification

The topology graph is a deliberately scoped visualization: it maps active OS processes and their listening ports on the local machine only. It does not attempt to model an enterprise network, container topology, or cloud infrastructure. This scoping is what keeps the implementation under 300 lines of TypeScript while preserving the visual impact that makes the Dashboard's first five seconds work.

**Node types:**

| Type | Visual | Sizing Rule |
|---|---|---|
| Process | Circle | Radius = connection count × 8px, minimum 16px |
| Port | Small dot attached to its parent process node | Fixed 8px |
| Internet (WAN) | Cloud icon, fixed position at top of canvas | Fixed 32px |

**Color language** (used identically across the graph, the findings list, and the score badge, for visual consistency):

| Severity | Color Name | Hex |
|---|---|---|
| Critical | Red | `#EF4444` |
| High | Orange | `#F97316` |
| Medium | Yellow | `#EAB308` |
| Low | Green | `#22C55E` |
| Resolved (previously flagged, now fixed) | Muted green | `#86EFAC` |

**Motion language:**

| Animation | Duration | Trigger |
|---|---|---|
| Node pulse | Continuous | Active connection present |
| Edge pulse | 2-second cycle | Active data flow on that connection |
| Node appear | 300ms ease-out | A new process is detected |
| Node disappear | 200ms fade | A process stops or a port closes |
| Severity color shift | 400ms | A finding's risk level changes |
| Graph-wide settle | 500ms ease | Posture Score improves after a fix |

**Interaction model:** hovering a node highlights its connected edges and shows a tooltip with process name, PID, port, and risk score. Clicking a node opens the Finding Detail panel for that process/port pair. Hovering an edge shows connection type and state. Double-clicking the canvas recenters and fits all visible nodes. Scroll zooms between 0.5x and 3x; drag pans the canvas.

**Instant-understanding guarantee.** The graph must be comprehensible within three seconds of viewing, enforced by four hard rules: a maximum of eight visible nodes, with any excess clustered into an "Other (N)" group ranked by lowest risk; critical-severity nodes always render with a pulsing red ring to draw the eye immediately; the severity legend is always visible in the same fixed position; and every node always shows process name and port as text — there are no pure-icon nodes a user has to decode.

---

## 19. Findings Workspace

The Findings Workspace (`/findings` route) is the two-pane deep-dive view for a user who wants to work through every discovered issue rather than just the Dashboard's top five.

**Layout:** a fixed-width 320px findings list on the left, and a 480px slide-over detail panel on the right that opens when a row is selected. There is no resizable three-pane layout in this MVP — that complexity was explicitly removed in favor of a simpler, faster-to-build two-pane structure.

**Findings List columns:**

| Column | Content | Visual Treatment |
|---|---|---|
| Severity | Color-coded badge | 24px, matches the severity color table in Section 18 |
| Service:Port | e.g., "MySQL (3306)" | Bold label, monospace port number |
| Process | e.g., "mysqld.exe" | Monospace, truncated if long |
| PID | e.g., "4821" | Monospace, muted color |
| Risk Score | e.g., "9.8/10" | Large, color-matched to severity |
| Actions | Recommended Fix · Open Detail | Primary and secondary buttons |

The list supports filtering by severity and status, and sorting by the default impact-over-effort ranking or by discovery time. List entries are pre-grouped with critical findings first.

**Finding Detail panel structure**, in fixed top-to-bottom order:

1. **Header** — service name, severity badge, port number
2. **Process Info** — process name, PID, full executable path, command line, sourced from `process_resolver.py`
3. **Risk Explanation** — a fixed, pre-written 2–3 sentence plain-language description tied to the finding's `ruleId` (no AI call required for this section — it is static)
4. **Teach Block** — the Gemini-generated "Why It Matters" explanation, cached per session (see Section 15), with a static fallback
5. **Remediation** — the recommended command, a one-line description of what it does, and a "Why This Fix Works" mechanism explanation
6. **Actions** — Apply Fix (Experimental), Copy Command, Snooze, Dismiss
7. **Explain More** — a collapsed, on-demand expansion that issues the second Gemini call described in Section 15

**Interaction flow:** the user discovers a finding via the pre-grouped list, selects it (or selects the corresponding graph node), reads through What → Process → Why → Teach → Remediation in that fixed order, takes an action (copy or apply), and finally re-scans to verify — at which point the finding either disappears from the list or drops in severity, and the user is routed toward the Verification view.

---

## 20. Verification Experience

The Verification view (`/verification` route) is the payoff screen — the place where the product's central promise (you can see your machine get measurably safer) is delivered visually.

**First-run state (no previous scan to compare):** the view displays a single centered message — "No previous scan to compare. Run a scan first, then come here to see your improvement." — with a single "Start First Scan" call to action. There is no delta rendering attempted in this state.

**Comparison state:** a side-by-side layout. The left panel, labeled "Before Scan," renders the previous scan's findings and score in a muted, static treatment. The right panel, labeled "After Scan," renders the current scan's findings and score in full color with an animated entrance. Resolved findings animate from red to a green checkmark as the after-panel renders.

Below the two panels, a full-width **Transformation Summary** states, in plain text, four facts: the Posture Score change (e.g., "58 → 87, +29 points"), the attack surface change (e.g., "5 open services → 3, 40% reduction"), the critical-finding change (e.g., "1 → 0, fully resolved"), and the elapsed time between the two scans. Three actions close out the view: Share Snapshot, Export JSON, and Return to Dashboard.

**Animation sequence**, in fixed order: the Before panel renders first, in its muted state; the After panel renders second, with a full-color animated entrance; resolved findings animate their red-to-green-checkmark transition; the score counter animates from the old value to the new value at a fixed pace of one point per 200 milliseconds; the Transformation Summary fades in last. A toggle allows the user to switch between the side-by-side view and an overlay difference-highlighting view.

---

## 21. API Contracts

All endpoints are served by the FastAPI backend bound exclusively to `127.0.0.1`. Every request, regardless of endpoint, passes through a target-validation dependency before reaching scan- or connection-related logic; that dependency is described under Section 27 (Technical Risks) alongside the security constraints it enforces.

### `GET /api/live/connections`
Server-Sent Events stream. Pushes an updated `Connection[]` payload every 2 seconds for as long as the client remains connected.

```json
event: connection_update
data: {
  "connections": [
    {
      "processName": "mysqld.exe",
      "processPid": 4821,
      "processPath": "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqld.exe",
      "port": 3306,
      "protocol": "tcp",
      "state": "listening",
      "severity": "critical"
    }
  ]
}
```

### `POST /api/scan`
Initiates the on-demand top-1000-port TCP scan.

**Request:**
```json
{
  "target": "127.0.0.1",
  "intensity": "standard"
}
```
`target` must resolve to `127.0.0.1`/`::1` or fall within an RFC 1918 private range; any other value returns `403 Forbidden`. `intensity` is fixed to `"standard"` (top 1000 ports) for this MVP — no `"full"` 65535-port mode is exposed in the frozen scope.

**Response:** `202 Accepted`
```json
{ "scanId": "a1b2c3d4-...", "status": "initiated" }
```

### `GET /api/scan/status`
Server-Sent Events stream of scan progress, terminating with a final `status: "complete"` event carrying the merged `ScanReport`.

```json
event: scan_progress
data: {
  "scanId": "a1b2c3d4-...",
  "status": "running",
  "progress": 45.5,
  "phase": "discovery",
  "currentPort": 443,
  "totalPorts": 1000,
  "foundSoFar": [
    { "port": 3306, "state": "open", "service": "mysql", "banner": null }
  ]
}
```
```json
event: scan_complete
data: {
  "scanId": "a1b2c3d4-...",
  "status": "complete",
  "report": { "...": "full ScanReport object, see Section 22" }
}
```

### `GET /api/findings`
Returns the current findings list (the most recent merge of live + scan data).

**Response:** `200 OK` — `Finding[]` (see Section 22)

### `GET /api/findings/{id}`
Returns full detail for a single finding, including the Teach Block. Triggers the lazy Gemini call described in Section 15 on first request for a given `id`; subsequent requests in the same session return the cached value.

**Response:** `200 OK` — single `Finding` object with `teachBlock` populated

### `GET /api/findings/export`
Returns the full, structured `ScanReport` as a downloadable JSON document.

**Response:** `200 OK`, `Content-Type: application/json`, `Content-Disposition: attachment; filename="vulnsentry-report.json"`

### `POST /api/remediate/{finding_id}`
Executes (or, if the user declined automated execution, simply returns) the remediation command for a given finding. Always requires the request body to include an explicit confirmation flag; the backend rejects the request with `400 Bad Request` if `confirmed` is not `true`.

**Request:**
```json
{ "confirmed": true }
```

**Response:** `200 OK`
```json
{
  "findingId": "f-0001",
  "command": "net stop MySQL",
  "executed": true,
  "result": "MySQL service stopped successfully.",
  "requiresAdmin": false
}
```
If `requiresAdmin` is `true` and the running process lacks the necessary privileges, `executed` is `false` and `result` explains that the command must be run manually, with the command string still returned for copy-to-clipboard use.

---

## 22. Data Models

These are the canonical shapes used across the frontend (TypeScript) and backend (Pydantic). Field names are identical on both sides of the boundary; the backend's `schemas.py` mirrors this exactly.

```typescript
type Severity = 'critical' | 'high' | 'medium' | 'low';
type FindingStatus = 'open' | 'mitigated' | 'dismissed' | 'snoozed';
type ScanPhase = 'discovery' | 'assessment' | 'correlation';

interface Finding {
  id: string;
  severity: Severity;
  serviceName: string;
  port: number;
  protocol: 'tcp' | 'udp';
  processName: string;
  processPid: number;
  processPath?: string;
  riskScore: number;          // 0-10
  ruleId: string;              // links to risk_engine.py rule + static explanation
  fixDifficulty: number;       // 1-5
  status: FindingStatus;
  teachBlock?: string;         // populated lazily, see Section 15
  remediation?: Remediation;
  discoveredAt: string;        // ISO 8601
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
  severity: Severity;
}

interface ScanState {
  status: 'idle' | 'running' | 'complete' | 'error';
  progress: number;            // 0-100
  phase: ScanPhase;
  findings: Finding[];
  startedAt?: string;
  completedAt?: string;
}

interface ScanReport {
  scanId: string;
  target: string;
  timestamp: string;           // ISO 8601
  postureScore: number;        // 0-100, see Section 14 weighting
  previousPostureScore?: number;
  summary: {
    totalPortsScanned: number;
    openPortsFound: number;
    criticalFindings: number;
    highFindings: number;
    mediumFindings: number;
    lowFindings: number;
  };
  findings: Finding[];
  aiInsight?: {
    recommendation: string;    // single holistic Gemini call output, max 3 sentences
    topFindingId: string;
  };
  delta?: {
    resolvedFindingIds: string[];
    newFindingIds: string[];
    attackSurfaceChangePercent: number;
  };
}
```

**Posture Score formula** (computed by `report_merger.py`, exposed on every `ScanReport`):

```
Score = 100 - (sum(weighted_risks) / max_possible_risk) * 100

Where weighted_risks are summed per finding using:
  Critical = 25, High = 15, Medium = 8, Low = 3
And max_possible_risk = 100 (calibrated against a top-1000-port standard scan)
```

Score is clamped to the `[0, 100]` range and color-coded per Section 16's thresholds (green ≥ 80, amber 50–79, red < 50).

---

## 23. Component Tree

### Routes

| Path | Component | Purpose |
|---|---|---|
| `/` | `DashboardPage` | Live graph, critical findings, AI insight banner — the default landing view |
| `/findings` | `FindingsPage` | Full two-pane findings workspace |
| `/findings/:id` | `FindingDetailPage` | Deep-link to a single finding's detail (renders the same slide-over as an in-page navigation) |
| `/verification` | `VerificationPage` | Before/after delta and score evolution |

### Component Hierarchy

```
App.tsx
├── DashboardPage
│   ├── TopologyGraph        (connections, onNodeClick)
│   ├── FindingsList          (findings, onSelect, filters) — top-5 mode
│   │   └── FindingCard       (finding, onFix, onSelect)
│   ├── AiInsightBanner       (finding, onDismiss)
│   ├── ScoreBadge            (score, delta?, size)
│   ├── ScanButton            (onStart, isScanning)
│   └── ScanProgress          (progress, findings) — modal, visible only while scanning
├── FindingsPage
│   ├── FindingsList           (findings, onSelect, filters) — full mode
│   │   └── FindingCard
│   └── FindingDetail          (finding, mentorContext)
│       ├── TeachBlock         (finding, depth)
│       └── RecommendationPanel(finding, onApply, onCopy)
└── VerificationPage
    └── DeltaComparison        (before, after, beforeScore, afterScore)
```

`ScoreBadge` is rendered once at the `App.tsx` layout level (persistent header) rather than re-instantiated per page, so its animation state survives navigation between routes.

---

## 24. Repository Structure

```
vulnsentry-ai/
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── FindingsPage.tsx
│   │   │   ├── FindingDetailPage.tsx
│   │   │   └── VerificationPage.tsx
│   │   ├── components/
│   │   │   ├── TopologyGraph.tsx
│   │   │   ├── FindingsList.tsx
│   │   │   ├── FindingCard.tsx
│   │   │   ├── FindingDetail.tsx
│   │   │   ├── TeachBlock.tsx
│   │   │   ├── ScoreBadge.tsx
│   │   │   ├── DeltaComparison.tsx
│   │   │   ├── AiInsightBanner.tsx
│   │   │   ├── ScanProgress.tsx
│   │   │   ├── ScanButton.tsx
│   │   │   └── RecommendationPanel.tsx
│   │   ├── hooks/
│   │   │   ├── useLiveConnections.ts
│   │   │   ├── useScan.ts
│   │   │   └── useMentor.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── scanner.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── styles/
│   │       └── global.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── backend/
│   ├── main.py
│   ├── routers/
│   │   ├── connections.py
│   │   ├── scan.py
│   │   ├── findings.py
│   │   └── remediation.py
│   ├── services/
│   │   ├── connection_monitor.py
│   │   ├── port_scanner.py
│   │   ├── risk_engine.py
│   │   ├── process_resolver.py
│   │   ├── remediation_engine.py
│   │   ├── gemini_service.py
│   │   └── report_merger.py
│   ├── models/
│   │   └── schemas.py
│   ├── core/
│   │   ├── security.py        # target-validation dependency
│   │   └── exceptions.py      # global exception handler
│   ├── tests/
│   └── requirements.txt
└── README.md
```

Total file count: approximately 35. This structure is final; no additional top-level directories, routers, or service modules are added without an explicit re-alignment of this blueprint.

---

## 25. Development Roadmap

A solo-developer, 7-day build sequence, each day ending in a working, demoable increment.

**Day 1 — Backend foundation.** FastAPI server with CORS and a health endpoint; Pydantic models for `Finding`, `Connection`, and `ScanState`; the `/api/live/connections` SSE endpoint backed by `psutil` polling; the `POST /api/scan` and `GET /api/scan/status` endpoints; the `asyncio`-based top-1000-port TCP scanner; the basic `/api/findings` endpoint returning the latest scan's results.

**Day 2 — Risk engine and remediation.** The 30-rule `risk_engine.py` (port-based rules, process-aware modifiers, exposure modifiers); `process_resolver.py` for PID-to-process resolution; `remediation_engine.py` generating OS-aware commands per rule with admin-requirement flagging; the `/api/findings/{id}` detail endpoint; the `POST /api/remediate/{id}` endpoint with confirmation gating.

**Day 3 — Gemini integration.** `gemini_service.py` with prompt templates for Teach Blocks and for the holistic AI Insight recommendation; response parsing and the in-memory per-session cache; the static fallback path for Gemini unavailability; rate-limit and timeout guards.

**Day 4 — React foundation and Dashboard.** Vite + React + TypeScript scaffolding; the shared TypeScript interfaces; the API client; `TopologyGraph` built on the Canvas API with severity-colored nodes and animated pulse edges; `FindingsList`, `FindingCard`, and `ScoreBadge`; the `DashboardPage` layout; the `useLiveConnections` hook wired to the live SSE stream.

**Day 5 — Findings workspace and teaching layer.** The two-pane `FindingsPage` layout; `FindingDetail` and `RecommendationPanel`; the `TeachBlock` component across its basic/deep/technical disclosure levels; the `useMentor` hook; `AiInsightBanner`; `ScanProgress` and `ScanButton`.

**Day 6 — Verification, scoring, and motion.** The `VerificationPage` layout; `DeltaComparison`; the score-delta count-up animation; the first-run empty state; the full transformation summary; a complete rehearsal of the 90-second demo flow; the `ScoreBadge` count-up and improvement-pulse animations; Snooze/Dismiss state handling.

**Day 7 — Polish and demo preparation.** Cross-browser checks; error states for API downtime, Gemini timeout, and permission-denied remediation attempts; loading and empty states across every view; copy-to-clipboard for remediation commands; JSON export; the README with setup instructions; a full run-through of the demo script in Section 26; buffer time for whatever breaks during rehearsal.

---

## 26. Demo Script

A fixed 90-second walkthrough, timed to the Observe → Understand → Improve → Verify loop.

**0–15 seconds — Opening.** The Dashboard loads. The live topology graph is already breathing with active connection nodes. The Posture Score reads 73. A "3 Critical Findings" badge is visible. Nothing has been clicked yet. Narration: "This is VulnSentry AI. It's watching your machine's security posture — live, from the moment you open it."

**15–30 seconds — Discovery.** Click a critical finding; the Detail slide-over opens, showing process info, the risk explanation, and the Teach Block alongside the Recommended Fix and its copy command. Narration: "Click any finding and VulnSentry shows you what's happening, why it matters, and exactly how to fix it. No guesswork."

**30–45 seconds — Understanding.** Expand "Learn More" to reveal the deeper, AI-generated explanation. Narration: "The AI explains every finding in plain language. Beginners learn, experts get the detail they need."

**45–60 seconds — Improvement.** Click Apply Fix (Experimental); the command executes (or is copied, if automated execution isn't available on the demo machine) and the user runs it. Narration: "Apply Fix attempts automated remediation. At minimum, the command is copied and ready to run — no navigating settings panels, no searching Stack Overflow."

**60–75 seconds — Verification.** Navigate to the Verification view. The Before/After delta renders: score 73 → 87, the MySQL finding is gone, attack surface down 20%. Narration: "Re-scan confirms the fix. The score went from 73 to 87. You can see exactly what changed."

**75–90 seconds — Close.** The final score animation completes; the transformation summary reads "2 findings resolved, attack surface -20%." Narration: "VulnSentry AI — Your Machine's Immune System. Observe. Understand. Improve. Verify."

---

## 27. Technical Risks

This is a risk register, not a re-audit: it documents the residual risks accepted for this MVP and the specific mitigation already built into the frozen architecture for each.

| Risk | Mitigation Built Into This Architecture |
|---|---|
| AI hallucination in security guidance | Prompts explicitly instruct the model not to invent technical detail and to defer ("this requires further investigation") when uncertain; every Teach Block has a static, hard-coded fallback that requires no AI availability |
| Gemini rate limits exhausted mid-demo | AI calls are bounded to one holistic call per scan plus at most two lazy calls per finding a user actually opens — not one call per finding at scan time, which was the original design's primary rate-limit failure mode |
| Scanner reports false negatives on slow-responding ports | Accepted for MVP; the top-1000-port, 1-second-timeout TCP connect scan is explicitly the simple, unprivileged scan path — SYN scanning and adaptive timing are out of scope (Section 9) |
| Target-validation bug allows scanning outside permitted ranges | Enforced at two independent layers: the backend binds exclusively to `127.0.0.1`/`::1`, and every scan/connection request passes through a FastAPI dependency that validates the target against RFC 1918 ranges and `127.0.0.1/32` before any scanning logic runs |
| Banner injection / prompt injection via malicious service banners | All banner text and all AI-generated text is sanitized before rendering and before being interpolated into any Gemini prompt context |
| API key exposure | `GEMINI_API_KEY` is loaded exclusively from environment variables or a `.env` file excluded via `.gitignore`; it is never sent to the frontend |
| No persistent history across restarts | Accepted MVP constraint (Section 9); the in-session delta comparison (Before/After within a single run) delivers the core verification narrative without requiring a database |
| Remediation command executes unintended changes | Every remediation action requires an explicit `confirmed: true` flag in the request body; the UI always displays the exact command before execution; commands are generated from a fixed, rule-keyed whitelist rather than constructed from free-form input, closing the shell-injection surface |
| `asyncio` platform-specific failures (socket cleanup, file descriptor limits) | The scanner's semaphore-bounded concurrency (100 max) and per-port timeout (1.0s) keep resource usage within safe bounds on a single local machine; this is a known constraint of the simple TCP-connect approach and is accepted for the MVP scope |

---

## 28. Architecture Freeze

The following is the final, frozen scope for the VulnSentry AI MVP. No new feature, view, or data source may be added without an explicit re-alignment of this document.

**Delivered (P0 — must ship):**
Live topology graph (Canvas) · SSE live connection stream (2s poll) · Full scan (top 1000 TCP ports) · Findings list (sorted, filtered) · Finding Detail slide-over · Process resolution (PID → name/path) · Risk scoring (30-rule engine) · Teach Blocks (plain language) · Recommended Fix (display + copy) · Apply Fix (Experimental, confirmation-gated) · Before/After verification · Posture Score (0–100) · Score delta animation.

**Delivered (P1):**
AI Insight banner (single holistic Gemini call) · "Learn More" expandable detail · Dismiss/Snooze finding state.

**Delivered (P2):**
JSON export · Responsive layout (desktop/tablet/mobile breakpoints).

**Not delivered in this MVP, deferred to a future version:**
Threat intelligence integration · compliance framework mapping · SOC/multi-user workflows · persistent asset inventory · historical/long-term trend analytics · ticketing system integration · conversational AI mentor with chat history · Docker container awareness · service fingerprinting probes · PDF export · keyboard navigation and accessibility polish beyond semantic HTML · SYN/half-open scanning and adaptive concurrency · plugin-based dynamically loaded risk rules.

```
FINAL SCOPE
  Views:      Dashboard · Findings · Finding Detail · Verification
  Data:       Live connections (psutil/netstat) · Deep scan (top 1000 TCP)
  Scoring:    30-rule risk engine · Posture Score (0-100)
  AI:         Teach Blocks (lazy, cached, per-finding) · AI Insight (one holistic call per scan)
  Actions:    Recommended Fix · Apply Fix (Experimental, confirmation-gated) · Copy · Dismiss · Snooze
  Export:     JSON
  Auth:       None (localhost-only, enforced at bind + middleware layers)
  Storage:    None (in-memory, session-only)
  Cloud:      None
  Database:   None
```

**VulnSentry AI — Your Machine's Immune System**
**Observe · Understand · Improve · Verify**

This blueprint is frozen as of the date of this document. Implementation begins from this specification without further design exploration.
