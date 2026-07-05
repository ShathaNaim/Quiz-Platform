"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiUrl } from "@/app/lib/api";

type Quiz = {
  id: number;
  title: string;
  description: string;
  time_limit: number | null;
  available_from: string | null;
  available_until: string | null;
  code: string | null;
  status: "draft" | "published" | "closed";
  show_result_to_student: boolean;
  max_attempts_per_email: number;
};

type QuizForm = {
  title: string;
  description: string;
  code: string;
  timeLimit: string;
  availableFrom: string;
  availableUntil: string;
  status: Quiz["status"];
  showResults: boolean;
  maxAttemptsPerEmail: string;
};

function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export default function EditQuizPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizForm, setQuizForm] = useState<QuizForm>({
    title: "",
    description: "",
    code: "",
    timeLimit: "",
    availableFrom: "",
    availableUntil: "",
    status: "draft",
    showResults: true,
    maxAttemptsPerEmail: "1",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
          apiUrl(`/quizzes/${params.id}/`),
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
          availableFrom: toDateTimeLocalValue(data.available_from),
          availableUntil: toDateTimeLocalValue(data.available_until),
          status: data.status,
          showResults: data.show_result_to_student,
          maxAttemptsPerEmail: String(data.max_attempts_per_email || 1),
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
        apiUrl(`/quizzes/${params.id}/`),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: quizForm.title,
            description: quizForm.description,
            time_limit: quizForm.timeLimit ? Number(quizForm.timeLimit) : null,
            available_from: quizForm.availableFrom || null,
            available_until: quizForm.availableUntil || null,
            status: quizForm.status,
            show_result_to_student: quizForm.showResults,
            max_attempts_per_email: Math.max(
              1,
              Number(quizForm.maxAttemptsPerEmail) || 1,
            ),
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

  async function handleRegenerateCode() {
    const token = getToken();

    if (!token) {
      return;
    }

    setIsRegenerateModalOpen(false);
    setIsRegeneratingCode(true);
    setError("");

    try {
      const response = await fetch(
        apiUrl(`/quizzes/${params.id}/regenerate-code/`),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Could not regenerate quiz code.");
      }

      const data: Quiz = await response.json();
      setQuiz(data);
      setQuizForm((currentForm) => ({
        ...currentForm,
        code: data.code || "",
      }));
    } catch (error) {
      console.error(error);
      setError("Could not regenerate quiz code.");
    } finally {
      setIsRegeneratingCode(false);
    }
  }

  async function handleDeleteQuiz() {
    const token = getToken();

    if (!token) {
      return;
    }

    setIsDeleteModalOpen(false);
    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(
        apiUrl(`/quizzes/${params.id}/`),
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
              onClick={() => setIsDeleteModalOpen(true)}
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
                  <div className="flex gap-2">
                    <input
                      className="h-12 w-full rounded-md border border-slate-300 bg-slate-50 px-4 text-base font-bold uppercase tracking-[0.14em] text-slate-950 outline-none"
                      id="code"
                      readOnly
                      value={quizForm.code}
                    />
                    <button
                      className="h-12 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-800 transition hover:border-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isRegeneratingCode}
                      type="button"
                      onClick={() => setIsRegenerateModalOpen(true)}
                    >
                      {isRegeneratingCode ? "Regenerating..." : "Regenerate"}
                    </button>
                  </div>
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
                    value={quizForm.availableFrom}
                    onChange={(event) =>
                      setQuizForm((currentForm) => ({
                        ...currentForm,
                        availableFrom: event.target.value,
                      }))
                    }
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
                    value={quizForm.availableUntil}
                    onChange={(event) =>
                      setQuizForm((currentForm) => ({
                        ...currentForm,
                        availableUntil: event.target.value,
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

                <div>
                  <label
                    className="mb-2 block text-sm font-semibold text-slate-700"
                    htmlFor="max-attempts-per-email"
                  >
                    Max attempts per email
                  </label>
                  <input
                    className="h-12 w-full rounded-md border border-slate-300 px-4 text-base text-slate-950 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                    id="max-attempts-per-email"
                    min="1"
                    type="number"
                    value={quizForm.maxAttemptsPerEmail}
                    onChange={(event) =>
                      setQuizForm((currentForm) => ({
                        ...currentForm,
                        maxAttemptsPerEmail: event.target.value,
                      }))
                    }
                  />
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
    {isRegenerateModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-xl font-bold text-slate-950">
          Regenerate quiz code?
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          The old code will stop working. Students will need the new code to join.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
            type="button"
            onClick={() => setIsRegenerateModalOpen(false)}
          >
            Cancel
          </button>

          <button
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            type="button"
            onClick={handleRegenerateCode}
          >
            Regenerate code
          </button>
        </div>
      </div>
    </div>
  )}
    {isDeleteModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-xl font-bold text-slate-950">
          Delete quiz?
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          This will delete the quiz, its questions, and all related attempts.
          This action cannot be undone.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
            type="button"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            Cancel
          </button>

          <button
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isDeleting}
            type="button"
            onClick={handleDeleteQuiz}
          >
            {isDeleting ? "Deleting..." : "Delete quiz"}
          </button>
        </div>
      </div>
    </div>
  )}
      </section>
    </main>
  );
}
