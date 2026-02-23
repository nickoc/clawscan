#!/usr/bin/env bun
import { parseSkill } from "./parser/skill-parser.js";
import { runRules } from "./rules/index.js";
import { buildScanResult } from "./scorer.js";
import { findSkillDirs } from "./utils/walk-dir.js";
import { fetchSkillFromUrl, isClawHubUrl } from "./utils/fetch-skill.js";
import { basename, resolve } from "path";
import type { ScanResult } from "./types.js";

const PORT = 3847;

async function scanPath(skillPath: string): Promise<ScanResult> {
  const skill = await parseSkill(skillPath);
  const findings = runRules(skill);
  const skillName = skill.skillMd.frontmatter.name || basename(skillPath);
  return buildScanResult(skillName, findings);
}

async function scanBatch(dirPath: string): Promise<ScanResult[]> {
  const dirs = await findSkillDirs(dirPath);
  const results: ScanResult[] = [];
  for (const dir of dirs) {
    results.push(await scanPath(dir));
  }
  return results;
}

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ClawScan Dashboard</title>
  <style>
    :root {
      --bg: #0a0e17;
      --surface: #111827;
      --surface2: #1a2234;
      --border: #1e2d3d;
      --text: #e2e8f0;
      --text-dim: #64748b;
      --accent: #3b82f6;
      --critical: #ef4444;
      --high: #f97316;
      --medium: #eab308;
      --low: #3b82f6;
      --info: #6b7280;
      --green: #22c55e;
      --grade-a: #22c55e;
      --grade-b: #86efac;
      --grade-c: #eab308;
      --grade-d: #f97316;
      --grade-f: #ef4444;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
    }
    .header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 20px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header h1 {
      font-size: 22px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .header h1 .icon { font-size: 28px; }
    .header .subtitle { color: var(--text-dim); font-size: 13px; margin-top: 2px; }
    .scan-bar {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .scan-bar input {
      background: var(--surface2);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 14px;
      width: 380px;
      outline: none;
      transition: border-color 0.2s;
    }
    .scan-bar input:focus { border-color: var(--accent); }
    .scan-bar input::placeholder { color: var(--text-dim); }
    .scan-bar button {
      background: var(--accent);
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .scan-bar button:hover { opacity: 0.9; }
    .scan-bar button:disabled { opacity: 0.5; cursor: not-allowed; }
    .container { max-width: 1280px; margin: 0 auto; padding: 24px 32px; }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .summary-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      overflow: hidden;
    }
    .summary-card:hover { border-color: var(--accent); transform: translateY(-1px); }
    .summary-card.active { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
    .summary-card .grade {
      position: absolute;
      top: 16px;
      right: 20px;
      font-size: 42px;
      font-weight: 800;
      opacity: 0.15;
      line-height: 1;
    }
    .summary-card .skill-name {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 80%;
    }
    .score-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 12px;
    }
    .score-num { font-size: 32px; font-weight: 700; }
    .score-max { font-size: 14px; color: var(--text-dim); }
    .score-grade {
      font-size: 18px;
      font-weight: 700;
      padding: 2px 10px;
      border-radius: 6px;
      margin-left: auto;
    }
    .severity-bar {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .sev-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .sev-critical { background: rgba(239,68,68,0.15); color: var(--critical); }
    .sev-high { background: rgba(249,115,22,0.15); color: var(--high); }
    .sev-medium { background: rgba(234,179,8,0.15); color: var(--medium); }
    .sev-low { background: rgba(59,130,246,0.15); color: var(--low); }
    .sev-info { background: rgba(107,114,128,0.15); color: var(--info); }

    .detail-panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
    }
    .detail-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .detail-header h2 { font-size: 16px; font-weight: 600; }
    .detail-header .filter-group {
      display: flex;
      gap: 4px;
    }
    .filter-btn {
      background: var(--surface2);
      border: 1px solid var(--border);
      color: var(--text-dim);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-btn:hover { color: var(--text); border-color: var(--text-dim); }
    .filter-btn.active { background: var(--accent); color: white; border-color: var(--accent); }

    .findings-table {
      width: 100%;
      border-collapse: collapse;
    }
    .findings-table th {
      text-align: left;
      padding: 10px 16px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-dim);
      background: var(--surface2);
      border-bottom: 1px solid var(--border);
    }
    .findings-table td {
      padding: 12px 16px;
      font-size: 13px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }
    .findings-table tr:last-child td { border-bottom: none; }
    .findings-table tr:hover td { background: rgba(59,130,246,0.04); }
    .sev-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 6px;
    }
    .sev-dot.critical { background: var(--critical); }
    .sev-dot.high { background: var(--high); }
    .sev-dot.medium { background: var(--medium); }
    .sev-dot.low { background: var(--low); }
    .sev-dot.info { background: var(--info); }
    .evidence-code {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 12px;
      background: var(--surface2);
      padding: 3px 8px;
      border-radius: 4px;
      color: var(--high);
      word-break: break-all;
      max-width: 340px;
      display: inline-block;
    }
    .location-text {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 12px;
      color: var(--text-dim);
    }
    .empty-state {
      padding: 60px 20px;
      text-align: center;
      color: var(--text-dim);
    }
    .empty-state .icon { font-size: 48px; margin-bottom: 12px; }
    .empty-state p { font-size: 14px; }
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: var(--text-dim);
      gap: 8px;
    }
    .spinner {
      width: 16px; height: 16px;
      border: 2px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .score-bar-track {
      height: 4px;
      background: var(--surface2);
      border-radius: 2px;
      margin-top: 10px;
      overflow: hidden;
    }
    .score-bar-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.6s ease;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1><span class="icon">🔒</span> ClawScan</h1>
      <div class="subtitle">Security Scanner for OpenClaw / ClawHub Skills &mdash; <span style="color:var(--medium)">Grades reflect detected patterns only, not a guarantee of safety</span></div>
    </div>
    <div class="scan-bar">
      <input type="text" id="scanPath" placeholder="Enter ClawHub URL or local skill path..." />
      <button id="scanBtn" onclick="doScan()">Scan</button>
    </div>
  </div>

  <div class="container">
    <div id="summaryGrid" class="summary-grid"></div>
    <div id="detailPanel"></div>
  </div>

  <script>
    let allResults = [];
    let activeIndex = 0;
    let activeFilter = 'all';

    function gradeColor(grade) {
      const map = { A: '#22c55e', B: '#86efac', C: '#eab308', D: '#f97316', F: '#ef4444' };
      return map[grade] || '#6b7280';
    }
    function scoreColor(score) {
      if (score >= 90) return '#22c55e';
      if (score >= 75) return '#86efac';
      if (score >= 60) return '#eab308';
      if (score >= 40) return '#f97316';
      return '#ef4444';
    }

    function renderSummary() {
      const grid = document.getElementById('summaryGrid');
      grid.innerHTML = allResults.map((r, i) => {
        const gc = gradeColor(r.grade);
        const sc = scoreColor(r.score);
        const sevBadges = [];
        if (r.summary.critical) sevBadges.push('<span class="sev-badge sev-critical">' + r.summary.critical + ' CRIT</span>');
        if (r.summary.high) sevBadges.push('<span class="sev-badge sev-high">' + r.summary.high + ' HIGH</span>');
        if (r.summary.medium) sevBadges.push('<span class="sev-badge sev-medium">' + r.summary.medium + ' MED</span>');
        if (r.summary.low) sevBadges.push('<span class="sev-badge sev-low">' + r.summary.low + ' LOW</span>');
        if (r.summary.info) sevBadges.push('<span class="sev-badge sev-info">' + r.summary.info + ' INFO</span>');
        return '<div class="summary-card' + (i === activeIndex ? ' active' : '') + '" onclick="selectSkill(' + i + ')">' +
          '<div class="grade" style="color:' + gc + '">' + r.grade + '</div>' +
          '<div class="skill-name">' + esc(r.skill) + '</div>' +
          '<div class="score-row">' +
            '<span class="score-num" style="color:' + sc + '">' + r.score + '</span>' +
            '<span class="score-max">/100</span>' +
            '<span class="score-grade" style="background:' + gc + '22;color:' + gc + '">' + r.grade + '</span>' +
          '</div>' +
          '<div class="severity-bar">' + (sevBadges.length ? sevBadges.join('') : '<span class="sev-badge" style="background:rgba(34,197,94,0.15);color:#22c55e">CLEAN</span>') + '</div>' +
          '<div class="score-bar-track"><div class="score-bar-fill" style="width:' + r.score + '%;background:' + sc + '"></div></div>' +
        '</div>';
      }).join('');
    }

    function renderDetail() {
      const panel = document.getElementById('detailPanel');
      if (!allResults.length) {
        panel.innerHTML = '<div class="empty-state"><div class="icon">🔍</div><p>Enter a ClawHub URL or local skill path above and click Scan.</p></div>';
        return;
      }
      const r = allResults[activeIndex];
      const findings = activeFilter === 'all' ? r.findings : r.findings.filter(f => f.severity === activeFilter);

      const filters = ['all','critical','high','medium','low','info'].map(f =>
        '<button class="filter-btn' + (f === activeFilter ? ' active' : '') + '" onclick="setFilter(\\'' + f + '\\')">' +
        (f === 'all' ? 'All (' + r.findings.length + ')' : f.charAt(0).toUpperCase() + f.slice(1) + ' (' + r.findings.filter(x=>x.severity===f).length + ')') +
        '</button>'
      ).join('');

      if (!findings.length) {
        panel.innerHTML =
          '<div class="detail-panel">' +
            '<div class="detail-header"><h2>Findings — ' + esc(r.skill) + '</h2><div class="filter-group">' + filters + '</div></div>' +
            '<div class="empty-state"><div class="icon">✅</div><p>No findings' + (activeFilter !== 'all' ? ' at this severity level' : '') + '.</p></div>' +
          '</div>';
        return;
      }

      const rows = findings.map(f => {
        const loc = f.location.file.split('/').slice(-2).join('/') + ':' + f.location.line;
        return '<tr>' +
          '<td><span class="sev-dot ' + f.severity + '"></span>' + f.severity.toUpperCase() + '</td>' +
          '<td style="font-weight:600;font-family:monospace;font-size:12px">' + f.ruleId + '</td>' +
          '<td><strong>' + esc(f.title) + '</strong><br><span style="color:var(--text-dim);font-size:12px">' + esc(f.description).slice(0,120) + '</span></td>' +
          '<td><span class="location-text">' + esc(loc) + '</span></td>' +
          '<td><span class="evidence-code">' + esc(f.evidence).slice(0,80) + '</span></td>' +
        '</tr>';
      }).join('');

      panel.innerHTML =
        '<div class="detail-panel">' +
          '<div class="detail-header"><h2>Findings — ' + esc(r.skill) + '</h2><div class="filter-group">' + filters + '</div></div>' +
          '<table class="findings-table"><thead><tr><th>Severity</th><th>Rule</th><th>Finding</th><th>Location</th><th>Evidence</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '</div>';
    }

    function selectSkill(i) { activeIndex = i; activeFilter = 'all'; renderSummary(); renderDetail(); }
    function setFilter(f) { activeFilter = f; renderDetail(); }
    function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    async function doScan() {
      const path = document.getElementById('scanPath').value.trim();
      if (!path) return;
      const btn = document.getElementById('scanBtn');
      btn.disabled = true; btn.textContent = 'Scanning...';
      document.getElementById('detailPanel').innerHTML = '<div class="loading"><div class="spinner"></div>Scanning...</div>';
      try {
        const res = await fetch('/api/scan?path=' + encodeURIComponent(path));
        const data = await res.json();
        if (data.error) { alert(data.error); return; }
        allResults = Array.isArray(data) ? data : [data];
        activeIndex = 0;
        activeFilter = 'all';
        renderSummary();
        renderDetail();
      } catch(e) { alert('Scan failed: ' + e.message); }
      finally { btn.disabled = false; btn.textContent = 'Scan'; }
    }

    // Auto-load fixtures on start
    (async () => {
      try {
        const res = await fetch('/api/scan?path=fixtures');
        const data = await res.json();
        if (!data.error) {
          allResults = Array.isArray(data) ? data : [data];
          renderSummary();
          renderDetail();
        }
      } catch(e) {}
      renderDetail();
    })();
  </script>
</body>
</html>`;

// Rate limiter: per-IP, 20 requests per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

// Path traversal guard: block ../ sequences and paths outside allowed roots
function isPathSafe(inputPath: string): boolean {
  const resolved = resolve(inputPath);
  // Block any path containing .. after resolution that escapes home or project dirs
  if (inputPath.includes("..")) return false;
  // Block access to sensitive system directories
  const blocked = ["/etc/", "/proc/", "/sys/", "/dev/", "/var/run/", "/private/etc/"];
  return !blocked.some(prefix => resolved.startsWith(prefix));
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const clientIp = server.requestIP(req)?.address || "unknown";

    if (url.pathname === "/" || url.pathname === "") {
      return new Response(HTML, { headers: { "Content-Type": "text/html" } });
    }

    if (url.pathname === "/api/scan") {
      // Rate limiting
      if (!checkRateLimit(clientIp)) {
        return Response.json(
          { error: "Rate limit exceeded. Max 20 scans per minute." },
          { status: 429 }
        );
      }

      let scanTarget = url.searchParams.get("path") || "";

      if (!scanTarget) {
        return Response.json({ error: "Missing 'path' parameter" }, { status: 400 });
      }

      try {
        // Handle ClawHub URLs — fetch skill remotely then scan
        if (isClawHubUrl(scanTarget)) {
          const skillDir = await fetchSkillFromUrl(scanTarget);
          const result = await scanPath(skillDir);
          return Response.json(result);
        }

        // Path traversal protection
        if (!isPathSafe(scanTarget) && scanTarget !== "fixtures") {
          return Response.json(
            { error: "Blocked: path traversal or access to restricted directory." },
            { status: 403 }
          );
        }

        // Local path scanning
        if (scanTarget === "fixtures") {
          scanTarget = resolve(import.meta.dir, "..", "tests", "fixtures");
        } else {
          scanTarget = resolve(scanTarget);
        }

        const stat = await Bun.file(resolve(scanTarget, "SKILL.md")).exists();

        if (stat) {
          const result = await scanPath(scanTarget);
          return Response.json(result);
        }

        const results = await scanBatch(scanTarget);
        if (results.length === 0) {
          return Response.json({ error: "No skills found at " + scanTarget }, { status: 404 });
        }
        return Response.json(results);
      } catch (err) {
        return Response.json(
          { error: err instanceof Error ? err.message : String(err) },
          { status: 400 }
        );
      }
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log("\\n  🔒 ClawScan Dashboard");
console.log("  ─────────────────────");
console.log("  http://localhost:" + PORT);
console.log("\\n  Auto-loaded test fixtures. Enter any skill path to scan.\\n");
