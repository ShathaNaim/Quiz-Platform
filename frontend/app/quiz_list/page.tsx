"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/app/lib/api";

type Quiz = {
  id: number;
  title: string;
  description: string;
  created_at: string;
  time_limit: number | null;
  code: string | null;
  status: "draft" | "published" | "closed";
  show_result_to_student: boolean;
};

const statusStyles = {
  draft: "bg-amber-50 text-amber-700 ring-amber-200",
  published: "bg-teal-50 text-teal-700 ring-teal-200",
  closed: "bg-slate-100 text-slate-700 ring-slate-300",
};

export default function QuizList() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingQuizId, setDeletingQuizId] = useState<number | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);

  useEffect(() => {
    async function fetchQuizzes() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.push("/sign-in");
        return;
      }

      try {
        const response = await fetch(apiUrl("/quizzes/"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          router.push("/sign-in");
          return;
        }

        if (!response.ok) {
          throw new Error(`Could not load quizzes. Status: ${response.status}`);
        }

        const data = await response.json();
        setQuizzes(data);
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "Could not load quizzes. Make sure the backend is running."
      );
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuizzes();
  }, [router]);

  async function handleDeleteQuiz(quizId: number) {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/sign-in");
      return;
    }

    setQuizToDelete(null);
    setDeletingQuizId(quizId);
    setError("");

    try {
      const response = await fetch(
        apiUrl(`/quizzes/${quizId}/`),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Could not delete quiz.");
      }

      setQuizzes((currentQuizzes) =>
        currentQuizzes.filter((quiz) => quiz.id !== quizId),
      );
    } catch (error) {
      console.error(error);
      setError("Could not delete quiz. Try again.");
    } finally {
      setDeletingQuizId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between">
          <Link className="text-xl font-bold tracking-normal" href="/">
            QuizPlatform
          </Link>
          <Link
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
            href="/create_quiz"
          >
            New quiz
          </Link>
        </header>

        <div className="py-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
                Quizzes
              </p>
              <h1 className="text-4xl font-bold tracking-normal">
                Your quiz library
              </h1>
              <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-600">
                Review drafts, share published quiz codes, and continue editing
                your classroom activities.
              </p>
            </div>
          </div>

          {isLoading && (
            <div className="mt-10 rounded-lg border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-600 shadow-sm">
              Loading quizzes...
            </div>
          )}

          {error && (
            <div className="mt-10 rounded-lg border border-red-100 bg-red-50 p-5 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {!isLoading && !error && quizzes.length === 0 && (
            <div className="mt-10 rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-2xl font-bold text-slate-950">
                No quizzes yet
              </h2>
              <p className="mx-auto mt-3 max-w-md text-slate-600">
                Create your first quiz, then it will appear here for editing
                and sharing.
              </p>
              <Link
                className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-teal-700 px-5 text-base font-semibold text-white transition hover:bg-teal-800"
                href="/create_quiz"
              >
                Create quiz
              </Link>
            </div>
          )}

          {!isLoading && !error && quizzes.length > 0 && (
            <div className="mt-10 grid gap-4">
              {quizzes.map((quiz) => (
                <article
                  className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                  key={quiz.id}
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-bold tracking-normal text-slate-950">
                          {quiz.title}
                        </h2>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ring-1 ${statusStyles[quiz.status]}`}
                        >
                          {quiz.status}
                        </span>
                      </div>
                      <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                        {quiz.description}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link
                        className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
                        href={`/quiz_questions/${quiz.id}`}
                      >
                        Questions
                      </Link>

                      <Link
                        className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
                        href={`/edit_quiz/${quiz.id}`}
                      >
                        Edit quiz
                      </Link>
                         <Link
                        className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
                        href={`/quiz_attempts/${quiz.id}`}
                      >
                        Attempts
                      </Link>

                      <button
                        className="inline-flex h-11 items-center justify-center rounded-md border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:border-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={deletingQuizId === quiz.id}
                        type="button"
                        onClick={() => setQuizToDelete(quiz)}
                      >
                        {deletingQuizId === quiz.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <span className="block font-semibold text-slate-900">
                        Code
                      </span>
                      {quiz.code || "Not published"}
                    </div>
                    <div>
                      <span className="block font-semibold text-slate-900">
                        Time limit
                      </span>
                      {quiz.time_limit ? `${quiz.time_limit} minutes` : "None"}
                    </div>
                    <div>
                      <span className="block font-semibold text-slate-900">
                        Results
                      </span>
                      {quiz.show_result_to_student ? "Shown to students" : "Hidden"}
                    </div>
                    <div>
                      <span className="block font-semibold text-slate-900">
                        Created
                      </span>
                      {new Date(quiz.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
        {quizToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
              <h2 className="text-xl font-bold text-slate-950">
                Delete quiz?
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                This will delete {quizToDelete.title}, its questions, and all
                related attempts. This action cannot be undone.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
                  type="button"
                  onClick={() => setQuizToDelete(null)}
                >
                  Cancel
                </button>

                <button
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={deletingQuizId === quizToDelete.id}
                  type="button"
                  onClick={() => handleDeleteQuiz(quizToDelete.id)}
                >
                  {deletingQuizId === quizToDelete.id ? "Deleting..." : "Delete quiz"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
