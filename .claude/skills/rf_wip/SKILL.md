---
name: rf_wip
description: "Move the feature `$ARGUMENTS` from the `to_do` phase into the `wip` (work in progress) phase."
disable-model-invocation: true
argument-hint: "[feature]"
---

Follow these steps exactly:

## Step 1 — Verify source file exists

Check that `ai_reactive_framework/flow/1-to_do/$ARGUMENTS.md` exists.
If it does not exist, stop and tell the user:
"Feature '$ARGUMENTS' not found in flow/1-to_do/. Run /rf_to_do $ARGUMENTS first."

Also check that `ai_reactive_framework/flow/2-wip/$ARGUMENTS.md` does NOT already exist.
If it does, stop and tell the user:
"Feature '$ARGUMENTS' is already in wip. Nothing to do."

## Step 2 — Read the file

Read the full content of `ai_reactive_framework/flow/1-to_do/$ARGUMENTS.md`.

## Step 3 — Update the phase metadata

In the frontmatter at the top of the file, change:
```
phase: to_do
```
to:
```
phase: wip
wip_started: <today's date>
```

## Step 4 — Write to destination

Write the updated content to `ai_reactive_framework/flow/2-wip/$ARGUMENTS.md`.

## Step 5 — Delete source

Delete `ai_reactive_framework/flow/1-to_do/$ARGUMENTS.md` by overwriting it with a redirect marker, then use the Bash tool to remove it:
```bash
rm "ai_reactive_framework/flow/1-to_do/$ARGUMENTS.md"
```

## Step 6 — Confirm

Tell the user:
"✓ $ARGUMENTS moved: flow/1-to_do → flow/2-wip
 Next: /rf_review $ARGUMENTS  (when ready for code review)"
