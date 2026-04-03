import Link from "next/link";
import { LogoWide } from "@/components/logo";

const features = [
  { label: "Slowed + Reverb", desc: "Drag the speed down, layer in the reverb. The classic effect, perfected.", bars: [6, 14, 10] },
  { label: "Bass Boost", desc: "Punch up the low end with a precision EQ shelf. Full, heavy, and controlled.", bars: [14, 8, 12] },
  { label: "Pitch Shift", desc: "Transpose your track up or down in semitones without touching the tempo.", bars: [10, 14, 6] },
  { label: "Echo & Delay", desc: "Add space and dimension. Dial in time and feedback for that signature tail.", bars: [8, 10, 14] },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-x-hidden">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg">Skip to main content</a>

      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <LogoWide />
        <Link href="/studio" className="bg-accent hover:bg-accent-hover text-white font-bold px-5 py-2 rounded-full text-sm transition-all active:scale-95 shadow-[0_0_20px_rgba(255,45,85,0.3)] cursor-pointer">Open Studio</Link>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col">
        <section className="relative flex flex-col items-center justify-center text-center pt-40 pb-24 px-6 overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/10 rounded-full blur-[120px]" />
          </div>

          <div className="relative mb-8">
            <svg width="80" height="80" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="drop-shadow-[0_0_30px_rgba(255,45,85,0.5)]">
              <rect width="32" height="32" rx="8" fill="#000000" />
              <rect x="5" y="14" width="5" height="14" rx="2.5" fill="#FF2D55" />
              <rect x="14" y="6" width="5" height="22" rx="2.5" fill="#FF2D55" />
              <rect x="23" y="10" width="5" height="18" rx="2.5" fill="#FF2D55" />
            </svg>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-4">
            PEAK <span className="text-accent">STUDIO</span>
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-lg leading-relaxed mb-10">
            Slowed &amp; reverb, bass boost, pitch shift, echo — all in your browser.{" "}
            <span className="text-white/90">No uploads. No installs. Just music.</span>
          </p>

          <Link
            href="/studio"
            className="group inline-flex items-center gap-3 bg-accent hover:bg-accent-hover text-white font-black text-lg px-10 py-4 rounded-full transition-all active:scale-95 shadow-[0_0_40px_rgba(255,45,85,0.35)] hover:shadow-[0_0_60px_rgba(255,45,85,0.5)] cursor-pointer"
          >
            Open Studio
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="transition-transform group-hover:translate-x-1">
              <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>

          <p className="mt-5 text-white/30 text-xs tracking-widest uppercase">Files stay in your browser. Never uploaded.</p>

          <div aria-hidden="true" className="flex items-end justify-center gap-1.5 mt-16 h-16 opacity-20">
            {[6,12,20,14,24,18,10,22,16,8,14,20,12,18,10].map((h, i) => (
              <div
                key={i}
                className="w-1.5 bg-accent rounded-full animate-eq"
                style={{ height: h, animationDuration: `${0.8 + i * 0.07}s`, animationDelay: `${i * 0.05}s` }}
              />
            ))}
          </div>
        </section>

        <section className="px-6 md:px-12 pb-24 max-w-5xl mx-auto w-full" aria-labelledby="features-heading">
          <h2 id="features-heading" className="text-xs font-bold tracking-[0.2em] uppercase text-white/30 text-center mb-10">What is inside</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.label} className="rounded-2xl border border-white/8 bg-white/3 p-6 flex gap-5 items-start hover:border-accent/30 hover:bg-white/5 transition-all">
                <div aria-hidden="true" className="flex items-end gap-[3px] h-8 shrink-0 pt-1">
                  {f.bars.map((h, i) => (
                    <div key={i} className="w-[5px] rounded-sm" style={{ height: h, background: "#FF2D55" }} />
                  ))}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base mb-1">{f.label}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/5 px-6 py-16 text-center" aria-labelledby="cta-heading">
          <h2 id="cta-heading" className="text-3xl md:text-4xl font-black tracking-tight mb-4">Ready to make it hit different?</h2>
          <p className="text-white/50 mb-8">Drop your track in. Results are instant.</p>
          <Link href="/studio" className="inline-flex items-center gap-2 bg-white text-black font-black px-10 py-4 rounded-full text-lg transition-all hover:scale-105 active:scale-95 cursor-pointer">
            Launch Studio
          </Link>
        </section>
      </main>

      <footer className="border-t border-white/5 px-6 md:px-12 py-6 flex items-center justify-between text-white/30 text-xs">
        <LogoWide className="opacity-50" />
        <span>Browser-based · No server · Your audio stays yours</span>
      </footer>
    </div>
  );
}
