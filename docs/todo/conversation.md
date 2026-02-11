# Build the Conversation Display Component

## Objective

The scrolling emoji exchange between Amelia and Claude. Messages appear with gentle animations, laid out conversationally but not in a rigid chat-app style. More organic, like emoji tiles being placed on a surface.

## Requirements

- [x] Displays message history: user messages and assistant messages
- [x] User messages aligned to one side, assistant to the other
- [x] Layout is conversational but organic — not a strict chat bubble grid
- [x] New messages appear with a gentle fade/pop animation (like placing a tile)
- [x] Auto-scrolls to latest message
- [x] Emoji are displayed at a comfortable reading size (larger than standard text)
- [x] Streaming: assistant messages build up as tokens arrive
- [x] Visual distinction between user and assistant messages (subtle, not heavy)

## Technical Approach

### Key Files
- `components/Conversation.tsx` — Message list rendering
- `components/Conversation.module.css` — Message layout, animations

### Message Styling
- No hard chat bubbles — instead, messages sit on slightly different paper tones
- User messages: slightly warmer background, aligned right
- Assistant messages: slightly cooler (still warm), aligned left
- Emoji rendered at ~1.5-2rem for comfortable reading
- Gentle entry animation: fade in + slight translateY

### Props
```typescript
interface ConversationProps {
  messages: UIMessage[];
}
```

### Design Notes
- The conversation area should feel like looking at a table with emoji tiles arranged in a back-and-forth pattern
- No timestamps, no read receipts, no typing indicators — keep it simple
- If streaming, show the emoji appearing one by one (the AI SDK handles this naturally)
- Leave breathing room between messages

## Acceptance Criteria

- [x] Messages display correctly with user/assistant distinction
- [x] New messages animate in gently
- [x] Auto-scroll to latest message works
- [x] Emoji are large and readable
- [x] Streaming messages update in real-time
