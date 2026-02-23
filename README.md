# ClawScan

Security scanner for [OpenClaw](https://docs.openclaw.ai) and ClawHub skills. Detects credential leaks, data exfiltration, prompt injection, supply chain risks, malware patterns, and more.

## Why

OpenClaw skills have full access to your system — files, shell, network, credentials. Before you install one, you should know what it does. ClawScan statically analyzes skill directories and reports security findings with severity grades.

## Install

```bash
# With bun (recommended)
bun install -g clawscan

# Or clone and run directly
git clone https://github.com/nickoc/clawscan.git
cd clawscan
bun install
```

## Usage

### Scan a single skill

```bash
clawscan scan /path/to/skill

# From source
bun src/index.ts scan /path/to/skill
```

### Batch scan all skills in a directory

```bash
clawscan batch /path/to/skills/

# Example: scan all bundled OpenClaw skills
clawscan batch ~/.nvm/versions/node/v22.22.0/lib/node_modules/openclaw/skills/
```

### Output formats

```bash
# Table (default)
clawscan scan /path/to/skill

# JSON
clawscan scan /path/to/skill --format json

# SARIF (for CI/GitHub integration)
clawscan scan /path/to/skill --format sarif
```

### CI mode

```bash
# Exit code 1 if any critical findings
clawscan scan /path/to/skill --ci --fail-on critical

# Batch CI — fails if ANY skill has high+ findings
clawscan batch /path/to/skills/ --ci --fail-on high
```

### Web dashboard

```bash
bun src/server.ts
# Opens at http://localhost:3847
```

Interactive dashboard for scanning skills and browsing findings.

## What it checks

| Category | Rules | What it catches |
|----------|-------|-----------------|
| **Credentials** | CRED-001 to CRED-003 | Hardcoded API keys, keychain access, .env file reads |
| **Exfiltration** | EXFIL-001 to EXFIL-002 | Data sent to external URLs, piped to network commands |
| **Prompt Injection** | PI-001 to PI-002 | System prompt override attempts, instruction injection |
| **Supply Chain** | SC-001 to SC-002 | Untrusted package installs, remote script execution |
| **Malware** | MAL-001 to MAL-002 | Destructive commands, reverse shells |
| **Privacy** | PRIV-001 to PRIV-002 | Browser history access, location tracking |
| **Persistence** | PERS-001 | Crontab modification, startup items |
| **Network** | NET-001 to NET-002 | Suspicious outbound connections, DNS tunneling |
| **Obfuscation** | OBF-001 | Base64-encoded commands, encoded payloads |
| **Quality** | QUAL-001 to QUAL-005 | Missing metadata, description, version, license, author |

## Scoring

Each skill gets a score from 0-100 and a letter grade:

| Grade | Score | Meaning |
|-------|-------|---------|
| A | 90-100 | Clean or info-only findings |
| B | 75-89 | Minor issues |
| C | 60-74 | Moderate concerns |
| D | 40-59 | Significant risks |
| F | 0-39 | Critical security issues |

Penalties: Critical = -25, High = -15, Medium = -8, Low = -3, Info = 0.

## Examples

```bash
# Find the 5 worst skills in a directory
clawscan batch /path/to/skills --format json | \
  jq 'sort_by(.score) | .[:5] | .[] | {skill, score, grade, critical: .summary.critical}'

# Filter to only critical and high findings
clawscan scan /path/to/skill --min-severity high
```

## Development

```bash
bun install
bun test          # 77 tests
bun run typecheck # TypeScript check
```

## License

MIT
