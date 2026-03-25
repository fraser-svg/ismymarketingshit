import { SubmitForm } from "@/components/SubmitForm";

export default function Home() {
  return (
    <div className="bg-white text-black font-sans antialiased min-h-screen">
      {/* Global Nav */}
      <nav className="w-full bg-white border-b-4 border-black py-4 z-50">
        <div className="w-full max-w-5xl mx-auto px-4 flex items-center justify-start">
          <a
            href="/"
            className="font-black text-xl md:text-2xl uppercase tracking-tighter hover:text-red-600 transition-colors -ml-2 md:-ml-6"
          >
            💩 ismypositioningshit.com
          </a>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-12 md:py-20 space-y-16">
        {/* Hook */}
        <header className="text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-black uppercase leading-[0.9] tracking-tighter">
            If people don&apos;t{" "}
            <span className="bg-red-500 text-white px-2">understand</span> what
            you do, they won&apos;t buy it.
          </h1>

          {/* Telemetry Dashboard */}
          <div className="relative w-full max-w-5xl mx-auto bg-neutral-100 brutal-border text-left overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.05)]">
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(0,0,0,1) 1px, transparent 1px)",
                backgroundSize: "100% 4px",
              }}
            />
            <div className="flex justify-between items-center border-b-4 border-black bg-white px-4 md:px-6 py-3 relative z-10">
              <span className="font-mono text-sm md:text-base font-bold uppercase tracking-widest text-black">
                &gt; SYSTEM_STATUS
              </span>
              <div className="flex items-center gap-2">
                <span className="animate-pulse w-3 h-3 bg-green-500 rounded-full border border-black shadow-[0_0_8px_#22c55e]" />
                <span className="font-mono text-xs md:text-sm font-bold uppercase text-green-700 tracking-widest">
                  LIVE DATA FEED
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 relative z-10 bg-neutral-100">
              <div className="p-4 md:p-6 flex flex-col justify-between hover:bg-white transition-colors border-r-4 border-b-4 lg:border-b-0 border-black">
                <span className="font-mono text-xs uppercase font-bold text-gray-500 tracking-widest mb-2 leading-tight">
                  BUSINESSES ROASTED
                </span>
                <span className="font-mono text-3xl md:text-5xl font-black text-black tracking-tighter">
                  1,429
                </span>
              </div>
              <div className="p-4 md:p-6 flex flex-col justify-between bg-red-50 hover:bg-red-100 transition-colors lg:border-r-4 border-b-4 lg:border-b-0 border-black">
                <span className="font-mono text-xs uppercase font-bold text-red-800 tracking-widest mb-2 leading-tight">
                  WERE RUBBISH
                </span>
                <span className="font-mono text-3xl md:text-5xl font-black text-red-600 tracking-tighter">
                  88%
                </span>
              </div>
              <div className="p-4 md:p-6 flex flex-col justify-between hover:bg-white transition-colors border-r-4 border-black">
                <span className="font-mono text-xs uppercase font-bold text-gray-500 tracking-widest mb-2 leading-tight">
                  AVG SCORE
                </span>
                <span className="font-mono text-3xl md:text-5xl font-black text-black tracking-tighter">
                  32
                  <span className="text-xl md:text-2xl text-gray-400">/100</span>
                </span>
              </div>
              <div className="p-4 md:p-6 flex flex-col justify-between hover:bg-white transition-colors">
                <span className="font-mono text-xs uppercase font-bold text-gray-500 tracking-widest mb-2 leading-tight">
                  TESTED TODAY
                </span>
                <span className="font-mono text-3xl md:text-5xl font-black text-black tracking-tighter">
                  41
                </span>
              </div>
            </div>
            <div className="border-t-4 border-black bg-white px-4 md:px-6 py-3 relative z-10">
              <p className="font-mono text-xs md:text-sm font-bold text-gray-600 italic">
                <span className="text-black font-black uppercase not-italic mr-2">
                  INSIGHT:
                </span>{" "}
                Great products don&apos;t fail. They get misunderstood.
              </p>
            </div>
          </div>
        </header>

        {/* Form — client component */}
        <SubmitForm />

        {/* Output Preview */}
        <section className="max-w-4xl mx-auto bg-white brutal-border brutal-shadow">
          <div className="bg-black text-white px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between border-b-4 border-black gap-2">
            <div className="flex items-center space-x-3">
              <span className="w-4 h-4 bg-green-500 border-2 border-white animate-pulse" />
              <span className="font-mono font-bold text-sm md:text-base tracking-widest uppercase">
                Live Diagnosis Output
              </span>
            </div>
            <span className="font-mono text-xs md:text-sm text-yellow-300">
              Get your spirit crushed
            </span>
          </div>

          <div className="p-0 text-black">
            {/* Scorecard */}
            <div className="bg-black text-white p-8 md:p-12 border-b-4 border-black relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
                <div className="space-y-4 text-center md:text-left">
                  <span className="inline-block bg-red-600 text-white font-mono text-xs md:text-sm font-bold px-3 py-1 uppercase tracking-widest brutal-border">
                    Roast Complete
                  </span>
                  <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none text-yellow-300">
                    Official Clarity Audit
                  </h3>
                </div>
                <div className="bg-white text-black brutal-border p-4 md:p-6 text-center transform md:rotate-3 shadow-[8px_8px_0_0_#ef4444] min-w-[200px]">
                  <span className="block font-mono text-xs md:text-sm font-bold uppercase text-gray-500 border-b-2 border-dashed border-gray-300 pb-2 mb-2">
                    Clarity Score
                  </span>
                  <div className="text-6xl md:text-7xl font-black text-red-600 tracking-tighter leading-none">
                    12<span className="text-3xl text-gray-400">/100</span>
                  </div>
                  <span className="block bg-black text-white text-xs font-bold uppercase mt-3 py-1 brutal-border">
                    Status: Terminal
                  </span>
                </div>
              </div>
            </div>

            {/* Core Disconnects */}
            <div className="p-6 md:p-8 border-b-4 border-black">
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-4 text-black">
                Core Disconnects
              </h3>
              <p className="font-mono text-sm md:text-base text-black font-bold mb-6">
                Your dog food stops your house from smelling like literal feces.
                You are marketing it like enterprise AI software.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-red-200 text-black brutal-border p-4 shadow-[4px_4px_0_0_#000]">
                  <span className="inline-block bg-black text-white font-mono text-[10px] font-bold uppercase px-2 py-1 mb-2 brutal-border">
                    CRITICAL
                  </span>
                  <h4 className="text-base md:text-lg font-black uppercase tracking-tighter leading-none text-black">
                    Algorithms vs Reality
                  </h4>
                  <p className="font-mono text-sm md:text-base font-bold text-red-800 mt-2">
                    You promise &apos;algorithmic digestive optimization&apos;.
                    The owner just wants to stop gagging when they use a poop
                    bag.
                  </p>
                </div>
                <div className="bg-yellow-200 text-black brutal-border p-4 shadow-[4px_4px_0_0_#000]">
                  <span className="inline-block bg-black text-white font-mono text-[10px] font-bold uppercase px-2 py-1 mb-2 brutal-border">
                    MAJOR
                  </span>
                  <h4 className="text-base md:text-lg font-black uppercase tracking-tighter leading-none text-black">
                    Feature Vomit
                  </h4>
                  <p className="font-mono text-sm md:text-base font-bold text-yellow-900 mt-2">
                    You put &apos;neural-net protein synthesis&apos; in the
                    headline before mentioning that it literally cures toxic yard
                    turds.
                  </p>
                </div>
              </div>
            </div>

            {/* 5 sections */}
            <div className="p-6 md:p-8 border-b-4 border-black bg-neutral-50">
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-2 text-black">
                1. What You Say
              </h3>
              <p className="font-mono text-sm md:text-base text-black font-bold">
                &quot;Kibble.ai leverages predictive ML models to synergize
                your canine&apos;s gastrointestinal output workflow.&quot;
              </p>
            </div>
            <div className="p-6 md:p-8 border-b-4 border-black">
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-2 text-black">
                2. What They Hear
              </h3>
              <p className="font-mono text-sm md:text-base text-black font-bold">
                &quot;Are you selling enterprise plumbing software for robot
                dogs? I just need kibble.&quot;
              </p>
            </div>
            <div className="p-6 md:p-8 border-b-4 border-black bg-neutral-50">
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-2 text-black">
                3. The Gap
              </h3>
              <p className="font-mono text-sm md:text-base text-black font-bold">
                The buyer desperately wants their backyard to stop smelling like
                an open sewer. You are trying to sell them &apos;predictive
                kibble analytics&apos;.
              </p>
            </div>
            <div className="p-6 md:p-8 border-b-4 border-black">
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-2 text-black">
                4. Why This Matters
              </h3>
              <p className="font-mono text-sm md:text-base text-black font-bold">
                You are paying Google $4 a click for exhausted dog owners to
                read your hero text, get confused, and go buy a normal $5 bag of
                food.
              </p>
            </div>
            <div className="p-6 md:p-8 bg-neutral-50">
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-2 text-black">
                5. Bottom Line
              </h3>
              <p className="font-mono text-sm md:text-base text-black font-bold">
                Stop selling the algorithm. Start selling the fact that you cure
                toxic dog shit.
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 bg-black brutal-border p-4 shadow-[6px_6px_0_0_#FDE047]">
            <p className="font-mono text-sm md:text-base font-bold uppercase tracking-widest text-center text-yellow-300">
              NOTE: Real roast reports are heavily detailed and significantly
              longer.
            </p>
          </div>
        </section>

        {/* Hall of Confusion */}
        <section className="max-w-5xl mx-auto mb-20 px-4 md:px-0">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-8 border-b-8 border-black pb-4">
            24-Hour Hall of Confusion{" "}
            <span className="text-red-500 animate-pulse text-xl md:text-3xl align-top block lg:inline mt-2 lg:mt-0 font-mono">
              (Live Feed)
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white brutal-border p-6 shadow-[4px_4px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all cursor-pointer">
              <div>
                <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-4">
                  <span className="font-mono text-sm font-bold truncate uppercase">
                    A Series A Fintech
                  </span>
                  <span className="bg-red-500 text-black font-black text-xs px-2 py-1 brutal-border">
                    SCORE: 18
                  </span>
                </div>
                <p className="font-mono text-sm font-bold text-black italic">
                  &quot;You sell a scheduling app for plumbers. Why does your
                  website say you are building an &apos;omnichannel existential
                  timeline router&apos;?&quot;
                </p>
              </div>
              <span className="font-mono text-xs text-gray-400 font-bold uppercase mt-6 block">
                Roasted 4 mins ago
              </span>
            </div>
            <div className="bg-white brutal-border p-6 shadow-[4px_4px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all cursor-pointer">
              <div>
                <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-4">
                  <span className="font-mono text-sm font-bold truncate uppercase">
                    A Series B SaaS
                  </span>
                  <span className="bg-yellow-400 text-black font-black text-xs px-2 py-1 brutal-border">
                    SCORE: 42
                  </span>
                </div>
                <p className="font-mono text-sm font-bold text-black italic">
                  &quot;Listed 18 API integrations in the hero text before
                  accidentally mentioning this is a payroll tool.&quot;
                </p>
              </div>
              <span className="font-mono text-xs text-gray-400 font-bold uppercase mt-6 block">
                Roasted 12 mins ago
              </span>
            </div>
            <div className="bg-white brutal-border p-6 shadow-[4px_4px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all cursor-pointer">
              <div>
                <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-4">
                  <span className="font-mono text-sm font-bold truncate uppercase">
                    AI Productivity Tool
                  </span>
                  <span className="bg-red-500 text-black font-black text-xs px-2 py-1 brutal-border">
                    SCORE: 11
                  </span>
                </div>
                <p className="font-mono text-sm font-bold text-black italic">
                  &quot;Your product is a glorified Pomodoro timer. You are
                  marketing it like a neuro-hacking paradigm shift.&quot;
                </p>
              </div>
              <span className="font-mono text-xs text-gray-400 font-bold uppercase mt-6 block">
                Roasted 17 mins ago
              </span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8">
          <p className="font-mono font-bold text-sm md:text-xl uppercase tracking-widest px-4">
            Clarity isn&apos;t a luxury.
            <br className="md:hidden" /> It&apos;s the difference between being
            understood and being ignored.
          </p>
        </footer>
      </div>
    </div>
  );
}
