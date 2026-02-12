#!/usr/bin/env bash
set -euo pipefail

# amelia.food — Automated todo runner
# Runs `claude -p` for each todo item in order, completing one at a time.
# Two-phase approach per item:
#   1. Implement: `claude -p` picks up the item and implements it
#   2. Mark done: a separate `claude -p` runs `/todo done` to clean up

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

LOG_DIR="$PROJECT_DIR/docs/todo-logs"
mkdir -p "$LOG_DIR"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Count items remaining
count_items() {
  grep -c '^\- \[' docs/todo.md 2>/dev/null || echo "0"
}

# Extract the spec name from the first todo item's link, e.g. "textures" from "(todo/textures.md)"
get_spec_name() {
  grep -m1 '^\- \[' docs/todo.md | sed -n 's/.*](todo\/\(.*\)\.md).*/\1/p'
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  amelia.food — Todo Runner${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

TOTAL=$(count_items)
echo -e "Found ${YELLOW}${TOTAL}${NC} items in docs/todo.md"
echo ""

ITEM_NUM=0

while true; do
  REMAINING=$(count_items)

  if [ "$REMAINING" -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  All todo items complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    break
  fi

  ITEM_NUM=$((ITEM_NUM + 1))
  TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
  LOG_FILE="$LOG_DIR/${TIMESTAMP}-item-${ITEM_NUM}.log"
  DONE_LOG_FILE="$LOG_DIR/${TIMESTAMP}-item-${ITEM_NUM}-done.log"

  # Extract the first item's text and spec name for display
  FIRST_ITEM=$(grep -m1 '^\- \[' docs/todo.md | sed 's/^- \[//' | sed 's/\](.*$//')
  SPEC_NAME=$(get_spec_name)

  echo -e "${YELLOW}────────────────────────────────────────${NC}"
  echo -e "${YELLOW}  Item ${ITEM_NUM} of ${TOTAL}: ${FIRST_ITEM}${NC}"
  echo -e "${YELLOW}  (${REMAINING} remaining)${NC}"
  echo -e "${YELLOW}────────────────────────────────────────${NC}"
  echo ""

  # Phase 1: Implement the item
  IMPLEMENT_PROMPT="You are working on the amelia.food project. Read CLAUDE.md for project context.

Run /todo next — this will pick the first available item from docs/todo.md and implement it fully.

After implementing, verify the build passes with \`npm run build\`.

Do NOT run /todo done — that will be handled separately.

Important:
- Follow all specs in the todo spec files exactly
- Use CSS modules, not Tailwind
- Use Vercel AI SDK v6 for AI interactions
- Test visually using Chrome MCP tools (take a screenshot after implementing)
- If the dev server isn't running, start it with \`npm run dev\` in the background first
- Commit your changes after each completed item with a descriptive message"

  echo -e "${BLUE}Phase 1: Implementing...${NC}"
  echo ""

  # --verbose --output-format stream-json: stream all events (tool calls, results, text)
  #   as JSON so progress is visible in real time.
  if claude -p --model claude-opus-4-6 --verbose --output-format stream-json "$IMPLEMENT_PROMPT" 2>&1 | tee "$LOG_FILE"; then
    echo ""
    echo -e "${GREEN}  ✓ Implementation completed${NC}"
  else
    echo ""
    echo -e "${RED}  ✗ Implementation failed${NC}"
    echo -e "${RED}  Check log: ${LOG_FILE}${NC}"
    echo ""
    read -p "Continue to next item? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo -e "${RED}Stopping.${NC}"
      exit 1
    fi
    continue
  fi

  # Phase 2: Mark the item as done (separate claude invocation)
  DONE_PROMPT="You are working on the amelia.food project. Read CLAUDE.md for project context.

Run /todo done — the item \"${FIRST_ITEM}\" has been fully implemented and committed.

This should:
1. Verify the build passes with \`npm run build\`
2. Remove the first entry from docs/todo.md
3. Delete docs/todo/${SPEC_NAME}.md if it exists"

  echo ""
  echo -e "${BLUE}Phase 2: Marking done...${NC}"
  echo ""

  if claude -p --model claude-opus-4-6 --verbose --output-format stream-json "$DONE_PROMPT" 2>&1 | tee "$DONE_LOG_FILE"; then
    echo ""
    echo -e "${GREEN}  ✓ Item ${ITEM_NUM} done and removed${NC}"
  else
    echo ""
    echo -e "${RED}  ✗ Failed to mark item done${NC}"
    echo -e "${RED}  Check log: ${DONE_LOG_FILE}${NC}"
    echo ""
    read -p "Continue to next item? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo -e "${RED}Stopping.${NC}"
      exit 1
    fi
  fi

  echo ""
  sleep 2
done

echo ""
echo -e "${GREEN}Done! All ${TOTAL} items have been processed.${NC}"
echo -e "${BLUE}Logs are in: ${LOG_DIR}/${NC}"
