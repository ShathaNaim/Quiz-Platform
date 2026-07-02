"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Question = {
  id: number;
  quiz: number;
  text: string;
  points: number;
};

export default function QuizQuestionsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingQuestionId, setDeletingQuestionId] = useState<number | null>(null);

  const fetchQuestions = useCallback(async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/sign-in");
      return [];
    }

    const response = await fetch(
      `/api/questions/?quiz=${params.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      router.push("/sign-in");
      return [];
    }

    if (!response.ok) {
      throw new Error(`Could not fetch questions. Status: ${response.status}`);
    }

    const data: Question[] = await response.json();
    return data;
  }, [params.id, router]);

  useEffect(() => {
    let shouldUpdate = true;

    fetchQuestions()
      .then((data) => {
        if (shouldUpdate) {
          setQuestions(data);
          setError("");
        }
      })
      .catch((error) => {
        if (shouldUpdate) {
          console.error(error);
          setError(
            error instanceof Error ? error.message : "Could not load questions.",
          );
        }
      })
      .finally(() => {
        if (shouldUpdate) {
          setIsLoading(false);
        }
      });

    return () => {
      shouldUpdate = false;
    };
  }, [fetchQuestions]);

  async function handleDeleteQuestion(questionId: number) {
    const token = localStorage.getItem("access_token");
    
    if (!token) {
      router.push("/sign-in");
      return;
    }
    const shouldDelete = window.confirm(
      "Delete this question?",
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingQuestionId(questionId);
    setError("");

    try {
      const response = await fetch(
        `/api/questions/${questionId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push("/sign-in");
        return;
      }

      if (!response.ok) {
        throw new Error(`Could not delete question. Status: ${response.status}`);
      }

      setQuestions((currentQuestions) =>
        currentQuestions.filter((question) => question.id !== questionId),
      );
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "Could not delete question. Try again.",
      );
    } finally {
      setDeletingQuestionId(null);
    }
  }
 
  
  return (
    <main className="min-h-screen bg-[#f6f8fb] px-6 py-8 text-slate-950 sm:px-10 lg:px-12">
      <section className="mx-auto w-full max-w-5xl">
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
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
              href={`/edit_quiz/${params.id}`}
            >
              Edit quiz
            </Link>
             <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
              href={`/quiz_preview/${params.id}`}
            >
              Preview quiz
            </Link>
          </div>
        </header>

        <div className="py-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
                Quiz questions
              </p>
              <h1 className="text-4xl font-bold tracking-normal">Questions</h1>
              <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-600">
                Review the questions for this quiz and add new ones.
              </p>
            </div>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              href={`/create_question_page?quizId=${params.id}`}
            >
              Add question
            </Link>
          </div>
          

          {isLoading && (
            <p className="mt-10 rounded-lg border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm">
              Loading questions...
            </p>
          )}

          {error && (
            <p className="mt-10 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          {!isLoading && !error && questions.length === 0 && (
            <p className="mt-10 rounded-lg border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm">
              No questions yet.
            </p>
          )}
          

          {!isLoading && !error && questions.length > 0 && (
            <div className="mt-10 space-y-3">
              {questions.map((question, index) => (
                <article
                  className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between"
                  key={question.id}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-teal-700">
                      Question {index + 1}
                    </p>
                    <h2 className="mt-2 text-lg font-bold text-slate-950">
                      {question.text}
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      {question.points}{" "}
                      {question.points === 1 ? "point" : "points"}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                    <Link
                      className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
                      href={`/edit_question/${question.id}`}
                    >
                      Edit question
                    </Link>

                    <button
                      className="inline-flex h-11 items-center justify-center rounded-md border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:border-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={deletingQuestionId === question.id}
                      type="button"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      {deletingQuestionId === question.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
                
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
