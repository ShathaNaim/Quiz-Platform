"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiUrl } from "@/app/lib/api";

type Choice = {
  id: number;
  text: string;
  is_correct: boolean;
};

type Question = {
  id: number;
  text: string;
  points: number;
  choices: Choice[];
};

export default function QuizPreviewPage() {
  const params = useParams<{ id: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchQuestions() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(
          apiUrl(`/questions/?quiz=${params.id}`),
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch questions");
        }

        const data: Question[] = await response.json();
        setQuestions(data);
      } catch (error) {
        console.error(error);
        setError("Could not load quiz preview.");
      } finally {
        setIsLoading(false);
      }
    }

    if (params.id) {
      fetchQuestions();
    }
  }, [params.id]);

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-6 py-8 text-slate-950">
      <section className="mx-auto max-w-4xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
          Quiz preview
        </p>

        <h1 className="text-4xl font-bold">Participant view</h1>

        {isLoading && <p className="mt-6">Loading questions...</p>}

        {error && <p className="mt-6 text-red-600">{error}</p>}

        <div className="mt-8 space-y-5">
          {questions.map((question, index) => {
  const correctChoice = question.choices.find((choice) => choice.is_correct);

  return (
    <div
      key={question.id}
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <p className="text-sm font-semibold text-teal-700">
        Question {index + 1}
      </p>

      <h2 className="mt-1 text-lg font-semibold">{question.text}</h2>

      <p className="mt-2 text-sm text-slate-600">
        {question.points} points
      </p>

      <div className="mt-5 space-y-2">
        {question.choices.map((choice) => (
          <div
            key={choice.id}
            className={`rounded-md border px-4 py-3 text-sm font-semibold ${
              choice.is_correct
                ? "border-teal-700 bg-teal-50 text-teal-900"
                : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span>{choice.text}</span>

              {choice.is_correct && (
                <span className="rounded-md bg-teal-700 px-2 py-1 text-xs font-bold uppercase tracking-[0.12em] text-white">
                  Correct
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {correctChoice && (
        <p className="mt-4 rounded-md bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800">
          Correct answer: {correctChoice.text}
        </p>
      )}
    </div>
  );
})}
        </div>
      </section>
    </main>
  );
}
