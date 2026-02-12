import Table from '@/components/Table';
import { getAllWords } from '@/lib/words';

export default function Home() {
  const words = getAllWords();
  return <Table words={words} />;
}
