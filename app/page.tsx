import Table from "@/components/Table";
import { getAllWords } from "@/lib/words";
import { getAllPoems } from "@/lib/poems";
import { getAllPages } from "@/lib/pages";
import { getAllVennEntries } from "@/lib/venn";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const authed = await isAuthenticated();

  if (!authed) return <Table />;

  const words = getAllWords();
  const poems = getAllPoems();
  const pages = getAllPages();
  const vennEntries = getAllVennEntries();
  return (
    <Table
      words={words}
      poems={poems}
      pages={pages}
      vennEntries={vennEntries}
    />
  );
}
