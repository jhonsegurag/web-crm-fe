---
name: rf_review
description: "Move the feature `$ARGUMENTS` from the `wip` phase into the `to_review` phase."
disable-model-invocation: true
argument-hint: "[feature]"
---

Follow these steps exactly:

## Step 1 — Verify source file exists

Check that `ai_reactive_framework/flow/2-wip/$ARGUMENTS.md` exists.
If it does not exist, stop and tell the user:
"Feature '$ARGUMENTS' not found in flow/2-wip/. Run /rf_wip $ARGUMENTS first."

Also check that `ai_reactive_framework/flow/3-to_review/$ARGUMENTS.md` does NOT already exist.
If it does, stop and tell the user:
"Feature '$ARGUMENTS' is already in to_review. Nothing to do."

## Step 2 — Read the file

Read the full content of `ai_reactive_framework/flow/2-wip/$ARGUMENTS.md`.

## Step 3 — Update the phase metadata

In the frontmatter at the top of the file, change:
```
phase: wip
```
to:
```
phase: to_review
review_requested: <today's date>
```

## Step 4 — Write to destination

Write the updated content to `ai_reactive_framework/flow/3-to_review/$ARGUMENTS.md`.

## Step 5 — Delete source

Use the Bash tool to remove the source file:
```bash
rm "ai_reactive_framework/flow/2-wip/$ARGUMENTS.md"
```

## Step 6 — Confirm

Tell the user:
"✓ $ARGUMENTS moved: flow/2-wip → flow/3-to_review
 Next: /rf_done $ARGUMENTS  (when review is approved)"
