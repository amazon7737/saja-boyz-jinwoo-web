#!/bin/bash
set -eu
: "${SOBAYA_APP:?}" "${SOBAYA_MODEL:?}" "${SOBAYA_ROLE:?}"
task_dir=$(mktemp -d)
trap 'rm -rf "$task_dir"' EXIT
cat > "$task_dir/prompt.txt"
cat >> "$task_dir/prompt.txt" <<'CONTEXT'

Read the exact approved spec.md and the reference files under collab/active/codex--figma-ui-foundation/, especially figma-source-reference.md, asset-sources.md and asset-manifest.json. They are the approved visual scope, not permission to change tests. The attached images are actual Figma renders, not app implementation assets. Fonts and exact Figma SVG originals are ready under .claude/cache/design-assets/; copy them into appropriate public paths with licenses and preserve original SVG root geometry. The approved custom brand SVG is under collab/active/codex--figma-ui-foundation/brand-proposal.svg. Do not alter the original icons or redraw them.

Current brand-entry regression diagnosis: unchanged error-boundaries.test.ts line126 and next-error-boundary.test.ts line66 require header.textContent to retain the brand name 흉흉. The SVG image alt alone does not provide DOM textContent. Preserve meaningful accessible brand text alongside the visual SVG, e.g. a screen-reader text label in the home link, without adding visible duplicate branding or changing any tests. The coordinator detected this in the exact full suite after the brand/header implementation; it is a source regression, not an environment problem. Fix this while resuming the current brand entry and run its unchanged boundary tests plus the new exact test.

Implement only the current approved entry, honoring all visual requirements applicable to that entry rather than stopping at assertions. For the dedicated-screen entry, shared typography/tokens and correct full-screen route frames are part of the approved shell foundation. Navigation, brand header and filter surfaces have their own following entries; do not materialize those tests or check boxes yourself. For navigation and header entries use the exact Figma dimensions in spec.md, and use reusable component folders. Preserve all existing API, image, report timeout/retry, share and map viewport behavior. Never edit tests/fixtures/headers, app acceptance commands, plan, Git state or Sobaya runtime. Source implementation belongs only to this app checkout.

Coordinator environment diagnosis: the first entry implementation has been verified with the full exact suite outside the inner worker sandbox: 23 files / 98 tests passed. The worker sandbox cannot bind local ports, so its full harness integration and default Turbopack build may fail with EPERM although the same source passes the coordinator suite. The runner performs the full suite itself at every checkpoint; focused worker verification does not replace that checkpoint. Do not change acceptance commands, tests or the build script to work around this. The coordinator owns the journal, Git commits, push and supplemental build/browser verification; being forbidden to perform those operations is not a reason to return handoff. If current source satisfies the entry and applicable approved requirements, return done with accurate focused evidence and the environmental limitation. Real source/test defects still need diagnosis.

The full exact Vitest suite includes shell integration tests and normally takes about 120 seconds with little early output. Do not treat that delay as a hang. Let the command finish. The coordinator will run production browser measurements and all-screen Figma comparisons after the loop. Do not claim full service design completion: this approved feature is the common foundation.
CONTEXT
if [ "$SOBAYA_ROLE" = review ]; then
cat >> "$task_dir/prompt.txt" <<'REVIEW'

Independent review: fresh context, read-only. Inspect the whole approved spec, all changed source and protected-test preservation, static asset callsites/geometry and local-font loading configuration. Review must catch concrete missing visual requirements, duplicate route chrome, wrong active navigation, fake enabled filters and regressions. The runtime gate already ran the full suite and hygiene at this exact HEAD. Do not attempt write-producing build/tests in the read-only sandbox; inspect runtime evidence if needed. No edit, commit or blanket acceptance.
REVIEW
fi
sandbox=workspace-write
[ "$SOBAYA_ROLE" != review ] || sandbox=read-only
images=()
for name in 18-2348 11-1797 11-2123 11-2043 11-2221; do
  file="$SOBAYA_APP/.claude/cache/design-assets/figma/$name.png"
  [ ! -f "$file" ] || images+=(--image "$file")
done
codex exec --cd "$SOBAYA_APP" --model "$SOBAYA_MODEL" --sandbox "$sandbox" -c 'approval_policy="never"' --json --output-schema "$SOBAYA_APP/../sobaya/tdd-set/worker-result.schema.json" --output-last-message "$task_dir/result.json" "${images[@]}" - < "$task_dir/prompt.txt" > "$task_dir/events.jsonl"
cat "$task_dir/events.jsonl"
if jq -e -s 'any(.[]; .type=="turn.failed" or .type=="error")' "$task_dir/events.jsonl" >/dev/null; then exit 1; fi
jq -c --slurpfile events "$task_dir/events.jsonl" '. + {usage: ([$events[] | select(.type=="turn.completed") | .usage][-1] // {})}' "$task_dir/result.json"
