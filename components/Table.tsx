"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./Table.module.css";
import TableObject from "./TableObject";
import type { TableObjectVariant } from "./TableObject";
import Modal from "./Modal";
import modalStyles from "./Modal.module.css";
import EmojiGame from "./EmojiGame";
import { ValentineCard, ValentineCardContent } from "./Valentine";
import { WelcomeEnvelope, WelcomeLetterContent } from "./Welcome";
import { WordCardFace, WordCardContent, CreateWordCardFace } from "./WordCard";
import type { WordDefinition } from "@/data/words";
import type { Poem } from "@/data/poems";
import { PoemCard, PoemContent } from "./Poem";
import type { Page } from "@/data/pages";
import { PageCard, PageContent } from "./Page";
import { images } from "@/data/images";
import { ImageCardFace, ImageCardContent } from "./ImageCard";
import { CardStackFace, CardStackOverlay } from "./CardStack";
import WordCreator from "./WordCreator";
import VennDiagram from "./VennDiagram";
import type { VennEntry } from "@/lib/venn";
import AuthLock from "./AuthLock";
import Neko from "./Neko";
import { SettingsCardFace, SettingsCardContent } from "./SettingsCard";
import { SignalCardFace, SignalContent } from "./Signal";
import type { Signal } from "@/data/signals";
import { useTabTitle } from "../hooks/useTabTitle";
import { useMounted } from "../hooks/useMounted";

interface TableObjectData {
  id: string;
  x: number; // percentage from left (desktop)
  y: number; // percentage from top (desktop)
  rotation: number; // degrees
  label: string;
  variant?: TableObjectVariant;
}

function buildObjects(
  poems: Poem[],
  pages: Page[],
  signals: Signal[],
): TableObjectData[] {
  const poemObjects = poems.map((p) => ({
    id: `poem-${p.id}`,
    x: p.table.x,
    y: p.table.y,
    rotation: p.table.rotation,
    label: p.title,
    variant: "poem" as const,
  }));
  const pageObjects = pages.map((p) => ({
    id: `page-${p.id}`,
    x: p.table.x,
    y: p.table.y,
    rotation: p.table.rotation,
    label: p.title,
    variant: "page" as const,
  }));
  const imageObjects = images.map((img) => ({
    id: `image-${img.id}`,
    x: img.table.x,
    y: img.table.y,
    rotation: img.table.rotation,
    label: img.title,
    variant: "image" as const,
  }));
  const signalObject =
    signals.length > 0
      ? [
          {
            id: "signal",
            x: 50,
            y: 15,
            rotation: -1,
            label: "signal",
            variant: "signal" as const,
          },
        ]
      : [];
  return [
    {
      id: "emoji-game",
      x: 35,
      y: 30,
      rotation: -2,
      label: "emoji game",
      variant: "emoji-game" as const,
    },
    {
      id: "welcome",
      x: 60,
      y: 55,
      rotation: 3,
      label: "welcome",
      variant: "welcome" as const,
    },
    ...poemObjects,
    ...pageObjects,
    ...imageObjects,
    ...signalObject,
    {
      id: "valentine",
      x: 72,
      y: 30,
      rotation: 2,
      label: "valentine",
      variant: "valentine" as const,
    },
    {
      id: "word-stack",
      x: 30,
      y: 55,
      rotation: -2,
      label: "wortschatz",
      variant: "word-stack" as const,
    },
    {
      id: "venn-diagram",
      x: 62,
      y: 80,
      rotation: -1,
      label: "improbable",
      variant: "venn" as const,
    },
    {
      id: "lock",
      x: 88,
      y: 85,
      rotation: 1,
      label: "lock",
      variant: "lock" as const,
    },
    {
      id: "settings",
      x: 12,
      y: 85,
      rotation: 2,
      label: "flavor",
    },
  ];
}

interface ObjectContentProps {
  id: string;
  words: WordDefinition[];
  poems: Poem[];
  pages: Page[];
  signals: Signal[];
}

interface ModalContentProps extends ObjectContentProps {
  vennEntries: VennEntry[];
}

function ObjectContent({
  id,
  words,
  poems,
  pages,
  signals,
}: ObjectContentProps) {
  if (id === "emoji-game") {
    return (
      <div className={styles.emojiCard}>
        <div className={styles.emojiTiles}>
          <span>💬</span>
        </div>
      </div>
    );
  }
  if (id === "welcome") {
    return <WelcomeEnvelope />;
  }
  const poemMatch =
    id.startsWith("poem-") && poems.find((p) => `poem-${p.id}` === id);
  if (poemMatch) {
    return <PoemCard poem={poemMatch} />;
  }
  const pageMatch =
    id.startsWith("page-") && pages.find((p) => `page-${p.id}` === id);
  if (pageMatch) {
    return <PageCard page={pageMatch} />;
  }
  const imageMatch =
    id.startsWith("image-") && images.find((img) => `image-${img.id}` === id);
  if (imageMatch) {
    return <ImageCardFace image={imageMatch} />;
  }
  if (id === "valentine") {
    return <ValentineCard />;
  }
  if (id === "lock") {
    return (
      <div className={styles.lockCard}>
        <span className={styles.lockIcon}>🔒</span>
      </div>
    );
  }
  if (id === "venn-diagram") {
    return (
      <div className={styles.vennCard}>
        <span className={styles.vennIcon}>🧩</span>
      </div>
    );
  }
  if (id === "word-stack") {
    return <CardStackFace count={words.length} icon="Aa" />;
  }
  if (id === "settings") {
    return <SettingsCardFace />;
  }
  if (id === "signal") {
    return <SignalCardFace />;
  }
  return null;
}

function ModalContent({
  id,
  words,
  poems,
  pages,
  signals,
  vennEntries,
}: ModalContentProps) {
  if (id === "emoji-game") {
    return <EmojiGame />;
  }
  if (id === "welcome") {
    return <WelcomeLetterContent />;
  }
  if (id === "valentine") {
    return <ValentineCardContent />;
  }
  if (id === "venn-diagram") {
    return <VennDiagram entries={vennEntries} />;
  }
  if (id === "settings") {
    return <SettingsCardContent />;
  }
  if (id === "signal") {
    return <SignalContent signals={signals} />;
  }
  const wordMatch =
    id.startsWith("word-") && words.find((w) => `word-${w.id}` === id);
  if (wordMatch) {
    return <WordCardContent word={wordMatch} />;
  }
  const modalPoemMatch =
    id.startsWith("poem-") && poems.find((p) => `poem-${p.id}` === id);
  if (modalPoemMatch) {
    return <PoemContent poem={modalPoemMatch} />;
  }
  const modalPageMatch =
    id.startsWith("page-") && pages.find((p) => `page-${p.id}` === id);
  if (modalPageMatch) {
    return <PageContent page={modalPageMatch} />;
  }
  const modalImageMatch =
    id.startsWith("image-") && images.find((img) => `image-${img.id}` === id);
  if (modalImageMatch) {
    return <ImageCardContent image={modalImageMatch} />;
  }
  return null;
}

interface TableProps {
  words?: WordDefinition[];
  poems?: Poem[];
  pages?: Page[];
  vennEntries?: VennEntry[];
  signals?: Signal[];
}

const CREATE_SENTINEL: WordDefinition = {
  id: "__create__",
  word: "",
  partOfSpeech: "",
  pronunciation: "",
  description: "",
  parts: [],
  literal: "",
};

export default function Table({
  words,
  poems,
  pages,
  vennEntries: initialVennEntries,
  signals: initialSignals,
}: TableProps) {
  const [activeObject, setActiveObject] = useState<string | null>(null);
  const [stackFanned, setStackFanned] = useState(false);
  const mounted = useMounted();
  const router = useRouter();

  const tableRef = useRef<HTMLDivElement>(null);
  const objectsContainerRef = useRef<HTMLDivElement>(null);
  const unlocked = !!(words && poems);
  const [newWords, setNewWords] = useState<WordDefinition[]>([]);
  const allVennEntries = initialVennEntries ?? [];
  const allSignals = initialSignals ?? [];
  const allWords = [...(words ?? []), ...newWords];

  const [creatingWord, setCreatingWord] = useState(false);
  const objects = buildObjects(poems ?? [], pages ?? [], allSignals);
  const activeData = objects.find((o) => o.id === activeObject);

  const tabTitle = useTabTitle(unlocked);

  return (
    <div
      ref={tableRef}
      className={`${styles.table} texture-wood texture-noise`}
    >
      <title>{tabTitle}</title>
      {/* Subtle "Amy" inscription — always visible */}
      <div className={styles.inscription}>Amy</div>

      {mounted && !unlocked && <AuthLock />}

      {unlocked && (
        <>
          {/* Table objects */}
          <Neko tableRef={tableRef} />
          <div ref={objectsContainerRef} className={styles.objectsContainer}>
            {objects.map((obj, index) => (
              <TableObject
                key={obj.id}
                id={obj.id}
                x={obj.x}
                y={obj.y}
                rotation={obj.rotation}
                index={index}
                variant={obj.variant}
                label={obj.label}
                onClick={() => {
                  if (obj.id === "lock") {
                    fetch("/api/auth", { method: "DELETE" }).then(() =>
                      router.refresh(),
                    );
                  } else if (obj.id === "word-stack") {
                    setStackFanned(true);
                  } else {
                    setActiveObject(obj.id);
                  }
                }}
              >
                <ObjectContent
                  id={obj.id}
                  words={allWords}
                  poems={poems ?? []}
                  pages={pages ?? []}
                  signals={allSignals}
                />
              </TableObject>
            ))}
          </div>

          {/* Card stack fan overlay */}
          {stackFanned && (
            <CardStackOverlay
              items={[CREATE_SENTINEL, ...allWords]}
              renderCard={(word) =>
                word.id === "__create__" ? (
                  <CreateWordCardFace />
                ) : (
                  <WordCardFace word={word} />
                )
              }
              onCardClick={(id) => {
                if (id === "__create__") {
                  setStackFanned(false);
                  setCreatingWord(true);
                } else {
                  setActiveObject(`word-${id}`);
                }
              }}
              onClose={() => setStackFanned(false)}
              ariaLabel="Word cards"
            />
          )}

          {/* Word creator overlay */}
          {creatingWord && (
            <WordCreator
              onComplete={(word) => {
                setNewWords((prev) => [...prev, word]);
                setCreatingWord(false);
                setActiveObject(`word-${word.id}`);
              }}
              onClose={() => setCreatingWord(false)}
            />
          )}

          {/* Modal overlay */}
          <Modal
            open={activeObject !== null}
            onClose={() => setActiveObject(null)}
            ariaLabel={activeData?.label}
            className={
              activeObject === "venn-diagram"
                ? modalStyles.vennWide
                : activeObject === "signal"
                  ? modalStyles.signalWide
                  : activeObject?.startsWith("poem-")
                    ? modalStyles.wide
                    : activeObject?.startsWith("page-")
                      ? modalStyles.fullscreen
                      : activeObject?.startsWith("image-")
                        ? modalStyles.imageFlush
                        : undefined
            }
          >
            {activeObject && (
              <ModalContent
                id={activeObject}
                words={allWords}
                poems={poems ?? []}
                pages={pages ?? []}
                signals={allSignals}
                vennEntries={allVennEntries}
              />
            )}
          </Modal>
        </>
      )}
    </div>
  );
}
