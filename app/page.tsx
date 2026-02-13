import Table from "@/components/Table";
import { getAllWords } from "@/lib/words";
import { getAllPoems } from "@/lib/poems";

export const dynamic = "force-dynamic";

export default function Home() {
  const words = getAllWords();
  const poems = getAllPoems();
  return <Table words={words} poems={poems} />;
}
