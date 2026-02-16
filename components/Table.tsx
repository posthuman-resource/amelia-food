"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./Table.module.css";
import TableObject from "./TableObject";
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
import { CardStackFace, CardStackOverlay } from "./CardStack";
import WordCreator from "./WordCreator";
import VennDiagram from "./VennDiagram";
import type { VennEntry } from "@/lib/venn";
import AuthLock from "./AuthLock";
import Neko from "./Neko";
import { useTabTitle } from "../hooks/useTabTitle";
import { useMounted } from "../hooks/useMounted";

interface TableObjectData {
  id: string;
  x: number; // percentage from left (desktop)
  y: number; // percentage from top (desktop)
  rotation: number; // degrees
  label: string;
}

function buildObjects(poems: Poem[], pages: Page[]): TableObjectData[] {
  const poemObjects = poems.map((p) => ({
    id: `poem-${p.id}`,
    x: p.table.x,
    y: p.table.y,
    rotation: p.table.rotation,
    label: p.title,
  }));
  const pageObjects = pages.map((p) => ({
    id: `page-${p.id}`,
    x: p.table.x,
    y: p.table.y,
    rotation: p.table.rotation,
    label: p.title,
  }));
  return [
    { id: "emoji-game", x: 35, y: 30, rotation: -2, label: "Emoji Game" },
    { id: "welcome", x: 60, y: 55, rotation: 3, label: "Welcome" },
    ...poemObjects,
    ...pageObjects,
    { id: "valentine", x: 72, y: 30, rotation: 2, label: "Valentine" },
    { id: "word-stack", x: 30, y: 55, rotation: -2, label: "Word Cards" },
    { id: "venn-diagram", x: 62, y: 80, rotation: -1, label: "Improbable" },
    { id: "lock", x: 88, y: 85, rotation: 1, label: "Lock" },
  ];
}

interface ObjectContentProps {
  id: string;
  words: WordDefinition[];
  poems: Poem[];
  pages: Page[];
}

interface ModalContentProps extends ObjectContentProps {
  vennEntries: VennEntry[];
}

function ObjectContent({ id, words, poems, pages }: ObjectContentProps) {
  if (id === "emoji-game") {
    return (
      <div className={styles.emojiCard}>
        <div className={styles.emojiTiles}>
          <span>💬</span>
        </div>
        <p className={styles.cardLabel}>emoji game</p>
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
  if (id === "valentine") {
    return <ValentineCard />;
  }
  if (id === "lock") {
    return (
      <div className={styles.lockCard}>
        <span className={styles.lockIcon}>🔒</span>
        <p className={styles.cardLabel}>lock</p>
      </div>
    );
  }
  if (id === "venn-diagram") {
    return (
      <div className={styles.vennCard}>
        <span className={styles.vennIcon}>🧩</span>
        <p className={styles.cardLabel}>improbable</p>
      </div>
    );
  }
  if (id === "word-stack") {
    return <CardStackFace count={words.length} icon="Aa" label="wortschatz" />;
  }
  return null;
}

function ModalContent({
  id,
  words,
  poems,
  pages,
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
  return null;
}

interface TableProps {
  words?: WordDefinition[];
  poems?: Poem[];
  pages?: Page[];
  vennEntries?: VennEntry[];
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
}: TableProps) {
  const [activeObject, setActiveObject] = useState<string | null>(null);
  const [stackFanned, setStackFanned] = useState(false);
  const mounted = useMounted();
  const router = useRouter();

  const objectsContainerRef = useRef<HTMLDivElement>(null);
  const unlocked = !!(words && poems);
  const [newWords, setNewWords] = useState<WordDefinition[]>([]);
  const allVennEntries = initialVennEntries ?? [];
  const allWords = [...(words ?? []), ...newWords];

  const [creatingWord, setCreatingWord] = useState(false);
  const objects = buildObjects(poems ?? [], pages ?? []);
  const activeData = objects.find((o) => o.id === activeObject);

  const tabTitle = useTabTitle(unlocked);

  return (
    <div className={`${styles.table} texture-wood texture-noise`}>
      <title>{tabTitle}</title>
      {/* Subtle "Amy" inscription — always visible */}
      <div className={styles.inscription}>Amy</div>

      {mounted && !unlocked && <AuthLock />}

      {unlocked && (
        <>
          {/* Table objects */}
          <div ref={objectsContainerRef} className={styles.objectsContainer}>
            <Neko tableRef={objectsContainerRef} />
            {objects.map((obj, index) => (
              <TableObject
                key={obj.id}
                id={obj.id}
                x={obj.x}
                y={obj.y}
                rotation={obj.rotation}
                index={index}
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
                : activeObject?.startsWith("poem-")
                  ? modalStyles.wide
                  : activeObject?.startsWith("page-")
                    ? modalStyles.fullscreen
                    : undefined
            }
          >
            {activeObject && (
              <ModalContent
                id={activeObject}
                words={allWords}
                poems={poems ?? []}
                pages={pages ?? []}
                vennEntries={allVennEntries}
              />
            )}
          </Modal>
        </>
      )}
    </div>
  );
}
