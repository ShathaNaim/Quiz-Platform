'use client';

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CreateQuestionProps = {
  quizId: string;
  onQuestionCreated?: () => void;
};

export default function CreateQuestion({ quizId, onQuestionCreated }: CreateQuestionProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [points, setPoints] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/sign-in");
      return;
    }

    const trimmedOptions = options.map((option) => option.trim());

    if (!text.trim() || trimmedOptions.some((option) => !option)) {
      setError("Question text and all options are required.");
      setIsSubmitting(false);
      return;
    }

    try {
      const questionResponse = await fetch("/api/questions/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quiz: Number(quizId),
          text: text.trim(),
          points,
        }),
      });

      if (!questionResponse.ok) {
        throw new Error("Could not create question.");
      }

      const question = await questionResponse.json();
      router.push(`/quiz_questions/${quizId}`);

      await Promise.all(
        trimmedOptions.map((option, index) =>
          fetch("/api/choices/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              question: question.id,
              text: option,
              is_correct: index === correctOptionIndex,
            }),
          }).then((response) => {
            if (!response.ok) {
              throw new Error("Could not create choices.");
            }
          }),
        ),
      );

      setText("");
      setOptions(["", "", "", ""]);
      setCorrectOptionIndex(0);
      setPoints(1);
      onQuestionCreated?.();
      router.refresh();
    } catch (error) {
      console.error(error);
      setError("Could not create question. Check the required fields and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Question builder
          </p>
          <h1 className="text-3xl font-bold tracking-normal text-slate-950">
            Add a question
          </h1>
        </div>
        <Link
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-900 hover:bg-white"
          href="/quiz_list"
        >
          Quiz list
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <form
        onSubmit={handleCreateQuestion}
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="text"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Question text
            </label>
            <input
              type="text"
              id="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="h-12 w-full rounded-md border border-slate-300 px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Options
            </label>
            {options.map((option, index) => (
              <div className="mb-3 flex items-center gap-3" key={index}>
                <input
                  checked={correctOptionIndex === index}
                  className="h-5 w-5 accent-teal-700"
                  name="correct-option"
                  type="radio"
                  onChange={() => setCorrectOptionIndex(index)}
                />
                <input
                  type="text"
                  value={option}
                  placeholder={`Option ${index + 1}`}
                  onChange={(event) => {
                    const newOptions = [...options];
                    newOptions[index] = event.target.value;
                    setOptions(newOptions);
                  }}
                  className="h-12 w-full rounded-md border border-slate-300 px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                  required
                />
              </div>
            ))}
          </div>

          <div>
            <label
              htmlFor="points"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Points
            </label>
            <input
              type="number"
              id="points"
              value={points}
              onChange={(event) => setPoints(Number(event.target.value))}
              className="h-12 w-full rounded-md border border-slate-300 px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
              min="1"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !text.trim()}
            className="h-12 w-full rounded-md bg-teal-700 px-5 text-base font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? "Creating..." : "Create question"}
          </button>
        </div>
      </form>
    </div>
  );
}
