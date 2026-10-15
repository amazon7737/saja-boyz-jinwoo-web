#!/bin/bash
set -eu
: "${SOBAYA_APP:?}" "${SOBAYA_MODEL:?}" "${SOBAYA_ROLE:?}"
task_dir=$(mktemp -d)
trap 'rm -rf "$task_dir"' EXIT
cat > "$task_dir/original-prompt.txt"
if [ "$SOBAYA_ROLE" = implement ]; then
  cat > "$task_dir/prompt.txt" <<'GUIDANCE'
Additional concrete browser evidence for the current approved retry requirement:
The QA copy uses the real Next.js 16.3.8 runtime and the unchanged app error components. A Server Component throws while the local API is unavailable. After the cause is resolved, clicking the current reset-only button keeps the error UI because reset does not re-fetch Server Component data. Next.js 16.3 provides a stable retry prop that re-fetches and re-renders. See https://nextjs.org/docs/app/api-reference/file-conventions/error#retry and the installed Next.js source.
Within the current approved entry, fix RouteError and GlobalError to forward/use optional retry when Next.js supplies it, while preserving the approved reset callback behavior when only reset is supplied. The existing exact tests pass only reset, so keep that public compatibility. Do not edit specification, tests, plan, dependencies, instructions, Git metadata or commit. No new feature or acceptance change is requested. Implement the smallest source change that makes server retry actually recover. Run focused checks; the Sobaya runner will enforce the full suite and hygiene. Return defect only if changing approved inputs is truly required.
GUIDANCE
else
  cat > "$task_dir/prompt.txt" <<'GUIDANCE'
Independently examine the actual implementation, including the server recovery behavior: Next.js 16.3 retry re-fetches Server Component data whereas reset alone only re-renders. Confirm safe fallback messages, shouldCatch type inference, normal navigation, and preservation of existing API/image behavior. Use a fresh read-only context, and report any actionable findings. Do not edit files.
GUIDANCE
fi
cat "$task_dir/original-prompt.txt" >> "$task_dir/prompt.txt"
sandbox=workspace-write
[ "$SOBAYA_ROLE" != review ] || sandbox=read-only
codex exec --cd "$SOBAYA_APP" --model "$SOBAYA_MODEL" --sandbox "$sandbox" -c 'approval_policy="never"' --json --output-schema "$SOBAYA_APP/../sobaya/tdd-set/worker-result.schema.json" --output-last-message "$task_dir/result.json" - < "$task_dir/prompt.txt" > "$task_dir/events.jsonl"
cat "$task_dir/events.jsonl"
if jq -e -s 'any(.[]; .type=="turn.failed" or .type=="error")' "$task_dir/events.jsonl" >/dev/null; then exit 1; fi
jq -c --slurpfile events "$task_dir/events.jsonl" '. + {usage: ([$events[] | select(.type=="turn.completed") | .usage][-1] // {})}' "$task_dir/result.json"
