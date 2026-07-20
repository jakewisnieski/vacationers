export default function Home() {
  return (
    <main className="flex-1">
      <section className="hero-dusk">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">
            Wanderlust · Nightfall
          </p>
          <h1 className="mt-4 font-serif text-6xl font-semibold text-white">
            Vacationers
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
            One source of truth for planning your friend group&apos;s annual trip.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-2xl border border-line bg-stage-raised p-6">
          <h2 className="font-serif text-2xl">Scaffold online</h2>
          <p className="mt-2 text-ink-dim">
            Next.js · TypeScript · Tailwind · Prisma on Neon. The trip dashboard
            and the big-three hero land in a later slice (#15).
          </p>
          <a
            href="/api/health"
            className="mt-4 inline-block rounded-full bg-action px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-action-strong"
          >
            Check API health
          </a>
        </div>
      </section>
    </main>
  );
}
