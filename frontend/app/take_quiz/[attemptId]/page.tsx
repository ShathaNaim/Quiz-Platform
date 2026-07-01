"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function TakeQuizPage() {
  const params = useParams<{ attemptId: string }>();

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-6 py-8 text-slate-950 sm:px-10 lg:px-12">
      <section className="mx-auto w-full max-w-4xl">
        <header className="flex items-center justify-between">
          <Link className="text-xl font-bold tracking-normal" href="/">
            QuizPlatform
          </Link>
        </header>

        <div className="py-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Take quiz
          </p>
          <h1 className="text-4xl font-bold tracking-normal">
            Attempt #{params.attemptId}
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-600">
            The quiz-taking screen is ready for the next step.
          </p>
        </div>
      </section>
    </main>
  );
}
