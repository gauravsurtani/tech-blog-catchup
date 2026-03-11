#!/bin/bash
# Compile and run the API contract test against the live backend.
# Usage: cd ios && bash scripts/run_contract_test.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/TechBlogCatchup"
BIN="/tmp/api_contract_test"

echo "Compiling contract test..."
swiftc -o "$BIN" \
    "$SRC/Config/AppConfig.swift" \
    "$SRC/Extensions/Date+Formatting.swift" \
    "$SRC/Models/Post.swift" \
    "$SRC/Models/Tag.swift" \
    "$SRC/Models/Source.swift" \
    "$SRC/Models/Job.swift" \
    "$SRC/Models/PaginatedPosts.swift" \
    "$SRC/Models/CrawlStatusItem.swift" \
    "$SRC/Models/StatusInfo.swift" \
    "$SRC/Services/APIError.swift" \
    "$ROOT/scripts/api_contract_test.swift"

echo "Running..."
"$BIN"
