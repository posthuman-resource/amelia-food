Manage the project todo list for amelia.food — a personal gift website built with Next.js.

## Project Context

This is a Valentine's Day gift site at `amelia.food`. The homepage is a top-down table surface with discoverable objects (emoji game, valentine card, future items). The design language is "warm tactile whimsy" — handmade feeling, not a tech product. See `amelia-food-primer.md` for full details.

## Files

- **Index:** `docs/todo.md` - All items with one-line descriptions (complex items link to spec files)
- **Specs:** `docs/todo/<name>.md` - Detailed specifications for complex items (optional)

## Commands

| Command               | Action                                                          |
| --------------------- | --------------------------------------------------------------- |
| `/todo`               | Work on next available item                                     |
| `/todo next`          | Same as `/todo`                                                 |
| `/todo <keyword>`     | Work on item matching keyword (e.g., `/todo emoji`)             |
| `/todo list`          | Show all items, ask which to work on                            |
| `/todo done`          | Remove current item (delete spec file if exists)                |
| `/todo <instruction>` | Create, update, or manage items based on instruction            |
| `/todo <issue/want>`  | Investigate and create well-researched item(s)                  |

## How It Works

### Working on an Item (`/todo`, `/todo next`, `/todo keyword`)

1. **Find the item** - Read `docs/todo.md`, select by keyword or first available
2. **Check for spec file** - Look for `docs/todo/<name>.md` matching the item
3. **If spec exists:** Implement it (see "Implementation" below)
4. **If no spec and item is complex:** Enter plan mode, write the spec, then implement
5. **If no spec and item is simple:** Implement directly

### Simple vs Complex Items

**Simple items** (no spec file needed):

- Single, clear action with obvious implementation
- Example: "Add subtle hover rotation to table objects"

**Complex items** (create spec file):

- Requires research or investigation
- Multiple sub-tasks or acceptance criteria
- Architectural or design decisions needed
- Example: "Build the emoji game conversation UI" → needs spec detailing components, interactions, prompt design

### Instructions (`/todo <instruction>`)

Triggered when input is an instruction (not a keyword or command). Instructions can:

**Create items:**

- `/todo Add a new table object for a recipe card` - Add simple item (no spec)
- `/todo Add items from amelia-food-primer.md to the todo list` - Create from external source

**Update items:**

- `/todo Check progress on the emoji picker` - Assess completion
- `/todo Update the valentine item with what's been done` - Update spec checkboxes

**Manage items:**

- `/todo Reorganize the list by priority` - Restructure list
- `/todo Split the emoji game into smaller pieces` - Break into multiple items

#### Triaging New Information

When input describes behaviors, issues, or abstract wants that don't clearly map to existing items:

1. **Investigate first** - Don't assume you understand the problem
   - Search the codebase for relevant code paths
   - Understand the current implementation
   - Reproduce or trace the described behavior if possible
   - Translate abstract descriptions into concrete technical details

2. **Break down into logical pieces** - One issue description may reveal multiple independent problems
   - Separate unrelated concerns into distinct items
   - Group related fixes that should be done together
   - Identify dependencies between pieces

3. **Create well-researched items** - Each item should have:
   - Concrete technical details tied to actual code
   - Specific files and components involved
   - Clear acceptance criteria based on your investigation

**Examples:**

- `/todo the table objects feel flat and lifeless on mobile`
  → Investigate touch interactions, shadows, textures — create spec with specific improvements

- `/todo the emoji picker is slow when filtering`
  → Profile the filtering logic, check emoji dataset size, create spec with fixes

- `/todo something is wrong with the chat API, also the valentine won't open`
  → Two separate concerns - investigate each, create 2 items with specs

The goal is to transform vague or abstract input into actionable, well-specified items grounded in the actual codebase.

#### Creating Items

**Simple items:**

1. Add one-liner to `docs/todo.md`
2. Report: "Added item. Use `/todo <keyword>` to work on it."

**Complex items (after investigation/planning):**

1. Create `docs/todo/<name>.md` using the template below
2. Add entry to `docs/todo.md` with link: `- [Item description](todo/<name>.md)`
3. Report: "Created item with spec. Use `/todo <keyword>` to work on it."

#### Updating Items

When asked to check/update item status:

1. Read `docs/todo.md` to find the item
2. If spec exists, read `docs/todo/<name>.md`
3. Check the codebase to see what's actually been done
4. Update checkboxes in spec (if exists) or update description
5. If fully complete, prompt user to run `/todo done`
6. If partially complete, summarize what remains

### Implementation

When implementing an item:

1. Read the spec file if it exists — the Requirements and Acceptance Criteria are your checklist
2. Use TaskCreate to break down the work into trackable sub-items
3. Use TaskUpdate to mark sub-items as in_progress when starting, completed when done
4. Implement each requirement
5. **Check off spec checkboxes as you go** — after completing each requirement or acceptance criterion, update the spec file to mark it `- [x]`. This is how progress is tracked in the spec.
6. **Verify acceptance criteria** — after implementation, go through each acceptance criterion in the spec:
   - If the criterion involves visual output, use Chrome MCP tools (take a screenshot) to verify
   - If the criterion involves build/runtime behavior, test it (e.g., `npm run build`)
   - Mark each criterion `- [x]` in the spec file as it passes
7. **If fully done:** All checkboxes checked, build passes — prompt user to run `/todo done`
8. **If partially done:** Update the spec file with remaining unchecked items and a note on what's left

**Design reminders while implementing:**
- CSS modules or global CSS with CSS variables — no Tailwind
- Self-host fonts via `next/font/google`
- Warm, tactile, handmade aesthetic — not a tech product
- Gentle animations, soft shadows, natural textures
- Mobile-first, works beautifully on phone and desktop
- No analytics, no tracking, no cookies

### Completing an Item (`/todo done`)

**IMPORTANT:** Before removing any item, you MUST:

1. **Verify the build works** - Run `npm run build` — no errors allowed
2. If it fails, fix the issues first - no item can be considered done with a broken build

Once build passes:

1. Delete `docs/todo/<name>.md` if it exists
2. Remove entry from `docs/todo.md`
3. Do NOT mark as "completed" or add strikethrough - just remove it entirely

**CRITICAL:** Never mention deleted items. Once an item is removed, it no longer exists.

## Principle

The todo list represents **active work only**. Completed work lives in git history.

## Spec File Template

Use this template for complex items that need detailed specifications:

```markdown
# <Item Title>

## Objective

One paragraph describing what this accomplishes and how it fits the amelia.food experience.

## Requirements

- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

## Technical Approach

Description of the implementation approach.

### Key Files

- `path/to/file.tsx` - purpose of this file

### Design Notes

How this aligns with the "warm tactile whimsy" aesthetic. Specific colors, textures, animations, or interactions.

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
```

## Examples

| Input                                              | Interpretation     | Action                                      |
| -------------------------------------------------- | ------------------ | ------------------------------------------- |
| `/todo`                                            | Next item          | Find first available, implement             |
| `/todo next`                                       | Next item          | Find first available, implement             |
| `/todo emoji`                                      | Keyword match      | Find item with "emoji", implement           |
| `/todo list`                                       | Command            | Show all items                              |
| `/todo done`                                       | Command            | Remove current item + spec file             |
| `/todo Add a recipe card object to the table`      | Create instruction | Add simple item (no spec)                   |
| `/todo Build the emoji game with Claude API`       | Create instruction | Investigate, create item with spec          |
| `/todo Check status of the valentine component`    | Update instruction | Audit item, update spec checkboxes          |
| `/todo the table feels empty on wide screens`      | Triage             | Investigate, create item with spec          |
| `/todo emoji picker is laggy, also hover is wrong` | Triage             | Investigate both, create 2 items with specs |

### Disambiguation

How to tell a keyword from an instruction from triage input:

- **Keyword:** 1-2 words that likely match an existing item in `docs/todo.md`
- **Instruction:** A clear directive about list management ("create", "add", "check", "update", "split")
- **Triage:** Describes behaviors, issues, symptoms, or abstract wants without explicit management language

When ambiguous, check `docs/todo.md` first. If a match exists, treat as keyword. If it's clearly about managing the list, treat as instruction. Otherwise, treat as triage input - investigate first, then create well-researched items with specs.
