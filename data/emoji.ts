import rawData from "emojibase-data/en/data.json";
import cldrShortcodes from "emojibase-data/en/shortcodes/cldr.json";
import messages from "emojibase-data/en/messages.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmojiEntry {
  emoji: string;
  name: string;
  keywords: string[];
  group: string;
}

// ---------------------------------------------------------------------------
// Custom associations — enrich search beyond official CLDR tags
// ---------------------------------------------------------------------------

const CUSTOM_ASSOCIATIONS: Record<string, string[]> = {
  // Emotional concepts
  love: [
    "❤️", "💕", "💗", "💓", "💖", "💘", "💝", "💞", "🥰", "😍",
    "😘", "💑", "💏", "🫶", "💐", "🌹", "🫂",
  ],
  sad: [
    "😢", "😭", "😞", "😔", "💔", "🥀", "🌧️", "😿", "🥺", "😩",
    "😥", "🫠",
  ],
  happy: [
    "😊", "😄", "😁", "🥳", "🎉", "🌈", "☀️", "💛", "😺", "✨",
    "🤗", "🫶",
  ],
  excited: [
    "🤩", "🥳", "🎉", "🎊", "✨", "⚡", "🔥", "💥", "🙌", "🫨",
  ],
  confused: [
    "😕", "🤔", "😵‍💫", "❓", "🫤", "🤷", "😶‍🌫️",
  ],
  cozy: [
    "☕", "🫖", "🧣", "🧶", "🕯️", "🔥", "🛋️", "🫕", "🧸", "🫧",
    "🥧", "🍵",
  ],
  angry: [
    "😠", "😡", "🤬", "💢", "👿", "😤",
  ],
  scared: [
    "😨", "😱", "😰", "🫣", "👻", "💀",
  ],
  tired: [
    "😴", "🥱", "😪", "💤", "🛌",
  ],
  peaceful: [
    "😌", "🧘", "🕊️", "🌿", "🍃", "🌸", "☁️", "🫧",
  ],

  // Amelia-specific interests
  ballet: [
    "🩰", "💃", "🤸", "🎭", "🎶", "🦢",
  ],
  knitting: [
    "🧶", "🧵", "🪡", "🧣", "🧤", "🧦",
  ],
  coffee: [
    "☕", "🫖", "🍵", "🤎",
  ],
  chocolate: [
    "🍫", "🍩", "🍪", "🎂", "🍰", "🤎",
  ],
  cat: [
    "🐱", "🐈", "🐈‍⬛", "😺", "😸", "😹", "😻", "😼", "😽", "🙀",
    "😿", "😾", "🐾", "🧶", "🪶",
  ],
  book: [
    "📖", "📚", "📕", "📗", "📘", "📙", "📓", "📔", "🔖", "📑",
    "📝", "✏️",
  ],
  yarn: [
    "🧶", "🧵", "🪡", "🐑",
  ],
  cooking: [
    "🍳", "👩‍🍳", "🥘", "🫕", "🍲", "🔪", "🧑‍🍳",
  ],
  music: [
    "🎵", "🎶", "🎤", "🎸", "🎹", "🎼", "🎧", "🎻", "🪗", "🥁",
  ],

  // Poetic / abstract associations
  reflection: [
    "🪞", "🌊", "💭", "🫧", "💫",
  ],
  time: [
    "⏳", "🕰️", "⏰", "⌛", "🕐", "🕑", "🕒",
  ],
  dream: [
    "💭", "🌙", "✨", "💫", "🌌", "🔮", "🦋", "☁️",
  ],
  magic: [
    "✨", "🪄", "🔮", "⭐", "💫", "🌟", "🧙",
  ],
  nature: [
    "🌿", "🍃", "🌻", "🌺", "🌸", "🌷", "🌱", "🌳", "🍂", "🍁",
    "🌾", "🌵",
  ],
  ocean: [
    "🌊", "🐚", "🐠", "🐟", "🐬", "🐋", "🦈", "🪸", "🏖️", "⛵",
  ],
  stars: [
    "⭐", "🌟", "✨", "💫", "🌠", "🌌", "🔭",
  ],
  rain: [
    "🌧️", "☔", "🌦️", "💧", "🌈",
  ],
  winter: [
    "❄️", "⛄", "🌨️", "🧣", "🧤", "☃️", "🏔️",
  ],
  spring: [
    "🌸", "🌷", "🌱", "🐣", "🦋", "🌼", "🪻",
  ],
  summer: [
    "☀️", "🏖️", "🌻", "🍉", "🌴", "🏄", "🍧",
  ],
  autumn: [
    "🍂", "🍁", "🎃", "🌰", "🍎",
  ],
  home: [
    "🏠", "🏡", "🛋️", "🪴", "🕯️", "🧸",
  ],
  celebration: [
    "🎉", "🎊", "🥳", "🎂", "🎁", "🎈", "🪅", "🥂", "🍾",
  ],
  valentine: [
    "❤️", "💕", "💌", "💘", "🌹", "🍫", "💝", "💐", "💑",
  ],
  night: [
    "🌙", "🌚", "🌝", "⭐", "🌌", "🦉", "🌃", "🌆",
  ],
  morning: [
    "🌅", "☀️", "🌤️", "☕", "🐓", "🌻",
  ],
  garden: [
    "🌻", "🌷", "🌺", "🪴", "🌱", "🦋", "🐝", "🐛",
  ],
  warmth: [
    "🔥", "☕", "🫖", "🕯️", "🧣", "🤗", "🫶", "🌅",
  ],
  cute: [
    "🥰", "🥺", "🐱", "🐶", "🐰", "🐻", "🧸", "🎀", "💕", "🌸",
  ],
};

// ---------------------------------------------------------------------------
// Group name lookup (group index → human-readable name)
// ---------------------------------------------------------------------------

const GROUP_NAMES: Record<number, string> = {};
for (const g of messages.groups) {
  GROUP_NAMES[g.order] = g.message
    .split(" ")
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Build the reverse lookup for custom associations: emoji char → extra keywords
// ---------------------------------------------------------------------------

const customKeywordsByEmoji: Record<string, Set<string>> = {};
for (const [concept, emojis] of Object.entries(CUSTOM_ASSOCIATIONS)) {
  for (const char of emojis) {
    if (!customKeywordsByEmoji[char]) {
      customKeywordsByEmoji[char] = new Set();
    }
    customKeywordsByEmoji[char].add(concept);
  }
}

// ---------------------------------------------------------------------------
// Process emojibase data into our flat, searchable structure
// ---------------------------------------------------------------------------

function buildDataset(): EmojiEntry[] {
  const entries: EmojiEntry[] = [];

  for (const raw of rawData) {
    // Skip regional indicators (no group) and component emojis (skin tones, hair)
    if (raw.group === undefined || raw.group === 2) continue;

    const keywords = new Set<string>();

    // Add official tags
    if (raw.tags) {
      for (const tag of raw.tags) {
        keywords.add(tag.toLowerCase());
      }
    }

    // Add words from the label
    for (const word of raw.label.toLowerCase().split(/[\s-]+/)) {
      if (word.length > 1) keywords.add(word);
    }

    // Add CLDR shortcodes
    const sc = (cldrShortcodes as Record<string, string | string[]>)[raw.hexcode];
    if (sc) {
      const codes = Array.isArray(sc) ? sc : [sc];
      for (const code of codes) {
        for (const word of code.split(/[_-]+/)) {
          if (word.length > 1) keywords.add(word.toLowerCase());
        }
      }
    }

    // Add custom associations
    const custom = customKeywordsByEmoji[raw.emoji];
    if (custom) {
      for (const kw of custom) {
        keywords.add(kw);
      }
    }

    entries.push({
      emoji: raw.emoji,
      name: raw.label,
      keywords: Array.from(keywords),
      group: GROUP_NAMES[raw.group] || "Other",
    });
  }

  // Sort by emojibase order for consistent display
  return entries;
}

export const emojiData: EmojiEntry[] = buildDataset();

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export function searchEmoji(query: string, limit = 50): EmojiEntry[] {
  if (!query.trim()) return emojiData.slice(0, limit);

  const terms = query.toLowerCase().trim().split(/\s+/);
  const scored: { entry: EmojiEntry; score: number }[] = [];

  for (const entry of emojiData) {
    let totalScore = 0;
    let allTermsMatch = true;

    for (const term of terms) {
      let bestTermScore = 0;

      // Exact name match — highest score
      if (entry.name.toLowerCase() === term) {
        bestTermScore = 10;
      }
      // Name contains term
      else if (entry.name.toLowerCase().includes(term)) {
        bestTermScore = 5;
      }
      // Keyword exact match
      else if (entry.keywords.some((kw) => kw === term)) {
        bestTermScore = 4;
      }
      // Keyword starts with term
      else if (entry.keywords.some((kw) => kw.startsWith(term))) {
        bestTermScore = 3;
      }
      // Keyword contains term
      else if (entry.keywords.some((kw) => kw.includes(term))) {
        bestTermScore = 2;
      }

      if (bestTermScore === 0) {
        allTermsMatch = false;
        break;
      }
      totalScore += bestTermScore;
    }

    if (allTermsMatch && totalScore > 0) {
      scored.push({ entry, score: totalScore });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.entry);
}
