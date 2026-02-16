import { useEffect } from "react";

export function useEscapeKey(
  callback: () => void,
  active: boolean = true,
): void {
  useEffect(() => {
    if (!active) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") callback();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [callback, active]);
}
