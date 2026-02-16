import type { UIMessage } from "@ai-sdk/react";

interface TextPart {
  type: "text";
  text: string;
}

function isTextPart(p: { type: string }): p is TextPart {
  return p.type === "text";
}

export function getMessageText(m: UIMessage): string {
  return (
    m.parts
      ?.filter(isTextPart)
      .map((p) => p.text)
      .join("") ?? ""
  );
}
