#!/usr/bin/env bash
set -euo pipefail

# amelia.food — Automated todo runner
# Runs `claude -p` for each todo item in order, completing one at a time.
# Each invocation reads the current todo list, works the first item, and marks it done.

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

  # Extract the first item's text for display
  FIRST_ITEM=$(grep -m1 '^\- \[' docs/todo.md | sed 's/^- \[//' | sed 's/\](.*$//')

  echo -e "${YELLOW}────────────────────────────────────────${NC}"
  echo -e "${YELLOW}  Item ${ITEM_NUM} of ${TOTAL}: ${FIRST_ITEM}${NC}"
  echo -e "${YELLOW}  (${REMAINING} remaining)${NC}"
  echo -e "${YELLOW}────────────────────────────────────────${NC}"
  echo ""

  # The prompt tells Claude to work the next todo item and mark it done
  PROMPT="You are working on the amelia.food project. Read CLAUDE.md for project context.

Run /todo next — this will pick the first available item from docs/todo.md and implement it fully.

After implementing, verify the build passes with \`npm run build\`.

Then run /todo done to remove the completed item.

Important:
- Follow all specs in the todo spec files exactly
- Use CSS modules, not Tailwind
- Use Vercel AI SDK v6 for AI interactions
- Test visually using Chrome MCP tools (take a screenshot after implementing)
- If the dev server isn't running, start it with \`npm run dev\` in the background first
- Commit your changes after each completed item with a descriptive message"

  echo -e "${BLUE}Running claude -p ...${NC}"
  echo ""

  # Run claude with the prompt (permissions handled by .claude/settings.json)
  if claude -p "$PROMPT" 2>&1 | tee "$LOG_FILE"; then
    echo ""
    echo -e "${GREEN}  ✓ Item ${ITEM_NUM} completed successfully${NC}"
  else
    echo ""
    echo -e "${RED}  ✗ Item ${ITEM_NUM} encountered an error${NC}"
    echo -e "${RED}  Check log: ${LOG_FILE}${NC}"
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
