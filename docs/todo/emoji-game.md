# Build the EmojiGame Full Integration

## Objective

Wire together the Conversation, EmojiPicker, EmojiComposer, and chat API into the complete "Fluent in Feelings" emoji game. This is the main interactive experience — a back-and-forth emoji conversation with Claude that teaches Amelia the language of emoji.

## Requirements

- [x] Uses `useChat` from `@ai-sdk/react` with `append` for programmatic message sending to `/api/chat`
- [x] Game flow: Claude sends opening emoji → Amelia responds → Claude reacts → repeat
- [x] On mount, automatically send an initial system-triggered message to get Claude's opening emoji
- [x] Conversation display shows the full exchange
- [x] EmojiPicker for selecting emoji
- [x] EmojiComposer for building up a response before sending
- [x] "What just happened?" button always visible — sends a text message asking Claude to explain
- [x] "New conversation" button to clear and start fresh
- [x] Layout: conversation on top, composer in middle, picker on bottom
- [x] The game opens in the Modal when the emoji game table object is clicked

## Technical Approach

### Key Files
- `components/EmojiGame.tsx` — Game wrapper, state management, useChat integration
- `components/EmojiGame.module.css` — Overall game layout

### State Management
```typescript
const { messages, sendMessage } = useChat({
  transport: new DefaultChatTransport({ api: '/api/chat' }),
});
const [selectedEmoji, setSelectedEmoji] = useState<string[]>([]);

// On mount, send initial prompt to get Claude's opening emoji
useEffect(() => {
  sendMessage({ parts: [{ type: 'text', text: 'Start a new emoji conversation. Send your opening emoji.' }] });
}, []);

// Send composed emoji
function handleSend() {
  sendMessage({ parts: [{ type: 'text', text: selectedEmoji.join('') }] });
  setSelectedEmoji([]);
}

// Request explanation
function handleExplain() {
  sendMessage({ parts: [{ type: 'text', text: 'What just happened? Please explain our conversation.' }] });
}
```

### Layout (Mobile-First)
```
┌──────────────────┐
│  Conversation     │  (scrollable, takes remaining space)
│  (emoji exchange) │
├──────────────────┤
│  Composer (tray)  │  (fixed height)
├──────────────────┤
│  [?] [New]        │  (action buttons)
├──────────────────┤
│  Picker (grid)    │  (scrollable, ~40% of viewport)
└──────────────────┘
```

### Design Notes
- The game should fill the modal completely
- The "what just happened?" button should be styled as a small, curious element — maybe a `?` card or a "translate" icon
- The "new conversation" button should be subtle and secondary
- When Claude is "thinking," show a gentle pulse (not a spinner)
- The explanation text (when Claude breaks character) should appear in the serif font, formatted as prose

## Acceptance Criteria

- [x] Game opens in modal when emoji game card is clicked on table
- [x] Claude sends opening emoji automatically
- [x] User can select emoji, compose, and send
- [x] Claude responds with emoji in real-time (streaming)
- [x] "What just happened?" triggers a natural language explanation
- [x] "New conversation" clears and restarts
- [x] Full flow works end-to-end on both mobile and desktop
