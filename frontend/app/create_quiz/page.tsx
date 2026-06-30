"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function generateQuizCode() {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 6; index += 1) {
    code += characters[Math.floor(Math.random() * characters.length)];
  }

  return code;
}

export default function CreateQuiz() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState(() => generateQuizCode());
  const [timeLimit, setTimeLimit] = useState("");
  const [showResults, setShowResults] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.push("/sign-in");
    }
  }, [router]);

  async function handleCreateQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/sign-in");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/quizzes/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          code,
          time_limit: timeLimit ? Number(timeLimit) : null,
          show_result_to_student: showResults,
          status: "draft",
        }),
      });

      if (response.ok) {
        router.push('/quiz_list');
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

        <div className="items-center gap-8 py-12">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              Create quiz
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-normal sm:text-5xl">
              Start with the quiz details.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-8 text-slate-600">
              Set the title, instructions, and timing first. You can add
              questions after the quiz is created.
            </p>
          </div>

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
                    htmlFor="quiz-code"
                  >
                    Quiz code
                  </label>
                  <div className="flex gap-2">
                    <input
                      className="h-12 w-full rounded-md border border-slate-300 px-4 text-base font-bold uppercase tracking-[0.14em] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                      id="quiz-code"
                      maxLength={10}
                      required
                      type="text"
                      value={code}
                      onChange={(event) =>
                        setCode(event.target.value.toUpperCase())
                      }
                    />
                    <button
                      className="h-12 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-800 transition hover:border-slate-900 hover:bg-slate-50"
                      type="button"
                      onClick={() => setCode(generateQuizCode())}
                    >
                      Regenerate
                    </button>
                  </div>
                </div>

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
