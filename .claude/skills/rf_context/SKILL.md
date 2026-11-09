---
name: rf_context
description: "Generate or update all project context files from the requirement documents."
disable-model-invocation: true
---

Follow these steps exactly:

## Step 1 — Read all requirement files

Read every `.md` file found in `ai_reactive_framework/context/requirements/`.
Extract and consolidate the following from all files:
- Project module path
- Purpose and goals
- Tech stack (language, platform, frameworks, libraries, versions)
- Architecture (directory layout, request flow, transport)
- Tool / interface contracts
- Metrics and observability conventions
- DI wiring patterns
- Key conventions and rules
- Feature documentation structure
- Recommended tools list (name, priority, inputs, knowledge base refs, service path, complexity)
- External and internal dependencies (packages, versions, tool→service, tool→KB, tool→templates mappings)
- Open issues, risks, known limitations, knowledge base gaps, build/infrastructure issues

## Step 2 — Read all existing context files

Read each of the following files to understand what is already documented:
- `ai_reactive_framework/context/0-context.md`
- `ai_reactive_framework/context/1-plan.md`
- `ai_reactive_framework/context/2-dependencies.md`
- `ai_reactive_framework/context/3-issues.md`

For each file, compare it against the requirements and identify:
- Sections that need to be added
- Sections that need to be updated
- Sections that are already accurate (keep as-is)

## Step 3 — Update `0-context.md`

Write the result to `ai_reactive_framework/context/0-context.md` using the following structure:

```markdown
# Project Context — <project_name>

## Module
<Go module path>

## Purpose
<1–2 paragraph description of what the project does and why>

## Tech Stack
| Layer | Technology | Version |
|-------|-----------|---------|
...

## Architecture
<Directory tree of the key paths>

### Request Flow
<ASCII diagram showing the request path>

### Transport
- **Endpoint**: ...
- **Protocol**: ...

## Tool Interface
<Interface definition and anatomy with code blocks>

### Return Convention for HandleMCPCall
<Success and error return conventions>

## Metrics
| Metric | Name |
|--------|------|
...

## DI Wiring (main.go)
<Code block showing the wiring pattern>

## Key Conventions
<Bullet list of conventions>

## Feature Documentation Structure
<Ordered list of documentation layers>
```

Preserve any sections not covered by the requirements. Do not remove content unless it directly contradicts them.

## Step 4 — Update `1-plan.md`

Write the result to `ai_reactive_framework/context/1-plan.md` using the following structure:

```markdown
# MCP Tools Implementation Plan — <project_name>

## Knowledge Base Coverage
<Table: Domain | Files>

## Recommended Tools — <N> Total

### P0 — Core Productivity Loop
<One section per tool with: description, inputs table, knowledge base, service path, complexity>

### P1 — High Value
<One section per tool>

### P2 — Reduces Common Friction
<One section per tool>

## Implementation Order
<Phased execution plan grouped by parallel batches>

## Complexity Summary
<Table: Tool | Priority | Complexity | Templates / Checks>

## Key Architectural Decisions
<Bullet decisions with rationale and code examples where relevant>

## Critical Reference Files
<Table: File | Purpose>
```

Preserve any sections not covered by the requirements. Do not remove content unless it directly contradicts them.

## Step 5 — Update `2-dependencies.md`

Write the result to `ai_reactive_framework/context/2-dependencies.md` using the following structure:

```markdown
# Dependencies — <project_name>

## External Dependencies

### Private Registry (<registry_url>)
<Table: Package | Import Path | Version | Purpose>

### Public Registry
<Table: Package | Import Path | Version | Purpose>

## Internal Dependencies

### Tool → Service Mapping
<Table: Tool | Service File | Description>

### Tool → Knowledge Base Mapping
<Table: Tool | Knowledge Base Files>

### Tool → Template Files Mapping
<Table: Tool | Template Directory | Files>

## Shared Infrastructure Dependencies

### DI Wiring
<Steps to register a new tool>

### Metrics Middleware
<Description of automatic metrics coverage>

### Shared Utilities
<Table: Utility | Path | Used By>

## Knowledge Base Directory
<Table: Domain | Directory | Files>

## Constraints
<Bullet list of hard constraints>
```

If the file is empty or sparse, populate it from what was extracted in Step 1.

## Step 6 — Update `3-issues.md`

Write the result to `ai_reactive_framework/context/3-issues.md` using the following structure:

```markdown
# Issues & Blockers — <project_name>

## Open Issues
<One entry per issue with: status, severity, affected component, description, root cause, workaround, resolution>

## Risks
<One entry per risk with: probability, impact, affected component, mitigation, description>

## Known Limitations
<Table: # | Tool | Limitation | Acceptable?>

## Knowledge Base Gaps
<Table: Tool | Missing Information | Source File Expected | Priority>

## Build & Infrastructure Issues
<Table: # | Issue | Component | Status>

## Resolved Issues
<Table: ID | Title | Resolved On | Resolution Summary>
```

If the file is empty, populate only the sections for which information was found in the requirements.
Do not invent issues or risks — only document what is explicitly stated or clearly implied in the requirements.

## Step 7 — Confirm

Output a consolidated change summary in this format:

```
✅ 0-context.md     — <N> sections added, <N> updated, <N> unchanged
✅ 1-plan.md        — <N> sections added, <N> updated, <N> unchanged
✅ 2-dependencies.md — <N> sections added, <N> updated, <N> unchanged
✅ 3-issues.md      — <N> sections added, <N> updated, <N> unchanged
```
