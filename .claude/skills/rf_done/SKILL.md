---
name: rf_done
description: "Move the feature `$ARGUMENTS` from the `to_review` phase into the `done` phase."
disable-model-invocation: true
argument-hint: "[feature]"
---

Follow these steps exactly:

## Step 1 — Verify source file exists

Check that `ai_reactive_framework/flow/3-to_review/$ARGUMENTS.md` exists.
If it does not exist, stop and tell the user:
"Feature '$ARGUMENTS' not found in flow/3-to_review/. Run /rf_review $ARGUMENTS first."

Also check that `ai_reactive_framework/flow/4-done/$ARGUMENTS.md` does NOT already exist.
If it does, stop and tell the user:
"Feature '$ARGUMENTS' is already in done. Nothing to do."

## Step 2 — Read the file

Read the full content of `ai_reactive_framework/flow/3-to_review/$ARGUMENTS.md`.

## Step 3 — Update the phase metadata

In the frontmatter at the top of the file, change:
```
phase: to_review
```
to:
```
phase: done
completed: <today's date>
```

## Step 4 — Write to destination

Write the updated content to `ai_reactive_framework/flow/4-done/$ARGUMENTS.md`.

## Step 5 — Delete source

Use the Bash tool to remove the source file:
```bash
rm "ai_reactive_framework/flow/3-to_review/$ARGUMENTS.md"
```

## Step 6 — Confirm

Tell the user:
"✓ $ARGUMENTS completed: flow/3-to_review → flow/4-done
 Feature '$ARGUMENTS' is done."
