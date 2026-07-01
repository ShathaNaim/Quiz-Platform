"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Quiz = {
  id: number;
  title: string;
  description: string;
  time_limit: number | null;
  code: string | null;
  status: "draft" | "published" | "closed";
  show_result_to_student: boolean;
};

type QuizForm = {
  title: string;
  description: string;
  code: string;
  timeLimit: string;
  status: Quiz["status"];
  showResults: boolean;
};

export default function EditQuizPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizForm, setQuizForm] = useState<QuizForm>({
    title: "",
    description: "",
    code: "",
    timeLimit: "",
    status: "draft",
    showResults: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const getToken = useCallback(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/sign-in");
      return null;
    }

    return token;
  }, [router]);

  useEffect(() => {
    let shouldUpdate = true;

    async function loadQuiz() {
      const token = getToken();

      if (!token) {
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8000/api/quizzes/${params.id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Could not load quiz.");
        }

        const data: Quiz = await response.json();

        if (!shouldUpdate) {
          return;
        }

        setQuiz(data);
        setQuizForm({
          title: data.title,
          description: data.description,
          code: data.code || "",
          timeLimit: data.time_limit ? String(data.time_limit) : "",
          status: data.status,
          showResults: data.show_result_to_student,
        });
        setError("");
      } catch (error) {
        if (shouldUpdate) {
          console.error(error);
          setError("Could not load quiz.");
        }
      }
    }

    loadQuiz();

    return () => {
      shouldUpdate = false;
    };
  }, [getToken, params.id]);

  async function handleUpdateQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:8000/api/quizzes/${params.id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: quizForm.title,
            description: quizForm.description,
            code: quizForm.code || null,
            time_limit: quizForm.timeLimit ? Number(quizForm.timeLimit) : null,
            status: quizForm.status,
            show_result_to_student: quizForm.showResults,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Could not update quiz.");
      }

      const data: Quiz = await response.json();
      setQuiz(data);
    router.push("/quiz_list");

    } catch (error) {
      console.error(error);
      setError("Could not update quiz.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteQuiz() {
    const token = getToken();

    if (!token) {
      return;
    }

    const shouldDelete = window.confirm(
      "Delete this quiz and all of its questions?",
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:8000/api/quizzes/${params.id}/`,
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

      router.push("/quiz_list");
    } catch (error) {
      console.error(error);
      setError("Could not delete quiz.");
      setIsDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-6 py-8 text-slate-950 sm:px-10 lg:px-12">
      <section className="mx-auto w-full max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link className="text-xl font-bold tracking-normal" href="/">
            QuizPlatform
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
              href="/quiz_list"
            >
              Quiz list
            </Link>
            <button
              className="inline-flex h-11 items-center justify-center rounded-md border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:border-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isDeleting}
              type="button"
              onClick={handleDeleteQuiz}
            >
              {isDeleting ? "Deleting..." : "Delete quiz"}
            </button>
          </div>
        </header>

        <div className="py-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Edit quiz
          </p>
          <h1 className="text-4xl font-bold tracking-normal">
            {quiz?.title || "Quiz settings"}
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-600">
            Update the quiz details students and teachers will see.
          </p>

          {error && (
            <p className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          <form
            className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            onSubmit={handleUpdateQuiz}
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
                  className="h-12 w-full rounded-md border border-slate-300 px-4 text-base text-slate-950 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                  id="title"
                  required
                  value={quizForm.title}
                  onChange={(event) =>
                    setQuizForm((currentForm) => ({
                      ...currentForm,
                      title: event.target.value,
                    }))
                  }
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
                  className="min-h-32 w-full resize-y rounded-md border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                  id="description"
                  required
                  value={quizForm.description}
                  onChange={(event) =>
                    setQuizForm((currentForm) => ({
                      ...currentForm,
                      description: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    className="mb-2 block text-sm font-semibold text-slate-700"
                    htmlFor="code"
                  >
                    Code
                  </label>
                  <input
                    className="h-12 w-full rounded-md border border-slate-300 px-4 text-base font-bold uppercase tracking-[0.14em] text-slate-950 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                    id="code"
                    maxLength={10}
                    value={quizForm.code}
                    onChange={(event) =>
                      setQuizForm((currentForm) => ({
                        ...currentForm,
                        code: event.target.value.toUpperCase(),
                      }))
                    }
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-semibold text-slate-700"
                    htmlFor="time-limit"
                  >
                    Time limit
                  </label>
                  <input
                    className="h-12 w-full rounded-md border border-slate-300 px-4 text-base text-slate-950 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                    id="time-limit"
                    min="1"
                    type="number"
                    value={quizForm.timeLimit}
                    onChange={(event) =>
                      setQuizForm((currentForm) => ({
                        ...currentForm,
                        timeLimit: event.target.value,
                      }))
                    }
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
                    value={quizForm.status}
                    onChange={(event) =>
                      setQuizForm((currentForm) => ({
                        ...currentForm,
                        status: event.target.value as Quiz["status"],
                      }))
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <label className="flex min-h-12 items-center justify-between rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700">
                  Show results
                  <input
                    checked={quizForm.showResults}
                    className="h-5 w-5 accent-teal-700"
                    type="checkbox"
                    onChange={(event) =>
                      setQuizForm((currentForm) => ({
                        ...currentForm,
                        showResults: event.target.checked,
                      }))
                    }
                  />
                </label>
              </div>

              <button
                className="h-12 w-full rounded-md bg-teal-700 px-5 text-base font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={isSaving || !quizForm.title.trim() || !quizForm.description.trim()}
                type="submit"
              >
                {isSaving ? "Saving..." : "Save quiz"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
