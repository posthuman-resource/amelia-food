import Table from "@/components/Table";
import { getAllWords } from "@/lib/words";
import { getAllPoems } from "@/lib/poems";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const authed = await isAuthenticated();

  if (!authed) return <Table />;

  const words = getAllWords();
  const poems = getAllPoems();
  return <Table words={words} poems={poems} />;
}
