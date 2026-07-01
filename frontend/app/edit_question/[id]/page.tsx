"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Question = {
  id: number;
  quiz: number;
  text: string;
  points: number;
  choices: Choice[];
};

type Choice = {
  id: number;
  question: number;
  text: string;
  is_correct: boolean;
};

type QuestionForm = {
  text: string;
  points: number;
  choices: Choice[];
};

export default function EditQuestionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionForm>({
    text: "",
    points: 1,
    choices: [],
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

    async function loadQuestion() {
      const token = getToken();

      if (!token) {
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8000/api/questions/${params.id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Could not load question.");
        }

        const data: Question = await response.json();

        if (!shouldUpdate) {
          return;
        }

        setQuestion(data);
        setQuestionForm({
          text: data.text,
          points: data.points,
          choices: data.choices,
        });
        setError("");
      } catch (error) {
        if (shouldUpdate) {
          console.error(error);
          setError("Could not load question.");
        }
      }
    }

    loadQuestion();

    return () => {
      shouldUpdate = false;
    };
  }, [getToken, params.id]);

  async function handleUpdateQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:8000/api/questions/${params.id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: questionForm.text,
            points: questionForm.points,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Could not update question.");
      }

      await Promise.all(
        questionForm.choices.map((choice) =>
          fetch(`http://localhost:8000/api/choices/${choice.id}/`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              text: choice.text,
              is_correct: choice.is_correct,
            }),
          }).then((choiceResponse) => {
            if (!choiceResponse.ok) {
              throw new Error("Could not update choices.");
            }
          }),
        ),
      );

      const data: Question = await response.json();
      setQuestion(data);
      router.push(`/quiz_questions/${data.quiz}`);
    } catch (error) {
      console.error(error);
      setError("Could not update question.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteQuestion() {
    const token = getToken();

    if (!token || !question) {
      return;
    }

    const shouldDelete = window.confirm("Delete this question?");

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:8000/api/questions/${params.id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Could not delete question.");
      }

      router.push(`/quiz_questions/${question.quiz}`);
    } catch (error) {
      console.error(error);
      setError("Could not delete question.");
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
              href={question ? `/quiz_questions/${question.quiz}` : "/quiz_list"}
            >
              Questions
            </Link>
            <button
              className="inline-flex h-11 items-center justify-center rounded-md border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:border-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isDeleting || !question}
              type="button"
              onClick={handleDeleteQuestion}
            >
              {isDeleting ? "Deleting..." : "Delete question"}
            </button>
          </div>
        </header>

        <div className="py-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Edit question
          </p>
          <h1 className="text-4xl font-bold tracking-normal">
            Question details
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-600">
            Update the question text and point value.
          </p>

          {error && (
            <p className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          <form
            className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            onSubmit={handleUpdateQuestion}
          >
            <div className="space-y-5">
              <div>
                <label
                  className="mb-2 block text-sm font-semibold text-slate-700"
                  htmlFor="text"
                >
                  Question text
                </label>
                <textarea
                  className="min-h-32 w-full resize-y rounded-md border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                  id="text"
                  required
                  value={questionForm.text}
                  onChange={(event) =>
                    setQuestionForm((currentForm) => ({
                      ...currentForm,
                      text: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-semibold text-slate-700"
                  htmlFor="points"
                >
                  Points
                </label>
                <input
                  className="h-12 w-full rounded-md border border-slate-300 px-4 text-base text-slate-950 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                  id="points"
                  min="1"
                  required
                  type="number"
                  value={questionForm.points}
                  onChange={(event) =>
                    setQuestionForm((currentForm) => ({
                      ...currentForm,
                      points: Number(event.target.value),
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Choices
                </label>
                <div className="space-y-3">
                  {questionForm.choices.map((choice, index) => (
                    <div className="flex items-center gap-3" key={choice.id}>
                      <input
                        checked={choice.is_correct}
                        className="h-5 w-5 accent-teal-700"
                        name="correct-choice"
                        type="radio"
                        onChange={() =>
                          setQuestionForm((currentForm) => ({
                            ...currentForm,
                            choices: currentForm.choices.map((currentChoice) => ({
                              ...currentChoice,
                              is_correct: currentChoice.id === choice.id,
                            })),
                          }))
                        }
                      />
                      <input
                        className="h-12 w-full rounded-md border border-slate-300 px-4 text-base text-slate-950 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                        placeholder={`Choice ${index + 1}`}
                        required
                        value={choice.text}
                        onChange={(event) =>
                          setQuestionForm((currentForm) => ({
                            ...currentForm,
                            choices: currentForm.choices.map((currentChoice) =>
                              currentChoice.id === choice.id
                                ? { ...currentChoice, text: event.target.value }
                                : currentChoice,
                            ),
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="h-12 w-full rounded-md bg-teal-700 px-5 text-base font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={isSaving || !questionForm.text.trim()}
                type="submit"
              >
                {isSaving ? "Saving..." : "Save question"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
