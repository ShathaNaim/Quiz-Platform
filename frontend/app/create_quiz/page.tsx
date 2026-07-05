"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/app/lib/api";

type CreatedQuiz = {
  id: number;
  title: string;
  code: string | null;
};

export default function CreateQuiz() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const [showResults, setShowResults] = useState(true);
  const [status, setStatus] = useState("draft");
  const [maxAttemptsPerEmail, setMaxAttemptsPerEmail] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdQuiz, setCreatedQuiz] = useState<CreatedQuiz | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.push("/sign-in");
    }
  }, [router]);

  async function handleCreateQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCreatedQuiz(null);
    setIsSubmitting(true);

    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/sign-in");
      return;
    }

    try {
      const response = await fetch(apiUrl("/quizzes/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          time_limit: timeLimit ? Number(timeLimit) : null,
          available_from: availableFrom || null,
          available_until: availableUntil || null,
          show_result_to_student: showResults,
          status: status,
          max_attempts_per_email: Math.max(1, Number(maxAttemptsPerEmail) || 1),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedQuiz(data);
        return;
      }

      const data = await response.json();
      console.error(data);
      setError("Could not create quiz. Check the required fields and try again.");
    } catch (error) {
      console.error(error);
      setError("Could not connect to the quiz API.");
    } finally {
      setIsSubmitting(false);
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

        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-10 sm:py-14">
          <div className="mb-7">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              Create quiz
            </p>
            <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-normal sm:text-5xl">
              Start with the quiz details.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Set the title, instructions, and timing first. You can add
              questions after the quiz is created.
            </p>
          </div>

          {createdQuiz && (
            <div className="mb-6 rounded-lg border border-teal-200 bg-teal-50 p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
                Quiz created
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                {createdQuiz.title}
              </h2>
              <div className="mt-5 rounded-md border border-teal-200 bg-white p-4">
                <span className="block text-sm font-semibold text-slate-700">
                  Quiz code
                </span>
                <span className="mt-1 block text-3xl font-bold uppercase tracking-[0.18em] text-slate-950">
                  {createdQuiz.code}
                </span>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
                  href={`/quiz_questions/${createdQuiz.id}`}
                >
                  Add questions
                </Link>
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
                  href="/quiz_list"
                >
                  View quiz list
                </Link>
              </div>
            </div>
          )}

          <form
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            onSubmit={handleCreateQuiz}
          >
            <div className="space-y-5">
              <div>
                <label
                  className="mb-2 block text-sm font-semibold text-slate-700"
                  htmlFor="title"
                >
                  Quiz title
                </label>
                <input
                  className="h-12 w-full rounded-md border border-slate-300 px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                  id="title"
                  placeholder="Example: Python basics"
                  required
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-semibold text-slate-700"
                  htmlFor="description"
                >
                  Description
                </label>
                <textarea
                  className="min-h-32 w-full resize-y rounded-md border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                  id="description"
                  placeholder="Write short instructions for students."
                  required
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
             
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    className="mb-2 block text-sm font-semibold text-slate-700"
                    htmlFor="time-limit"
                  >
                    Time limit
                  </label>
                  <input
                    className="h-12 w-full rounded-md border border-slate-300 px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                    id="time-limit"
                    min="1"
                    placeholder="Minutes"
                    type="number"
                    value={timeLimit}
                    onChange={(event) => setTimeLimit(event.target.value)}
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-semibold text-slate-700"
                    htmlFor="available-from"
                  >
                    Available from
                  </label>
                  <input
                    className="h-12 w-full rounded-md border border-slate-300 px-4 text-base text-slate-950 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                    id="available-from"
                    type="datetime-local"
                    value={availableFrom}
                    onChange={(event) => setAvailableFrom(event.target.value)}
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-semibold text-slate-700"
                    htmlFor="available-until"
                  >
                    Available until
                  </label>
                  <input
                    className="h-12 w-full rounded-md border border-slate-300 px-4 text-base text-slate-950 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                    id="available-until"
                    type="datetime-local"
                    value={availableUntil}
                    onChange={(event) => setAvailableUntil(event.target.value)}
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-semibold text-slate-700"
                    htmlFor="status"
                  >
                    Status
                  </label>
                  <select
                    className="h-12 w-full rounded-md border border-slate-300 px-4 text-base text-slate-950 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                    id="status"
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value)
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-semibold text-slate-700"
                    htmlFor="max-attempts-per-email"
                  >
                    Max attempts per email
                  </label>
                  <input
                    className="h-12 w-full rounded-md border border-slate-300 px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                    id="max-attempts-per-email"
                    min="1"
                    placeholder="1"
                    type="number"
                    value={maxAttemptsPerEmail}
                    onChange={(event) => setMaxAttemptsPerEmail(event.target.value)}
                  />
                </div>

                <label className="flex min-h-12 items-center justify-between rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700">
                  Show results
                  <input
                    checked={showResults}
                    className="h-5 w-5 accent-teal-700"
                    type="checkbox"
                    onChange={(event) => setShowResults(event.target.checked)}
                  />
                </label>
              </div>

              {error && (
                <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}

              <button
                className="h-12 w-full rounded-md bg-teal-700 px-5 text-base font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={isSubmitting || !title.trim() || !description.trim()}
                type="submit"
              >
                {isSubmitting ? "Creating..." : "Create quiz"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
