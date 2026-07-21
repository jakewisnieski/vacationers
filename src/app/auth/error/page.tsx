import Link from "next/link";

// Auth.js redirects here when sign-in fails. The allowlist hard-bounce (#5)
// arrives as `error=AccessDenied`.
export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const notInvited = error === "AccessDenied";

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-serif text-4xl font-semibold">
          {notInvited ? "You're not on the guest list" : "Sign-in failed"}
        </h1>
        <p className="mt-4 text-ink-dim">
          {notInvited
            ? "That Google account hasn't been invited to this trip planner. Ask your group's owner to add your email, then try again."
            : "Something went wrong signing you in. Please try again."}
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-action px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-action-strong"
        >
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
