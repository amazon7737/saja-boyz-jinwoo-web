#!/bin/bash
set -euo pipefail
task_dir=$(mktemp -d)
trap 'rm -rf "$task_dir"' EXIT
cat > "$task_dir/prompt.txt"
if [ "$SOBAYA_ROLE" = implement ]; then
cat >> "$task_dir/prompt.txt" <<'CONTEXT'
Implement only approved spec.md and current exact entry. Preserve tests, fixtures, proposals, package files, harness and git metadata. No commits. Source only. Read the complete approved spec. Copy exact approved proposed-assets/icon.svg, favicon.ico, apple-icon.png into src/app and document provenance in public/brand/README.md. Preserve SEO metadata and Google verification.
Start geolocation alongside SDK loading on first document entry, deduplicate StrictMode while delivering its callback to live mount; preserve in-memory return viewport and cancel automatic recenter after user drag. Validate coordinates, support denial/timeout/unsupported recovery and manual retry. Ignore stale callbacks after SDK failure or unmount. Do not store location or add dependencies. Maintain existing SDK behavior and UI.
Worker sandbox cannot bind sockets for full suite/build: run focused map tests, typecheck and format only. Parent runner runs unchanged complete suite; coordinator runs build/browser QA. Never alter tests to bypass sandbox limitations.

CONTEXT
fi
if [ "$SOBAYA_ROLE" = review ]; then
cat >> "$task_dir/prompt.txt" <<'REVIEW'
Fresh read-only review against approval baseline and origin/dev, complete approved spec and all product changes. Check StrictMode async lifetime, callback delivery/deduplication, SDK retry, user drag, native permission failure/retry, in-memory return viewport, invalid coordinates, no location persistence, icon assets and unchanged SEO. No writes, tests/build, commits or publication. Return actionable defects with file/line; done only when none.

REVIEW
fi
sandbox=workspace-write
[ "$SOBAYA_ROLE" != review ] || sandbox=read-only
codex exec --cd "$SOBAYA_APP" --model "$SOBAYA_MODEL" --sandbox "$sandbox" -c 'approval_policy="never"' --json --output-schema "$SOBAYA_APP/../sobaya/tdd-set/worker-result.schema.json" --output-last-message "$task_dir/result.json" - < "$task_dir/prompt.txt" > "$task_dir/events.jsonl"
cat "$task_dir/events.jsonl"
if jq -e -s 'any(.[]; .type=="turn.failed")' "$task_dir/events.jsonl" >/dev/null; then exit 1; fi
jq -c --slurpfile events "$task_dir/events.jsonl" '. + {usage: ([$events[] | select(.type=="turn.completed") | .usage][-1] // {})}' "$task_dir/result.json"
