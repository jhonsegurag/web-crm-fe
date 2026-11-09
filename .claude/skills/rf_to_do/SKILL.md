---
name: rf_to_do
description: "Generate a full business specification for the feature `$ARGUMENTS` and place it in the `to_do` phase."
disable-model-invocation: true
argument-hint: "[feature]"
---

Follow these steps exactly:

## Step 1 — Find the feature definition

Read `ai_reactive_framework/context/1-plan.md` and locate the section for feature `$ARGUMENTS`.
Extract:
- Tool name and description
- Inputs table (field name, type, description)
- Knowledge base files listed
- Service file path
- Complexity level
- Priority (P0/P1/P2)

If the feature is not found in `1-plan.md`, check for a file named `ai_reactive_framework/context/$ARGUMENTS.md` and use its content instead.
If neither exists, stop and tell the user: "Feature '$ARGUMENTS' not found in context/1-plan.md and no context/$ARGUMENTS.md file exists."

## Step 2 — Read the business spec template

Read `ai_reactive_framework/1-business_layer/templates/business_rules_template.md` to load the 12-section structure.

## Step 3 — Generate the business spec

Fill all 12 sections using the feature definition from Step 1:

**§ 1 Objective**
Write one paragraph describing what this MCP tool does, why it exists, and who benefits from it.
Derive from the tool description in the plan.

**§ 2 Scope**
In scope: what the tool generates or evaluates.
Out of scope: file I/O (Claude Code handles that), external HTTP calls, runtime execution of generated code.

**§ 3 Actors**
Always include:
- MCP Client (Claude / Cursor) — invokes the tool
- Developer — receives and uses the output
Add any additional actors implied by the tool description.

**§ 4 User Stories**
Write 2–3 user stories in Given/When/Then format.
Base them on the tool's inputs and expected outputs.

**§ 5 Acceptance Criteria**
Write 4–6 measurable criteria covering:
- Output correctness (generated code compiles, spec sections are filled)
- Input validation (required fields present)
- Error handling (invalid input returns descriptive error)
- Knowledge base alignment (output matches internal standards)

**§ 6 API Contract**
Map to the MCP tool interface:
- "Endpoint": `MCP tool: $ARGUMENTS`
- Request: the inputs table from the plan (field, type, required, validation)
- Response 200: the structured output shape
- Response Error: `{ "error": "description", "isError": true }`

**§ 7 Business Rules**
Write 3–5 rules. Always include:
- BR-01: Tool must be stateless (no side effects beyond the response)
- BR-02: Tool is read-only (ReadOnlyHint: true, OpenWorldHint: false)
- BR-03: All output must conform to the knowledge base files listed in the plan
Add tool-specific rules derived from the description.

**§ 8 State Transitions**
Write: "Not applicable — this tool is stateless."

**§ 9 Error Cases**
Always include these rows:
- Missing required input → bad_request_error → 400
- Feature/template not found → not_found_error → 404
- Template render failure → internal_server_error → 500
Add tool-specific error cases based on the inputs.

**§ 10 Non-Functional Requirements**
Use these defaults from `context/0-context.md`:
- Latency (p99): < 2000 ms (generation is compute-bound)
- Availability: 99.9%
- Throughput: matches your platform's service limits
- Data sensitivity: Non-PII

**§ 11 Dependencies**
List the knowledge base files from the plan entry as dependencies (type: embedded knowledge base).
Also include `ai_reactive_framework/context/0-context.md` and `business_rules_template.md`.

**§ 12 Open Questions**
Leave 2 empty rows scaffolded for the developer to fill in.

## Step 4 — Write the output file

Write the completed spec to:
`ai_reactive_framework/flow/1-to_do/$ARGUMENTS.md`

Use this header before the spec content:
```
---
feature: $ARGUMENTS
phase: to_do
priority: <P0/P1/P2 from plan>
created: <today's date>
source: ai_reactive_framework/context/1-plan.md
---
```

## Step 5 — Confirm

Tell the user:
"✓ Business spec created: ai_reactive_framework/flow/1-to_do/$ARGUMENTS.md
 Next: /rf_wip $ARGUMENTS  (when you start development)"
