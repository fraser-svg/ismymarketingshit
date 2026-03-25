import { SubmitForm } from "@/components/SubmitForm";

const diagnosticPoints = [
  "How clear your value proposition is to a first-time visitor",
  "Whether your messaging matches what your market actually cares about",
  "The gap between what you say and what your competitors say",
  "Where your copy creates friction, doubt, or confusion",
  "Specific rewrites you can action this week",
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-white font-sans">
      <main className="flex w-full max-w-xl flex-col px-6 py-20 sm:py-32">
        {/* Headline */}
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-4xl">
          Find out what your messaging
          <br />
          actually says about you.
        </h1>

        {/* Subheadline */}
        <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-500">
          Most companies don&rsquo;t have a marketing problem. They have a
          messaging problem. This free diagnostic shows you the gap.
        </p>

        {/* Form */}
        <div className="mt-10">
          <SubmitForm />
        </div>

        {/* What you'll get */}
        <section className="mt-16">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
            What you&rsquo;ll get
          </h2>
          <ul className="mt-5 flex flex-col gap-3">
            {diagnosticPoints.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 text-sm leading-relaxed text-zinc-600"
              >
                <span
                  className="mt-1.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#2563eb]"
                  aria-hidden="true"
                />
                {point}
              </li>
            ))}
          </ul>
        </section>

        {/* Footer */}
        <footer className="mt-20 border-t border-zinc-100 pt-6">
          <p className="text-xs text-zinc-400">
            By{" "}
            <a
              href="https://deanwiseman.com"
              className="text-zinc-500 underline underline-offset-2 transition-colors hover:text-[#2563eb]"
              target="_blank"
              rel="noopener noreferrer"
            >
              Dean &amp; Wiseman
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
