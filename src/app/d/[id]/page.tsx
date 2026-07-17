import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDeclaration } from '@/lib/db/declarations';
import DeclarationCertificate from '@/components/DeclarationCertificate';
import { ArrowLeft, MapPin } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DeclarationPage({ params }: Props) {
  const { id } = await params;
  const d = await getDeclaration(id);
  if (!d) return notFound();

  const roomUrl = `/room/${d.coord.roomId}/${d.coord.wall}/${d.coord.shelf}/${d.coord.book}/${d.coord.page}`;

  return (
    <div className="w-full h-full overflow-y-auto bg-babel-dark text-babel-parchment">
      <div className="max-w-xl mx-auto p-6 md:p-10 flex flex-col items-center text-center babel-rise-in">
        <Link href="/" className="self-start flex items-center gap-2 hover:text-babel-gold transition-colors text-sm mb-8 font-mono">
          <ArrowLeft size={16} /> Enter the Library
        </Link>

        <p className="text-babel-gold-dim text-[10px] tracking-[0.3em] uppercase mb-2 font-mono">
          Someone left this for you
        </p>
        <h1 className="text-2xl md:text-3xl text-babel-gold font-mono tracking-widest uppercase mb-8 babel-breathe">
          A Declaration
        </h1>

        <DeclarationCertificate d={d} />

        <Link
          href={roomUrl}
          className="mt-8 flex items-center justify-center gap-2 text-sm uppercase tracking-widest font-mono text-babel-gold border border-babel-gold/50 hover:bg-babel-gold/10 px-6 py-3 rounded transition-colors"
        >
          <MapPin size={15} /> See it written in the Library
        </Link>

        <p className="text-babel-dust/50 text-xs italic mt-6 max-w-sm font-serif leading-relaxed">
          These words rest at one exact address among the infinite. Follow the link above to read
          the very page they live on.
        </p>
      </div>
    </div>
  );
}
