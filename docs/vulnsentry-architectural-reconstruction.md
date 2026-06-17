# VULNSENTRY AI — Architectural Reconstruction

**Panel:** Distinguished Systems Architect, Principal Security Engineer, Former DARPA Researcher, NASA Mission Software Architect, Y Combinator Technical Partner, National Hackathon Judge, Product Visionary, HCI Specialist

---

## 1. Product Repositioning

### What is VulnSentry AI?

**VulnSentry AI is your machine's immune system.** It does not scan. It *monitors*. It does not report. It *diagnoses*. It does not explain. It *teaches*.

It sits on your local machine as a live health dashboard — a single-page clinical monitor that shows what your computer is exposing to the network right now, which processes own those exposures, what risk they represent, and how to close them. Then, after you act, it shows you the improvement in real time.

### Why should it exist?

Because every other tool answers "what ports are open?" VulnSentry answers "what is my machine doing, what is wrong with it, and how do I make it better?" The difference is the verb. Not **scan** — **understand**. Not **report** — **improve**.

### What emotional response should it create?

The judge's emotional arc in 60 seconds:
1. **Curiosity** — "What is that animated graph?"
2. **Recognition** — "Oh, that's my MySQL server — I didn't realize it was exposed."
3. **Action** — "Can I really close it with one click?"
4. **Satisfaction** — "The graph turned green. My score went from 42 to 78."

The final emotion is **agency**. The user feels they improved their machine's health. That is the "show my friend" moment.

### What differentiates it from Nmap + ChatGPT?

| Dimension | Nmap + ChatGPT | VulnSentry AI |
|---|---|---|
| Interaction | CLI → copy/paste → chat | Live dashboard, one-click fix |
| Time to first insight | 60-120s | 8 seconds |
| The verb | Scan | Improve |
| Visual | Terminal text | Animated topology graph |
| Educational | Generic explanation | Your machine, your processes, your fix |
| Demo moment | "Here's a report" | "Watch the graph change" |

---

## 2. Core Product Narrative

### The Journey (Beginning → Middle → End)

**BEGINNING — "Your machine is talking"**

The user opens VulnSentry. Instead of an empty screen with a scan button, they see a live, animated network graph. Tiny pulsing nodes represent their machine's active network connections. Services appear as labeled spheres. Processes float nearby. The graph is already alive — no button needed. A score in the corner: **Security Posture: 58/100**. Below it: **"3 critical findings need your attention."**

The user is already engaged. They didn't scan anything. The data was already there.

**MIDDLE — "The diagnosis"**

The user clicks a critical node — a glowing red "MySQL (port 3306)" sphere. A panel slides open showing:
- **Process:** `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe` (PID 4821)
- **Risk:** Database exposed to localhost without authentication requirements
- **Impact:** Any process on this machine can read your data
- **Teach:** A 30-word plain-language explanation of why database ports should not be open during development unless actively used

A button: **"Close this port →"**

Below it, a ranked list of other findings in order of impact: "2. SSH password auth enabled (port 22) · 3. Redis without auth (port 6379)"

**END — "The transformation"**

The user clicks "Close this port." The backend runs `net stop MySQL` (Windows) or a systemd stop (Linux). The graph animates — the MySQL node shrinks, turns grey, and disappears. The score ticks up from 58 to 72. A subtle green pulse crosses the screen.

A toast: **"MySQL port 3306 secured. Your attack surface is 12% smaller."**

The user can now click "Re-scan" to verify. The delta view shows: "Previously open: 7 ports. Now open: 6 ports. Improvement: 14%."

The judge watched a problem get solved in 8 seconds. They remember that.

### Why will judges remember this?

Because every other team demos a scan + a report. VulnSentry demos a **transformation** — a machine getting healthier in real time, with the judge watching the graph change. The emotional hook is not data — it is **agency**. The judge thinks "I want this on my machine."

---

## 3. Revised User Journey

### Screen Map (5 screens, 1 component tree)

| Screen | Purpose | User Action | System Response | Value |
|---|---|---|---|---|
| **Live Dashboard** (default) | Show live connection graph + posture score | Opens app | Auto-loads active connections via `netstat` polling | Instant engagement — no scan wait |
| **Findings Panel** | Ranked risk list | Clicks a node or opens sidebar | Lists findings sorted by risk ÷ fix-effort ratio | User sees what matters most |
| **Finding Detail** | Deep diagnosis | Clicks a finding | Shows process, port, risk, teach-text, and fix button | Education + action in one place |
| **Remediation** | Execute fix | Clicks "Fix" | Runs OS command, shows result, updates graph | The demo moment |
| **Scan Mode** | On-demand deep scan | Clicks "Full Scan" | Runs async TCP port scan (1000 ports), merges results | Optional depth |

### State Machine

```
IDLE (live graph active)
  → User clicks "Full Scan"
    → SCANNING (progress bar, ports discovered in real time)
      → ANALYZING (single Gemini call, holistic analysis)
        → RESULTS (merged live + scan data)
          → FIXING (user clicks fix → command executes → graph updates)
            → VERIFIED (re-scan confirms improvement, delta shown)
```

### Key difference from original

The original was: `Idle → Scan → Wait → Report → End`.  
The reconstruction is: `Live → See → Understand → Fix → Verify → Improved`.

The user never waits for a scan to start. The live graph is the first thing they see.

---

## 4. Revised System Architecture

### Backend Modules

```
backend/
├── app/
│   ├── api/
│   │   ├── routes_live.py        # GET /api/live/connections — active netstat data
│   │   ├── routes_scan.py        # POST /api/scan/start, GET /api/scan/stream
│   │   ├── routes_findings.py    # GET /api/findings, GET /api/findings/{id}
│   │   └── routes_remediate.py   # POST /api/remediate/{finding_id}
│   ├── core/
│   │   ├── live_monitor.py       # Polls netstat/psutil every 2s, caches 5 samples
│   │   ├── port_scanner.py       # asyncio TCP scanner (100 concurrency, 1s timeout)
│   │   ├── process_resolver.py   # Maps ports → PIDs → process names + paths
│   │   ├── risk_engine.py        # 30-rule dictionary (not per-finding — per pattern)
│   │   ├── ai_orchestrator.py    # Single Gemini call per ScanReport, not per finding
│   │   ├── remediator.py         # Maps finding → OS command → executes → returns result
│   │   └── report_merger.py      # Merges live data + scan data + AI analysis
│   ├── schemas/
│   │   ├── live_connection.py    # PID, local_addr, remote_addr, state, process_name
│   │   ├── scan_report.py        # Same as TRD but flattened — no per-finding AI
│   │   ├── finding.py            # Finding with remediation_id, not aiAnalysis nested
│   │   └── remediation.py        # command, risk, confirm_message, result
│   └── main.py                   # FastAPI app, binds 127.0.0.1 only
```

### Frontend Modules

```
frontend/
├── src/
│   ├── components/
│   │   ├── TopologyGraph/        # Three.js or Canvas live connection graph
│   │   ├── PostureScore/         # Animated gauge: 0-100
│   │   ├── FindingsList/         # Ranked, color-coded, clickable
│   │   ├── FindingDetail/        # Sliding panel with process info + fix button
│   │   ├── FixButton/            # Single button → confirmation → execution → result
│   │   ├── DeltaBanner/          # "Your score improved by 14 points"
│   │   ├── ScanProgress/         # Progress bar for deep scan mode
│   │   └── TeachBlock/           # 2-3 sentence plain-language explanation
│   ├── hooks/
│   │   ├── useLiveStream.ts      # SSE connection for live connection feed
│   │   ├── useScan.ts            # SSE for scan progress
│   │   └── useRemediate.ts       # POST → poll → update graph
│   └── App.tsx
```

### Data Flow (revised)

```
                  ┌──────────────────────┐
                  │   Frontend (React)    │
                  │  ┌────────────────┐   │
                  │  │ TopologyGraph   │   │
                  │  │ (Canvas/Three)  │   │
                  │  └───────┬────────┘   │
                  │  ┌───────┴────────┐   │
                  │  │ FindingsList   │   │
                  │  └───────┬────────┘   │
                  │  ┌───────┴────────┐   │
                  │  │ FixButton      │   │
                  │  └───────┬────────┘   │
                  └──────────┼────────────┘
                             │ SSE + REST
                             ▼
                  ┌──────────────────────┐
                  │   Backend (FastAPI)  │
                  │                      │
                  │  ┌──────────────┐    │
                  │  │ LiveMonitor  │◄───│── psutil / netstat poll (2s)
                  │  │ (always on)  │    │
                  │  └──────┬───────┘    │
                  │         ▼            │
                  │  ┌──────────────┐    │
                  │  │ PortScanner  │    │  (on-demand)
                  │  │ (asyncio)    │    │
                  │  └──────┬───────┘    │
                  │         ▼            │
                  │  ┌──────────────┐    │
                  │  │ ProcessRes.  │    │
                  │  └──────┬───────┘    │
                  │         ▼            │
                  │  ┌──────────────┐    │
                  │  │ RiskEngine   │    │
                  │  │ (30 rules)   │    │
                  │  └──────┬───────┘    │
                  │         ▼            │
                  │  ┌──────────────┐    │
                  │  │ AIOrchestr.  │────│── ONE Gemini call per scan
                  │  └──────┬───────┘    │
                  │         ▼            │
                  │  ┌──────────────┐    │
                  │  │ Remediator   │    │  (executes OS commands)
                  │  └──────────────┘    │
                  └──────────────────────┘
```

### The critical architectural change

**Original:** `Scanner → RiskEngine → AIAnalyst (per finding, N calls)`  
**Revised:** `LiveMonitor (always on) + Scanner (on demand) → ProcessResolver → RiskEngine → AIOrchestrator (1 call)`

This changes latency from `scan_time + N × 3s` to `scan_time + 5s`. For localhost with 1000 ports, that's ~20s total instead of ~120s. The live monitor produces instant data with zero scan wait.

---

## 5. Innovation Layer — The Features That Win

### Feature 1: Live Connection Graph (The Hook)

**What it is:** A real-time animated topology of your machine's active TCP connections. Services as labeled nodes. Processes attached to services. Connection lines animated with data flow pulse.

**Why it wins:** Because it is alive before the user touches anything. Opening the app shows your machine breathing. No other hackathon project does this. It is visually arresting, technically credible, and immediately useful.

**Implementation:** `netstat -anb` polled every 2 seconds via a background asyncio task. Pipe to `psutil` for process name/path resolution. Frontend renders with Canvas API or a lightweight Three.js graph. ~200 lines of Python, ~300 lines of TS.

### Feature 2: One-Click Remediation (The Demo Moment)

**What it is:** A button next to each finding that executes the fix. `net stop MySQL`, `sudo ufw deny 3306`, `systemctl disable --now postgresql`.

**Why it wins:** The judge watches a problem disappear. No other security hackathon project dares to touch the host OS. This is the "how did they do that?" moment.

**Implementation:** A `Remediator` module that maps findings to OS-specific commands. Windows uses `net stop` / `sc stop`. Linux uses `systemctl` / `ufw`. Mac uses `launchctl` / `pfctl`. Commands run via `asyncio.create_subprocess_exec` with a 10-second timeout. Output captured, parsed, returned. ~100 lines of Python.

**Safety:** Every command requires explicit user confirmation via a modal. No silent execution. Commands are parameterized from a whitelist — no shell injection. The UI shows the exact command before execution.

### Feature 3: Before/After Delta (The Educational Loop)

**What it is:** Every scan produces a diff against the previous scan. "Previously open: 7 ports. Now open: 6 ports." Visualized as a side-by-side comparison with color-coded removed/added ports.

**Why it wins:** This is the pedagogy. The user doesn't learn from a list of problems. They learn from seeing what changed after they fixed something. This is the feature that makes the product "educational" rather than just claiming to be.

**Implementation:** Store the last scan result in a JSON file (no database needed). On new scan completion, call `compute_delta(old, new)` — a pure function. Return both the result and the delta in the API response. ~50 lines of Python, ~100 lines of TS for the comparison UI.

### Feature 4: Security Posture Score (The Gamification)

**What it is:** A single number from 0-100 that represents the machine's overall security posture. Based on: number of open ports, service criticality, authentication requirements, patch status (if detectable), and whether known-warning services are exposed.

**Why it wins:** It's the number judges see walking by. "42/100 — what does that mean?" It's a conversation starter. It creates a goal — "how do I get to 100?" It's the hook for the before/after narrative.

**Implementation:** Weighted scoring function. Base score = 100. Subtract points per finding based on severity (critical = -15, high = -8, medium = -4, low = -2). Add bonus points for improvement actions taken. ~30 lines of Python.

---

## 6. Technical Excellence Layer

### Networking Improvements

1. **Dual-mode scanner.** Default mode: TCP connect scan (no privileges needed, cross-platform). If `scapy` is available and user has admin rights, offer "Deep Scan" mode: SYN half-open scan (faster, stealthier, more reliable on Linux). The app degrades gracefully — if admin isn't available, it still works.

2. **Adaptive concurrency.** Instead of fixed 100 concurrent connections, start with 50 and adjust based on timeout rate. If >10% of connections time out, reduce concurrency. If <2% time out, increase concurrency. This demonstrates engineering judgment and produces more reliable scan times across different machines.

3. **Service fingerprinting probe pass.** After initial port detection, send service-specific probes to confirmed open ports:
   - MySQL: send `\x00\x00\x00\x0a\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00`
   - Redis: `PING\r\n`
   - HTTP: `HEAD / HTTP/1.0\r\n\r\n`
   - SSH: read the banner
   This is ~50 lines of Python and immediately reads as "real security tooling" rather than "student project."

### Data Processing

4. **Process resolution layer.** Use platform-specific APIs to map ports → PIDs → process names → executable paths:
   - Windows: `netstat -bno` parsed, cross-referenced with `psutil.Process(pid)`
   - Linux: read `/proc/net/tcp`, then `/proc/[pid]/cmdline` and `/proc/[pid]/exe`
   - Mac: `lsof -iTCP -sTCP:LISTEN -P -n`
   This is the highest-credibility-per-line-of-code feature in the entire project.

### Security Analysis

5. **Risk scoring with impact-effort ranking.** Each finding gets two scores: severity (1-10) and fix difficulty (1-5). The findings list is sorted by `severity / difficulty` — highest impact with lowest effort appears first. This creates a logical "start here" path for the user and demonstrates product thinking.

### AI Orchestration

6. **Contextual AI analysis pipeline.** Replace per-finding API calls with a single call that receives:
   - Full scan report (all findings)
   - Machine profile (OS, uptime, running processes)
   - Delta from previous scan
   The AI prompt explicitly instructs: "Do not describe each port individually. Identify patterns, highlight the top 3 risks, and explain what they mean together." Result: coherent, non-repetitive analysis in 1 call instead of N.

---

## 7. UX Excellence Layer

### Information Hierarchy

```
Level 1 (Glance — 2 seconds)
  → Security Posture Score (large number, color-coded)
  → Critical finding count ("3 issues need your attention")
  → Live graph (status at a glance)

Level 2 (Scan — 10 seconds)
  → Ranked findings list with severity badges
  → Each finding: port, service, process, risk score

Level 3 (Deep — 30 seconds)
  → Finding detail panel
  → Process info, path, PID
  → Risk explanation
  → Teach block (2-3 sentence plain language)
  → Fix button
  → AI context (how this fits into the overall posture)

Level 4 (Meta — any time)
  → Delta from previous scan
  → Trend: "Your score improved X points"
  → Exportable report
```

### Visual Hierarchy

- **The graph is the hero.** Center of the screen. Largest element. Uses color, motion, and size to convey risk.
- **Score is the anchor.** Top-right or top-left corner. Always visible. Changes color: green > 70, yellow 40-70, red < 40.
- **Findings list is secondary.** Left sidebar or bottom panel. Scrollable. Compact. Color-coded severity badges.
- **Detail panel is tertiary.** Slides in on demand. Overlays the right half of the screen. Dismisses with click outside or Escape.

### Interaction Hierarchy

- **Passive observation (80% of time).** User watches the live graph. No action required. The app is ambient.
- **Active exploration (15% of time).** User clicks nodes, opens findings, reads explanations. Curiosity-driven.
- **Decisive action (5% of time).** User clicks "Fix." This is the peak moment. The UI should make this feel significant — confirmation dialog, execution animation, result celebration.

### How the Interface Teaches

Rather than displaying security concepts as walls of text, the interface embeds education into every action:

1. **Finding cards** include a 2-3 sentence "why this matters" in plain language. Not "CVE-2024-1234" — "This port lets anyone on your network connect to your database without a password."
2. **Before/after diff** teaches causality. "You closed port 3306. Your attack surface is 12% smaller." The user learns the relationship between actions and outcomes.
3. **Posture score** is a teaching tool. Tapping the score shows a breakdown: "-8 for open database ports, -4 for unauthenticated services, +5 for previous fixes."
4. **No jargon unless explained.** The first time a term appears, a subtle tooltip or inline parenthetical explains it. "PID (Process ID — Windows assigns this number to every running program)."

---

## 8. Competitive Analysis

### vs. Traditional Port Scanners (Nmap, Masscan)

| Dimension | Nmap | VulnSentry AI |
|---|---|---|
| Time to insight | 30-120s | 2 seconds (live graph) |
| User expertise required | High | Zero |
| Visual output | Terminal | Animated graph |
| Remediation | Manual (you read, you fix) | One-click fix |
| Pedagogy | Man pages | Embedded in every action |
| Demo appeal | Zero | High |

**Judge verdict:** VulnSentry wins because it answers "so what?" — Nmap tells you what's open, VulnSentry tells you what to do about it.

### vs. Basic AI Security Dashboards

| Dimension | Typical AI Dashboard | VulnSentry AI |
|---|---|---|
| AI integration | Per-item explanation | Holistic analysis |
| Latency | 60-120s | ~5s (1 call) |
| Interaction | Read-only | Actionable |
| Visual identity | Bootstrap cards | Animated topology |
| Memorability | Low | High |

**Judge verdict:** VulnSentry wins because the AI is orchestrator, not a caption machine. It identifies patterns, not individual port descriptions.

### vs. Typical Hackathon Cybersecurity Projects

| Dimension | Typical Project | VulnSentry AI |
|---|---|---|
| Demo hook | "Here's a report" | "Watch the graph change" |
| Emotional arc | Flat | Curiosity → Recognition → Action → Satisfaction |
| Technical depth | Surface level | Process resolution, OS command execution |
| Innovation | "We added AI" | Live monitoring, one-click fix, before/after |
| Build complexity | Same or higher | Lower (removed per-finding AI, added live monitor) |

**Judge verdict:** VulnSentry wins because it's the only project that produces a visible transformation during a 2-minute demo. The judge sees something happen.

---

## 9. Feature Prioritization Matrix

### Must Have (Ship without these = lose)

- [ ] Live connection graph (instant engagement)
- [ ] Security Posture Score (the anchor number)
- [ ] Process-to-port resolution (credibility)
- [ ] Ranked findings list (actionability)
- [ ] Finding detail with teach block (education)
- [ ] One-click remediation (the demo moment)
- [ ] Before/after delta (the narrative)
- [ ] Gemini holistic analysis (1 call — not per finding)

### Should Have (Ship without these = strong but less memorable)

- [ ] Deep scan mode (TCP port scan on demand)
- [ ] Delta visualization (side-by-side comparison)
- [ ] AI fallback (cached analysis if Gemini is unavailable)
- [ ] Keyboard navigation (accessibility + polish signal)
- [ ] Exportable report (judge can take something away)

### Could Have (Nice if time permits)

- [ ] Docker awareness (container port mapping)
- [ ] SYN scan mode (admin-only deep scan)
- [ ] Service fingerprinting probes (second pass)
- [ ] Posture score breakdown (what contributed to the number)
- [ ] Natural language query ("what should I fix first?")
- [ ] Security trend chart (multiple scans over time)

### Won't Have (Explicitly cut to preserve focus)

- [x] Multi-user support
- [x] Cloud deployment
- [x] Database persistence
- [x] Authentication system
- [x] Team collaboration
- [x] Plugin architecture
- [x] Enterprise features
- [x] Any paid external service

---

## 10. The Final Architecture Blueprint

### What We Build

A single-page React application backed by a FastAPI server that:
1. Polls local machine state via `psutil`/`netstat` every 2 seconds
2. Renders an animated topology of active connections
3. Computes a risk score and ranked findings
4. Calls Gemini exactly once per scan for holistic analysis
5. Enables one-click remediation of findings
6. Shows before/after comparison after fixes

### What We Remove From the Original Design

- **Per-finding AI analysis** — replaced with single holistic call. Latency drops from ~100s to ~5s.
- **The "Risk Engine" module** — replaced with a 30-line scoring function merged into the scanner output.
- **The security middleware class** — replaced with a `Depends()` call: 7 lines.
- **The React Context/Custom Hook/SSE Hook/Service Layer stack** — replaced with 2 custom hooks (`useLiveStream`, `useScan`). The SSE parsing is inlined.

### What We Add That Wasn't There

- **Live monitor** — continuous `netstat`/`psutil` polling, always on, zero-user-action engagement.
- **Process resolver** — port → PID → process name → executable path. 30 lines. Highest value per line.
- **Remediator** — maps findings to OS commands, executes with safety checks, returns results. 100 lines.
- **Posture score** — single 0-100 number from weighted scoring function. 30 lines.
- **Delta computation** — compares current vs. previous scan, produces diff. 50 lines.
- **Topology graph** — Canvas or Three.js rendering of connections. 300 lines of TypeScript.

### Architecture Summary

```
Total new code: ~2,500 lines
  Backend (Python/FastAPI): ~1,000 lines
    - live_monitor.py: 200
    - port_scanner.py: 200
    - process_resolver.py: 50
    - risk_engine.py: 50
    - ai_orchestrator.py: 100
    - remediator.py: 100
    - report_merger.py: 50
    - routes (4 files): 150
    - schemas (4 files): 100

  Frontend (React/TypeScript): ~1,500 lines
    - TopologyGraph: 400
    - PostureScore: 100
    - FindingsList: 200
    - FindingDetail: 200
    - FixButton: 100
    - DeltaBanner: 100
    - TeachBlock: 100
    - hooks (3): 200
    - App.tsx + layout: 100

Externally managed (can be used as-is):
  - Gemini API via google-generativeai SDK
  - React 18 + TypeScript + TailwindCSS
  - FastAPI + uvicorn + asyncio

Build time estimate (solo developer):
  Day 1: Backend core (live_monitor, port_scanner, process_resolver)
  Day 2: Backend AI (ai_orchestrator, risk_engine, remediator, routes)
  Day 3: Frontend foundation (App shell, TopologyGraph, PostureScore)
  Day 4: Frontend features (FindingsList, FindingDetail, FixButton)
  Day 5: Integration (connect frontend to backend, SSE streaming)
  Day 6: Polish (deltas, error handling, demo script, README)
  Day 7: Buffer (testing, rehearsing demo, fixing edge cases)

### Scoring Potential

| Category | Original (estimated) | Reconstruction (estimated) |
|---|---|---|
| Innovation | 3/10 | 8/10 |
| Technical Implementation | 4/10 | 8/10 |
| Problem Solving | 5/10 | 9/10 |
| User Experience | 4/10 | 9/10 |
| Scalability | 2/10 | 6/10 |

**Why scalability stayed at 6/10:** This is a local-only, single-user tool. That's by design — the constraints forbid multi-user infrastructure. What pushes it to 6 is that the architecture could be extended to multi-user by adding a database and task queue without rewriting the core logic. The modules are clean enough that the next team could do that in a week.

---

## Final Word

The original VulnSentry was a port scanner with AI captions. It would score in the bottom third of any national hackathon.

The reconstructed VulnSentry is a live immune system for your machine — it monitors, diagnoses, and heals. It creates an emotional arc in 60 seconds. It produces a visible transformation during the demo. It answers "why you?" with "I can fix your machine while you watch."

This is a top-3 project at any national hackathon. Build this.
