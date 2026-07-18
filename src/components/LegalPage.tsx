import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Shared shell for the legal / policy pages, styled to match the site.
export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-full overflow-y-auto bg-babel-dark text-babel-parchment">
      <div className="max-w-2xl mx-auto p-6 md:p-12 babel-rise-in">
        <Link href="/" className="flex items-center gap-2 hover:text-babel-gold transition-colors text-sm font-mono mb-8">
          <ArrowLeft size={16} /> Exit to Void
        </Link>

        <p className="text-babel-gold-dim text-[10px] tracking-[0.3em] uppercase mb-2 font-mono">
          The Infinite Library of Babel
        </p>
        <h1 className="text-2xl md:text-4xl text-babel-gold font-mono tracking-widest uppercase mb-2">
          {title}
        </h1>
        <p className="text-babel-dust/60 text-xs mb-10">Last updated: {updated}</p>

        <div className="legal-body flex flex-col gap-6 text-babel-parchment/85 text-sm md:text-base leading-relaxed">
          {children}
        </div>

        <div className="mt-14 pt-6 border-t border-babel-lines/20 flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono uppercase tracking-widest text-babel-dust">
          <Link href="/terms" className="hover:text-babel-gold transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-babel-gold transition-colors">Privacy</Link>
          <Link href="/refunds" className="hover:text-babel-gold transition-colors">Refunds</Link>
          <a href="mailto:contact@thelibrary.page" className="hover:text-babel-gold transition-colors">
            Contact
          </a>
        </div>
      </div>
    </div>
  );
}

// Small helpers for consistent section styling.
export function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-babel-gold font-mono text-sm tracking-widest uppercase">{heading}</h2>
      <div className="flex flex-col gap-2 text-babel-parchment/80">{children}</div>
    </section>
  );
}
