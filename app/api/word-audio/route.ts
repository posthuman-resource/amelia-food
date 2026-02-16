import { openai as aiSdkOpenai } from "@ai-sdk/openai";
import { generateText } from "ai";
import OpenAI from "openai";
import {
  wordSentencePrompt,
  wordPronouncePrompt,
  wordSpeakPrompt,
} from "@/lib/prompts";

export const maxDuration = 30;

const openai = new OpenAI();

interface WordAudioBody {
  word: string;
  definition?: string;
  literal?: string;
  pronounceOnly?: boolean;
}

export async function POST(req: Request) {
  const { word, definition, literal, pronounceOnly }: WordAudioBody =
    await req.json();

  // Pronounce just the word
  if (pronounceOnly) {
    const response = await openai.chat.completions.create({
      model: "gpt-audio",
      modalities: ["text", "audio"],
      audio: { voice: "marin", format: "mp3" },
      messages: [
        { role: "system", content: wordPronouncePrompt(word) },
        { role: "user", content: word },
      ],
    });

    return Response.json({
      audio: response.choices[0].message.audio?.data ?? "",
    });
  }

  if (!definition || !literal) {
    return Response.json(
      { error: "definition and literal are required" },
      { status: 400 },
    );
  }

  // Generate a sentence that uses the word naturally
  const { text: sentence } = await generateText({
    model: aiSdkOpenai("gpt-4o-mini"),
    prompt: wordSentencePrompt(word, definition, literal),
  });

  // Generate speech via gpt-audio — native multimodal audio, not TTS pipeline
  const response = await openai.chat.completions.create({
    model: "gpt-audio",
    modalities: ["text", "audio"],
    audio: { voice: "marin", format: "mp3" },
    messages: [
      { role: "system", content: wordSpeakPrompt(word) },
      { role: "user", content: `Read this sentence aloud: ${sentence}` },
    ],
  });

  const audio = response.choices[0].message.audio;

  return Response.json({
    sentence,
    audio: audio?.data ?? "",
  });
}
