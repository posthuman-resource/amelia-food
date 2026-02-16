"use client";

import { useState } from "react";
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
import { CardStackFace, CardStackOverlay } from "./CardStack";
import WordCreator from "./WordCreator";
import AuthLock from "./AuthLock";
import TableCats from "./TableCats";
import { useTabTitle } from "../hooks/useTabTitle";
import { useMounted } from "../hooks/useMounted";

interface TableObjectData {
  id: string;
  x: number; // percentage from left (desktop)
  y: number; // percentage from top (desktop)
  rotation: number; // degrees
  label: string;
}

function buildObjects(poems: Poem[]): TableObjectData[] {
  const poemObjects = poems.map((p) => ({
    id: `poem-${p.id}`,
    x: p.table.x,
    y: p.table.y,
    rotation: p.table.rotation,
    label: p.title,
  }));
  return [
    { id: "emoji-game", x: 35, y: 30, rotation: -2, label: "Emoji Game" },
    { id: "welcome", x: 60, y: 55, rotation: 3, label: "Welcome" },
    ...poemObjects,
    { id: "valentine", x: 72, y: 30, rotation: 2, label: "Valentine" },
    { id: "word-stack", x: 30, y: 55, rotation: -2, label: "Word Cards" },
    { id: "lock", x: 88, y: 85, rotation: 1, label: "Lock" },
  ];
}

function ObjectContent({
  id,
  words,
  poems,
}: {
  id: string;
  words: WordDefinition[];
  poems: Poem[];
}) {
  if (id === "emoji-game") {
    return (
      <div className={styles.emojiCard}>
        <div className={styles.emojiTiles}>
          <span>🎲</span>
          <span>💬</span>
          <span>✨</span>
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
  if (id === "word-stack") {
    return <CardStackFace count={words.length} icon="Aa" label="wortschatz" />;
  }
  return null;
}

function ModalContent({
  id,
  words,
  poems,
}: {
  id: string;
  words: WordDefinition[];
  poems: Poem[];
}) {
  if (id === "emoji-game") {
    return <EmojiGame />;
  }
  if (id === "welcome") {
    return <WelcomeLetterContent />;
  }
  if (id === "valentine") {
    return <ValentineCardContent />;
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
  return null;
}

interface TableProps {
  words?: WordDefinition[];
  poems?: Poem[];
}

const CREATE_SENTINEL = { id: "__create__" } as WordDefinition;

export default function Table({ words, poems }: TableProps) {
  const [activeObject, setActiveObject] = useState<string | null>(null);
  const [stackFanned, setStackFanned] = useState(false);
  const mounted = useMounted();
  const router = useRouter();

  const unlocked = !!(words && poems);
  const [newWords, setNewWords] = useState<WordDefinition[]>([]);
  const allWords = [...(words ?? []), ...newWords];

  const [creatingWord, setCreatingWord] = useState(false);
  const objects = buildObjects(poems ?? []);
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
          <div className={styles.objectsContainer}>
            <TableCats
              objectPositions={objects.map((o) => ({
                id: o.id,
                x: o.x,
                y: o.y,
              }))}
            />
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
              activeObject?.startsWith("poem-") ? modalStyles.wide : undefined
            }
          >
            {activeObject && (
              <ModalContent
                id={activeObject}
                words={allWords}
                poems={poems ?? []}
              />
            )}
          </Modal>
        </>
      )}
    </div>
  );
}
