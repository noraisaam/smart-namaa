import { useEffect, useState } from 'react';
import { Menu, X, Leaf } from 'lucide-react';

const LINKS = [
  { href: '#field', label: 'Field Map' },
  { href: '#dashboard', label: 'Dashboard' },
  { href: '#advisories', label: 'AI Alerts' },
  { href: '#savings', label: 'Sustainability' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass shadow-md py-3' : 'py-5 bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5 group">
          <span className="relative grid place-items-center w-10 h-10 rounded-2xl bg-forest-600 text-cream-100 shadow-lg shadow-forest-700/30 group-hover:scale-105 transition-transform">
            <Leaf className="w-5 h-5" strokeWidth={2.2} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-xl font-semibold text-forest-700">NAMAA</span>
            <span className="text-[10px] tracking-[0.25em] text-moss-500 font-semibold uppercase">نماء</span>
          </span>
        </a>

        <div className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-4 py-2 rounded-full text-sm font-medium text-forest-700/80 hover:text-forest-700 hover:bg-white/50 transition-all"
            >
              {l.label}
            </a>
          ))}
          <a href="#chat" className="btn-primary !py-2.5 !px-5 ml-2 text-sm">
            Ask NAMAA AI
          </a>
        </div>

        <button
          className="md:hidden grid place-items-center w-10 h-10 rounded-xl glass"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden mt-3 mx-5 glass rounded-3xl p-4 flex flex-col gap-1 animate-fade-up">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-2xl text-sm font-medium text-forest-700 hover:bg-white/50"
            >
              {l.label}
            </a>
          ))}
          <a href="#chat" onClick={() => setOpen(false)} className="btn-primary mt-2 text-sm">
            Ask NAMAA AI
          </a>
        </div>
      )}
    </header>
  );
}
