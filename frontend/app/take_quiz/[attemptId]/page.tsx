"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Choice = {
  id: number;
  text: string;
};

type Question = {
  id: number;
  text: string;
  points: number;
  order: number;
  choices: Choice[];
};

type SubmitResult = {
  attempt: number;
  status: string;
  show_result_to_student: boolean;
  score?: number;
  total_points?: number;
  submitted_automatically?: boolean;
  automatic_reason?: "events" | "timer";
};

type AttemptDetail = {
  id: number;
  started_at: string;
  submitted_at: string | null;
  status: string;
  time_limit: number | null;
};

type AttemptEventResponse = {
  should_auto_submit: boolean;
  attempt_status: string;
  show_result_to_student: boolean;
  score?: number;
  total_points?: number;
  submitted_automatically?: boolean;
};

function getRemainingSeconds(attemptDetail: AttemptDetail) {
  if (!attemptDetail.time_limit) {
    return null;
  }

  const startedAt = new Date(attemptDetail.started_at).getTime();
  const endsAt = startedAt + attemptDetail.time_limit * 60 * 1000;

  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
}

export default function TakeQuizPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params.attemptId;
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [attemptDetail, setAttemptDetail] = useState<AttemptDetail | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const selectedAnswersRef = useRef(selectedAnswers);
  const submitResultRef = useRef(submitResult);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    selectedAnswersRef.current = selectedAnswers;
  }, [selectedAnswers]);

  useEffect(() => {
    submitResultRef.current = submitResult;
  }, [submitResult]);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    async function fetchQuizData() {
      try {
        setIsLoading(true);
        setError("");

        const detailResponse = await fetch(
          `http://localhost:8000/api/attempts/${attemptId}/`
        );

        if (!detailResponse.ok) {
          throw new Error("Could not load quiz attempt.");
        }

        const detailData: AttemptDetail = await detailResponse.json();
        setAttemptDetail(detailData);
        setTimeRemaining(getRemainingSeconds(detailData));

        if (detailData.status !== "in_progress") {
          setSubmitResult({
            attempt: Number(attemptId),
            status: detailData.status,
            show_result_to_student: false,
          });
          setQuestions([]);
          return;
        }

        const questionsResponse = await fetch(
          `http://localhost:8000/api/attempts/${attemptId}/questions/`
        );

        if (!questionsResponse.ok) {
          throw new Error("Could not load quiz questions.");
        }

        const data: Question[] = await questionsResponse.json();

        setQuestions(data);
      } catch (error) {
        console.error(error);
        setError("Could not load quiz questions.");
      } finally {
        setIsLoading(false);
      }
    }

    if (attemptId) {
      fetchQuizData();
    }
  }, [attemptId]);

  function handleSelectAnswer(questionId: number, choiceId: number) {
    setSelectedAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: choiceId,
    }));
  }

  const submitQuiz = useCallback(
    async (submittedAutomatically = false, automaticReason?: "events" | "timer") => {
      if (submitResultRef.current || isSubmittingRef.current) {
        return;
      }

      try {
        isSubmittingRef.current = true;
        setIsSubmitting(true);
        setError("");
        const answers = Object.entries(selectedAnswersRef.current).map(
          ([questionId, choiceId]) => ({
            question: Number(questionId),
            selected_choice: choiceId,
          })
        );

        const response = await fetch(
          `http://localhost:8000/api/attempts/${attemptId}/submit/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ answers }),
          }
        );
        if (!response.ok) {
          throw new Error("Could not submit quiz.");
        }

        const data: SubmitResult = await response.json();
        setSubmitResult({
          ...data,
          submitted_automatically:
            submittedAutomatically || data.submitted_automatically,
          automatic_reason: automaticReason,
        });
      } catch (error) {
        console.error(error);
        setError("Could not submit quiz.");
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [attemptId]
  );

  useEffect(() => {
    if (!attemptDetail?.time_limit || submitResult) {
      return;
    }

    const detail = attemptDetail;

    function updateRemainingTime() {
      const remainingSeconds = getRemainingSeconds(detail);

      if (remainingSeconds === null) {
        return;
      }

      setTimeRemaining(remainingSeconds);

      if (remainingSeconds === 0) {
        submitQuiz(true, "timer");
      }
    }

    updateRemainingTime();
    const intervalId = window.setInterval(updateRemainingTime, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [attemptDetail, submitQuiz, submitResult]);

  useEffect(() => {
    async function sendAttemptEvent(eventType: string) {
      const answers = Object.entries(selectedAnswersRef.current).map(
        ([questionId, choiceId]) => ({
          question: Number(questionId),
          selected_choice: choiceId,
        })
      );

      const response = await fetch("http://localhost:8000/api/attempt-events/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attempt: Number(attemptId),
          event_type: eventType,
          answers,
        }),
      });

      if (!response.ok) {
        return;
      }

      const data: AttemptEventResponse = await response.json();

      if (data.should_auto_submit) {
        setSubmitResult({
          attempt: Number(attemptId),
          status: data.attempt_status,
          show_result_to_student: data.show_result_to_student,
          score: data.score,
          total_points: data.total_points,
          submitted_automatically: data.submitted_automatically,
          automatic_reason: "events",
        });
      }
    }

    function handleVisibilityChange() {
      if (document.hidden && !submitResultRef.current) {
        sendAttemptEvent("tab_switch");
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [attemptId]);

  function handleSubmitQuiz() {
    submitQuiz();
  }

  const formattedTimeRemaining =
    timeRemaining === null
      ? null
      : `${Math.floor(timeRemaining / 60)}:${String(timeRemaining % 60).padStart(
          2,
          "0"
        )}`;
  const currentQuestion =
    questions[Math.min(currentQuestionIndex, Math.max(questions.length - 1, 0))];
  const answeredCount = questions.filter((question) => selectedAnswers[question.id]).length;
  const currentQuestionAnswered = currentQuestion
    ? Boolean(selectedAnswers[currentQuestion.id])
    : false;


  return (
    <main className="min-h-screen bg-[#f6f8fb] px-6 py-8 text-slate-950 sm:px-10 lg:px-12">
      <section className="mx-auto w-full max-w-6xl">
        <header className="flex items-center justify-between">
          <Link className="text-xl font-bold tracking-normal" href="/">
            QuizPlatform
          </Link>
          {formattedTimeRemaining && !submitResult && (
            <div className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800">
              Time: {formattedTimeRemaining}
            </div>
          )}
        </header>

        <div className="py-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Take quiz
          </p>
          <h1 className="text-4xl font-bold tracking-normal">
            Attempt #{params.attemptId}
          </h1>

          {isLoading && (
            <p className="mt-6 rounded-md bg-white px-4 py-3 text-sm font-semibold text-slate-700">
              Loading questions...
            </p>
          )}

          {error && (
            <p className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          {submitResult && (
            <div className="mt-6 rounded-md border border-teal-100 bg-teal-50 px-4 py-4 text-sm font-semibold text-teal-800">
              <p>
                {submitResult.submitted_automatically
                  ? submitResult.automatic_reason === "timer"
                    ? "Quiz submitted automatically because time finished."
                    : "Quiz submitted automatically after the event limit."
                  : "Quiz submitted successfully."}
              </p>
              {submitResult.show_result_to_student && (
                <p className="mt-2">
                  Score: {submitResult.score}/{submitResult.total_points}
                </p>
              )}
            </div>
          )}

          {!isLoading && !error && currentQuestion && (
            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_18rem]">
              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-t-4 border-teal-700 p-6">
                  <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-teal-700">
                        Question {currentQuestionIndex + 1} of {questions.length}
                      </p>
                      <h2 className="mt-2 text-xl font-semibold leading-8 text-slate-950">
                        {currentQuestion.text}
                      </h2>
                    </div>
                    <div className="shrink-0 space-y-2 text-sm font-semibold text-slate-700">
                      <p className="rounded-md bg-slate-100 px-3 py-1">
                        {currentQuestion.points} pts
                      </p>
                      <p
                        className={`rounded-md px-3 py-1 ${
                          currentQuestionAnswered
                            ? "bg-teal-50 text-teal-800"
                            : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {currentQuestionAnswered ? "Answered" : "Not yet answered"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {currentQuestion.choices.map((choice) => {
                      const isSelected = selectedAnswers[currentQuestion.id] === choice.id;

                      return (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() => handleSelectAnswer(currentQuestion.id, choice.id)}
                          disabled={Boolean(submitResult)}
                          className={`block w-full rounded-md border px-4 py-3 text-left text-sm font-semibold transition disabled:cursor-not-allowed ${
                            isSelected
                              ? "border-teal-700 bg-teal-700 text-white"
                              : "border-slate-200 bg-white text-slate-900 hover:border-teal-700 hover:bg-teal-50"
                          }`}
                        >
                          {choice.text}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 p-6">
                  <button
                    type="button"
                    disabled={currentQuestionIndex === 0 || Boolean(submitResult)}
                    onClick={() => setCurrentQuestionIndex((index) => Math.max(index - 1, 0))}
                    className="h-11 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-900 transition hover:border-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={
                      currentQuestionIndex === questions.length - 1 ||
                      Boolean(submitResult)
                    }
                    onClick={() =>
                      setCurrentQuestionIndex((index) =>
                        Math.min(index + 1, questions.length - 1)
                      )
                    }
                    className="h-11 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Next
                  </button>
                </div>
              </div>

              <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:self-start">
                <h2 className="text-lg font-bold text-slate-950">Quiz navigation</h2>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  {answeredCount} of {questions.length} answered
                </p>

                <div className="mt-5 grid grid-cols-5 gap-2">
                  {questions.map((question, index) => {
                    const isCurrent = index === currentQuestionIndex;
                    const isAnswered = Boolean(selectedAnswers[question.id]);

                    return (
                      <button
                        key={question.id}
                        type="button"
                        onClick={() => setCurrentQuestionIndex(index)}
                        disabled={Boolean(submitResult)}
                        className={`h-10 rounded-md border text-sm font-semibold transition disabled:cursor-not-allowed ${
                          isCurrent
                            ? "border-teal-700 bg-teal-700 text-white"
                            : isAnswered
                              ? "border-teal-200 bg-teal-50 text-teal-800"
                              : "border-slate-200 bg-white text-slate-900 hover:border-teal-700"
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting || Boolean(submitResult) || questions.length === 0}
                  className="mt-6 h-12 w-full rounded-md bg-teal-700 px-5 text-base font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSubmitting ? "Submitting..." : "Finish attempt"}
                </button>
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
