"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type JoinedQuiz = {
  id: number;
  title: string;
  description: string;
  time_limit: number | null;
  code: string;
  show_result_to_student: boolean;
};

export default function JoinQuizPage() {
  const router = useRouter();
  const [initialCode] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return new URLSearchParams(window.location.search).get("code")?.toUpperCase() || "";
  });
  const [code, setCode] = useState(initialCode);
  const [quiz, setQuiz] = useState<JoinedQuiz | null>(null);
  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [isFindingQuiz, setIsFindingQuiz] = useState(Boolean(initialCode));
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");

  const fetchQuiz = useCallback(async (codeToFind: string) => {
    const normalizedCode = codeToFind.trim().toUpperCase();

    if (!normalizedCode) {
      return null;
    }

    const response = await fetch("http://localhost:8000/api/join-quiz/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: normalizedCode,
      }),
    });

    if (!response.ok) {
      throw new Error("Could not find quiz.");
    }

    const data: JoinedQuiz = await response.json();
    return data;
  }, []);

  useEffect(() => {
    let shouldUpdate = true;

    if (!initialCode.trim()) {
      return;
    }

    fetchQuiz(initialCode)
      .then((data) => {
        if (shouldUpdate && data) {
          setQuiz(data);
          setCode(data.code);
        }
      })
      .catch((error) => {
        if (shouldUpdate) {
          console.error(error);
          setError("Could not find a published quiz with this code.");
        }
      })
      .finally(() => {
        if (shouldUpdate) {
          setIsFindingQuiz(false);
        }
      });

    return () => {
      shouldUpdate = false;
    };
  }, [fetchQuiz, initialCode]);

  async function findQuiz(codeToFind = code) {
    const normalizedCode = codeToFind.trim().toUpperCase();

    if (!normalizedCode) {
      return;
    }

    setIsFindingQuiz(true);
    setError("");
    setQuiz(null);

    try {
      const data = await fetchQuiz(normalizedCode);

      if (data) {
        setQuiz(data);
        setCode(data.code);
      }
    } catch (error) {
      console.error(error);
      setError("Could not find a published quiz with this code.");
    } finally {
      setIsFindingQuiz(false);
    }
  }

  async function handleFindQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    findQuiz();
  }

  async function handleStartQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!quiz) {
      return;
    }

    setIsStarting(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/attempts/start/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quiz: quiz.id,
          participant_name: participantName,
          participant_email: participantEmail,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not start quiz.");
      }

      const data = await response.json();
      router.push(`/take_quiz/${data.id}`);
    } catch (error) {
      console.error(error);
      setError("Could not start the quiz. Try again.");
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between">
          <Link className="text-xl font-bold tracking-normal" href="/">
            QuizPlatform
          </Link>
          <Link
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-900 hover:bg-white"
            href="/"
          >
            Back home
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-8 py-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              Join quiz
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-normal sm:text-5xl">
              Enter the room and start when ready.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-8 text-slate-600">
              Confirm the quiz code, add your name, and begin the attempt.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <form className="space-y-5" onSubmit={handleFindQuiz}>
              <div>
                <label
                  className="mb-2 block text-sm font-semibold text-slate-700"
                  htmlFor="code"
                >
                  Quiz code
                </label>
                <input
                  className="h-12 w-full rounded-md border border-slate-300 px-4 text-base font-bold uppercase tracking-[0.14em] text-slate-950 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                  id="code"
                  maxLength={10}
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                />
              </div>

              <button
                className="h-12 w-full rounded-md border border-slate-300 px-5 text-base font-semibold text-slate-900 transition hover:border-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isFindingQuiz || !code.trim()}
                type="submit"
              >
                {isFindingQuiz ? "Finding..." : "Find quiz"}
              </button>
            </form>

            {error && (
              <p className="mt-5 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            )}

            {quiz && (
              <form className="mt-6 border-t border-slate-100 pt-6" onSubmit={handleStartQuiz}>
                <div className="rounded-md bg-slate-50 p-4">
                  <h2 className="text-xl font-bold text-slate-950">{quiz.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {quiz.description}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Time limit: {quiz.time_limit ? `${quiz.time_limit} minutes` : "None"}
                  </p>
                </div>

                <div className="mt-5 space-y-5">
                  <div>
                    <label
                      className="mb-2 block text-sm font-semibold text-slate-700"
                      htmlFor="participant-name"
                    >
                      Name
                    </label>
                    <input
                      className="h-12 w-full rounded-md border border-slate-300 px-4 text-base text-slate-950 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                      id="participant-name"
                      required
                      value={participantName}
                      onChange={(event) => setParticipantName(event.target.value)}
                    />
                  </div>

                  <div>
                    <label
                      className="mb-2 block text-sm font-semibold text-slate-700"
                      htmlFor="participant-email"
                    >
                      Email
                    </label>
                    <input
                      className="h-12 w-full rounded-md border border-slate-300 px-4 text-base text-slate-950 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                      id="participant-email"
                      type="email"
                      value={participantEmail}
                      onChange={(event) => setParticipantEmail(event.target.value)}
                    />
                  </div>

                  <button
                    className="h-12 w-full rounded-md bg-teal-700 px-5 text-base font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    disabled={isStarting || !participantName.trim()}
                    type="submit"
                  >
                    {isStarting ? "Starting..." : "Start quiz"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
