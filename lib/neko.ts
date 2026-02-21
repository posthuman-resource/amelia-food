export type NekoVariant = "classic" | "dog" | "tora" | "maia";

export const NEKO_VARIANTS: NekoVariant[] = ["classic", "dog", "tora", "maia"];

export const DEFAULT_NAMES: Record<NekoVariant, string> = {
  classic: "Neko",
  dog: "Dog",
  tora: "Tora",
  maia: "Maia",
};
