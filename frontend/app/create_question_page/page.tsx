"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CreateQuestion from "../components/create_question";

function CreateQuestionContent() {
  const searchParams = useSearchParams();
  const quizId = searchParams.get("quizId");

  if (!quizId) {
    return <p>Missing quiz ID.</p>;
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-6 py-8 text-slate-950 sm:px-10 lg:px-12">
      <div className="mx-auto w-full max-w-5xl gap-8">
        <CreateQuestion quizId={quizId} />
      </div>
    </main>
  );
}

export default function CreateQuestionPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f6f8fb] px-6 py-8 text-slate-950 sm:px-10 lg:px-12">
          <div className="mx-auto w-full max-w-5xl rounded-lg border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600 shadow-sm">
            Loading question form...
          </div>
        </main>
      }
    >
      <CreateQuestionContent />
    </Suspense>
  );
}
