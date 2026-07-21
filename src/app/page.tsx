import { auth, signIn, signOut } from "@/auth";

export default async function Home() {
  const session = await auth();
  const user = session?.user;

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
          {user ? (
            <>
              <div className="flex items-center gap-3">
                <h2 className="font-serif text-2xl">
                  Welcome back{user.name ? `, ${user.name}` : ""}.
                </h2>
                {user.isOwner && (
                  <span className="rounded-full bg-action px-2.5 py-0.5 text-xs font-medium text-white">
                    Owner
                  </span>
                )}
              </div>
              <p className="mt-2 text-ink-dim">
                Signed in as {user.email}. The trip dashboard lands in a later
                slice (#15).
              </p>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="mt-4 inline-block rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-stage"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="font-serif text-2xl">Sign in to start planning</h2>
              <p className="mt-2 text-ink-dim">
                Vacationers is invite-only. Sign in with the Google account your
                group&apos;s owner added to the guest list.
              </p>
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-action px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-action-strong"
                >
                  Sign in with Google
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
