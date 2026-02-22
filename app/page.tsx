import Table from "@/components/Table";
import { getAllWords } from "@/lib/words";
import { getAllPoems, getAllPoemPairs } from "@/lib/poems";
import { getAllPages } from "@/lib/pages";
import { getAllVennEntries } from "@/lib/venn";
import { getAllSignals } from "@/lib/signals";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const authed = await isAuthenticated();

  if (!authed) return <Table />;

  const words = getAllWords();
  const poems = getAllPoems();
  const poemPairs = getAllPoemPairs();
  const pages = getAllPages();
  const vennEntries = getAllVennEntries();
  const signals = getAllSignals();
  return (
    <Table
      words={words}
      poems={poems}
      poemPairs={poemPairs}
      pages={pages}
      vennEntries={vennEntries}
      signals={signals}
    />
  );
}
