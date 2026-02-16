export interface WordPart {
  german: string;
  english: string;
}

export interface WordDefinition {
  id: string;
  word: string;
  partOfSpeech: string;
  pronunciation: string;
  description: string;
  parts: WordPart[];
  literal: string;
}

export const words: WordDefinition[] = [
  {
    id: "bildschirmumarmungsversuch",
    word: "Bildschirmumarmungsversuch",
    partOfSpeech: "n.",
    pronunciation: "/ˈbɪlt.ʃɪʁm.ʊm.ˈʔaʁ.mʊŋs.fɛɐ̯.ˈzuːx/",
    description:
      "The futile but earnest attempt to transmit a hug through a screen to someone on the other side of the internet — the physical act of wanting to reach through the glass and hold someone you can only see in pixels and feel in words.",
    parts: [
      { german: "Bildschirm", english: "screen" },
      { german: "Umarmung", english: "embrace, hug" },
      { german: "Versuch", english: "attempt, try" },
    ],
    literal: "the screen-embrace-attempt",
  },
  {
    id: "schonimmerteilbegegnung",
    word: "Schonimmerteilbegegnung",
    partOfSpeech: "n.",
    pronunciation: "/ʃoːn.ˈɪ.mɐ.taɪl.bə.ˈɡeːɡ.nʊŋ/",
    description:
      "The encounter with someone who was always already part of you — a meeting that feels not like a beginning, but like a recognition. The quiet, startling moment when you realize the person in front of you has been carrying a piece of you long before you ever crossed paths.",
    parts: [
      { german: "schon", english: "already" },
      { german: "immer", english: "always" },
      { german: "Teil", english: "part, piece" },
      { german: "Begegnung", english: "encounter, meeting" },
    ],
    literal: "the already-always-part-encounter",
  },
];
