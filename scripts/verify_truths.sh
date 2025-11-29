#!/usr/bin/env bash
set -euo pipefail
ROOT_TRUTHS=(master_spec.md admin_guide.md data_import_guide_doors.md spec_kp_formulas.md state.md roadmap.md sync_guide.md)
fail=0
for f in "${ROOT_TRUTHS[@]}"; do
  [[ -f "$f" ]] || { echo "::error ::Missing root truth file: $f"; fail=1; }
done
for f in "${ROOT_TRUTHS[@]}"; do
  matches=$(git ls-files -- "app/**/$f" | wc -l | tr -d ' ')
  [[ "$matches" == "0" ]] || { echo "::error ::Duplicate truth in app/: $f"; git ls-files -- "app/**/$f"; fail=1; }
done
[[ -f "bootstrap.sh" ]] || echo "::warning ::bootstrap.sh not found in repo root"
exit $fail
