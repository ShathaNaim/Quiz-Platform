"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/app/lib/api";

function subscribeToTokenChanges(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("auth-token-changed", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("auth-token-changed", onStoreChange);
  };
}

function getTokenSnapshot() {
  return localStorage.getItem("access_token");
}

function getServerTokenSnapshot() {
  return undefined;
}

export default function Home() {
  const router = useRouter();

  const [quizCode, setQuizCode] = useState("");
  const [isFindingQuiz, setIsFindingQuiz] = useState(false);
  const [joinError, setJoinError] = useState("");
  const token = useSyncExternalStore(
    subscribeToTokenChanges,
    getTokenSnapshot,
    getServerTokenSnapshot
  );
   

  async function handleJoinQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const code = quizCode.trim().toUpperCase();

    if (!code) {
      return;
    }

    setIsFindingQuiz(true);
    setJoinError("");

    try {
      const response = await fetch(apiUrl("/join-quiz/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error("Could not find quiz.");
      }

      router.push(`/join_quiz?code=${encodeURIComponent(code)}`);
    } catch (error) {
      console.error(error);
      setJoinError("Could not find a published quiz with this code.");
    } finally {
      setIsFindingQuiz(false);
    }
  }
  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between">
          <Link className="text-xl font-bold tracking-normal" href="/">
            QuizPlatform
          </Link>
          {token === undefined ? (
            <span className="h-10 w-20 rounded-md border border-transparent" />
          ) : token ?(
            <div className="flex flex-wrap items-center gap-2">
              <Link
                className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                href="/quiz_list"
              >
                My quizzes
              </Link>
              <button
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-900 hover:bg-white"
                onClick={() => {
                  localStorage.removeItem("access_token");
                  localStorage.removeItem("refresh_token");
                  window.dispatchEvent(new Event("auth-token-changed"));
                }}
              >
                Logout
              </button>
            </div>

          ):(
            <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-900 hover:bg-white"
            href="/sign-in"
          >
            Sign in
          </Link>
          <Link
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-900 hover:bg-white"
            href="/sign-up"
          >
            Sign up
          </Link>
          </div>)}

        </header>

        <div className="items-center py-14 mb-14">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              Live quizzes for class, work, and friends
            </p>
            <h1 className="text-2xl font-bold leading-tight tracking-normal text-slate-950 sm:text-5xl">
              Create a quiz or join one with a code.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Build questions, share a quiz code, and let players answer from
              any device.
            </p>
            <div className="mt-9 mb-14 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-teal-700 px-6 text-base font-semibold text-white transition hover:bg-teal-800"
                href="/create_quiz"
              >
                Create quiz
              </Link>
          
            </div>
          </div>

          <div
            id="take-quiz"
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8 w-1/2 mx-auto"
          >
            <div className="mb-7">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700 text-center">
                Take quiz
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-normal text-slate-950 text-center">
                Enter your quiz code
              </h2>
            </div>

            <form className="space-y-4" onSubmit={handleJoinQuiz}>
              <label
                className="block text-sm font-semibold text-slate-700 text-center"
                htmlFor="quiz-code"
              >
                Quiz code
              </label>
              <input
                className="h-14 w-full rounded-md border border-slate-300 bg-white px-4 text-xl font-semibold uppercase tracking-[0.14em] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-100 text-center"
                id="quiz-code"
                inputMode="text"
                maxLength={12}
                placeholder="ABC123"
                value={quizCode}
                onChange={(event) => {
                  setQuizCode(event.target.value.toUpperCase());
                  setJoinError("");
                }}
              />
              {joinError && (
                <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {joinError}
                </p>
              )}
              <button
                className="h-12 w-full rounded-md bg-slate-950 px-5 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                type="submit"
                disabled={isFindingQuiz || !quizCode.trim()}
              >
                {isFindingQuiz ? "Finding..." : "Join quiz"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
