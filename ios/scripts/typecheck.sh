#!/bin/bash
# iOS Swift Type-Check Validation
# Runs cross-file type-checking on Foundation-only files,
# syntax-only parsing on SwiftUI-dependent files.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/TechBlogCatchup"
PASS=0
FAIL=0
ERRORS=""

green()  { printf "\033[32m%s\033[0m\n" "$1"; }
red()    { printf "\033[31m%s\033[0m\n" "$1"; }
yellow() { printf "\033[33m%s\033[0m\n" "$1"; }
bold()   { printf "\033[1m%s\033[0m\n" "$1"; }

run_check() {
    local label="$1"
    shift
    bold "--- $label ---"
    if output=$(swiftc "$@" 2>&1); then
        green "  PASS"
        PASS=$((PASS + 1))
    else
        red "  FAIL"
        echo "$output" | head -30
        ERRORS="$ERRORS\n=== $label ===\n$output"
        FAIL=$((FAIL + 1))
    fi
    echo
}

echo
bold "=========================================="
bold "  iOS Swift Type-Check Validation"
bold "=========================================="
echo

# ============================================================
# GROUP 1: Core Foundation (cross-file type-check)
# Models + Services + Config + Extensions — all Foundation-only
# ============================================================

GROUP1_FILES=(
    "$SRC/Config/AppConfig.swift"
    "$SRC/Extensions/Date+Formatting.swift"
    "$SRC/Models/Post.swift"
    "$SRC/Models/Tag.swift"
    "$SRC/Models/Source.swift"
    "$SRC/Models/Job.swift"
    "$SRC/Models/PaginatedPosts.swift"
    "$SRC/Models/CrawlStatusItem.swift"
    "$SRC/Models/StatusInfo.swift"
    "$SRC/Services/APIError.swift"
    "$SRC/Services/APIClient.swift"
)

run_check "Group 1: Core Foundation (12 files — cross-file typecheck)" \
    -typecheck "${GROUP1_FILES[@]}"

# ============================================================
# GROUP 2: ViewModels + GenerationStatusService
# All use Foundation only + depend on Group 1 types
# ============================================================

GROUP2_FILES=(
    "${GROUP1_FILES[@]}"
    "$SRC/Features/Generate/GenerationStatusService.swift"
    "$SRC/Features/Home/HomeViewModel.swift"
    "$SRC/Features/Explore/ExploreViewModel.swift"
    "$SRC/Features/PostDetail/PostDetailViewModel.swift"
    "$SRC/Features/Playlist/PlaylistViewModel.swift"
    "$SRC/Features/Status/StatusViewModel.swift"
)

run_check "Group 2: ViewModels + Services (18 files — cross-file typecheck)" \
    -typecheck "${GROUP2_FILES[@]}"

# ============================================================
# GROUP 3: SwiftUI-dependent files (syntax parse only)
# These require iOS SDK which isn't available with CLI tools
# ============================================================

bold "--- Group 3: SwiftUI/UIKit files (syntax parse) ---"

# Collect all .swift files NOT in Group 2 and NOT test files
GROUP3_PASS=0
GROUP3_FAIL=0
GROUP3_ERRORS=""

while IFS= read -r -d '' file; do
    # Skip files already in Group 2
    skip=false
    for g2 in "${GROUP2_FILES[@]}"; do
        if [[ "$file" == "$g2" ]]; then
            skip=true
            break
        fi
    done
    $skip && continue

    # Skip test files
    [[ "$file" == *Tests* ]] && continue

    relpath="${file#$ROOT/}"
    if output=$(swiftc -parse "$file" 2>&1); then
        GROUP3_PASS=$((GROUP3_PASS + 1))
    else
        GROUP3_FAIL=$((GROUP3_FAIL + 1))
        GROUP3_ERRORS="$GROUP3_ERRORS\n  FAIL: $relpath\n$output"
    fi
done < <(find "$SRC" -name '*.swift' -print0 | sort -z)

# Also check ShareExtension and App entry
for extra in "$ROOT/ShareExtension/ShareViewController.swift"; do
    if [[ -f "$extra" ]]; then
        relpath="${extra#$ROOT/}"
        if output=$(swiftc -parse "$extra" 2>&1); then
            GROUP3_PASS=$((GROUP3_PASS + 1))
        else
            GROUP3_FAIL=$((GROUP3_FAIL + 1))
            GROUP3_ERRORS="$GROUP3_ERRORS\n  FAIL: $relpath\n$output"
        fi
    fi
done

if [[ $GROUP3_FAIL -eq 0 ]]; then
    green "  PASS ($GROUP3_PASS files parsed)"
    PASS=$((PASS + 1))
else
    red "  FAIL ($GROUP3_FAIL of $((GROUP3_PASS + GROUP3_FAIL)) files)"
    echo -e "$GROUP3_ERRORS"
    ERRORS="$ERRORS\n=== Group 3 ===\n$GROUP3_ERRORS"
    FAIL=$((FAIL + 1))
fi
echo

# ============================================================
# SUMMARY
# ============================================================

bold "=========================================="
bold "  RESULTS"
bold "=========================================="
green "  Passed: $PASS groups"
if [[ $FAIL -gt 0 ]]; then
    red "  Failed: $FAIL groups"
    echo
    yellow "Error details:"
    echo -e "$ERRORS"
    exit 1
else
    green "  All checks passed!"
    exit 0
fi
