'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiUrl } from "@/app/lib/api";
export default function QuizAttemptsPage() {
    type Attempt = {
        id: number;
        quiz: number;
        participant_name: string;
        participant_email: string;
        status: string;
        score: number | null;
        total_points: number | null;
        started_at: string;
        submitted_at: string | null;
        tab_switch_count: number;
        page_refresh_count: number;
        fullscreen_exit_count: number;
    };
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const params = useParams<{ id: string }>();
    const submittedCount = attempts.filter((attempt) => attempt.status === "submitted").length;
    const averageScore =
        submittedCount === 0
            ? null
            : attempts
                .filter((attempt) => attempt.status === "submitted")
                .reduce((total, attempt) => total + Number(attempt.score ?? 0), 0) /
              submittedCount;

    useEffect(() => {
        async function fetchAttempts() {
            try {
                setIsLoading(true);
                setError("");
                const response = await fetch(
                    apiUrl(`/attempts/?quiz=${params.id}`),
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem(
                                "access_token"
                            )}`,
                        },
                    }
                );
                if (!response.ok) {
                    throw new Error("Failed to fetch quiz attempts.");
                }

                const data: Attempt[] = await response.json();
                setAttempts(data);
            } catch (error) {
                console.error(error);
                setError("Failed to fetch quiz attempts.");
            } finally {
                setIsLoading(false);
            }
        }

        fetchAttempts();
    }, [params.id]);
    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
            <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-12">
                <header className="flex items-center justify-between">
                    <Link className="text-xl font-bold tracking-normal" href="/">
                        QuizPlatform
                    </Link>
                    <Link
                        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-900 hover:bg-white"
                        href="/quiz_list"
                    >
                        Back to quizzes
                    </Link>
                </header>

                <div className="py-10">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
                        Results
                    </p>
                    <h1 className="text-4xl font-bold tracking-normal">Quiz attempts</h1>
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                        <div className="min-h-28 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                                Attempts
                            </p>
                            <p className="mt-4 text-4xl font-bold text-slate-950">
                                {attempts.length}
                            </p>
                        </div>
                        <div className="min-h-28 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                                Submitted
                            </p>
                            <p className="mt-4 text-4xl font-bold text-slate-950">
                                {submittedCount}
                            </p>
                        </div>
                        <div className="min-h-28 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                                Avg score
                            </p>
                            <p className="mt-4 text-4xl font-bold text-slate-950">
                                {averageScore === null ? "N/A" : averageScore.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

            {isLoading ? (
                <p className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-600 shadow-sm">
                    Loading attempts...
                </p>
            ) : error ? (
                <p className="rounded-lg border border-red-100 bg-red-50 p-5 text-sm font-semibold text-red-700">
                    {error}
                </p>
            ) : attempts.length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-600 shadow-sm">
                    No attempts found for this quiz.
                </p>
            ) : (
                <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                    <table className="w-full min-w-[1100px] border-collapse text-left text-sm text-slate-600">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-5 py-4 font-semibold text-slate-900">ID</th>
                                <th className="px-5 py-4 font-semibold text-slate-900">Participant</th>
                                <th className="px-5 py-4 font-semibold text-slate-900">Email</th>
                                <th className="px-5 py-4 font-semibold text-slate-900">Status</th>
                                <th className="px-5 py-4 font-semibold text-slate-900">Score</th>
                                <th className="px-5 py-4 font-semibold text-slate-900">Events</th>
                                <th className="px-5 py-4 font-semibold text-slate-900">Started</th>
                                <th className="px-5 py-4 font-semibold text-slate-900">Submitted</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 border-t border-slate-100">
                            {attempts.map((attempt) => (
                                <tr key={attempt.id} className="transition hover:bg-slate-50">
                                    <td className="px-5 py-4 font-semibold text-slate-900">{attempt.id}</td>
                                    <td className="px-5 py-4 font-semibold text-slate-900">
                                        {attempt.participant_name}
                                    </td>
                                    <td className="px-5 py-4">{attempt.participant_email || "N/A"}</td>
                                    <td className="px-5 py-4">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                                                attempt.status === "submitted"
                                                    ? "bg-teal-50 text-teal-700"
                                                    : "bg-amber-50 text-amber-700"
                                            }`}
                                        >
                                            {attempt.status.replace("_", " ")}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-slate-900">
                                        {attempt.score !== null ? Number(attempt.score).toFixed(2) : "N/A"}
                                        <span className="text-slate-500">
                                            {" / "}
                                            {attempt.total_points !== null ? attempt.total_points : "N/A"}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-wrap gap-2">
                                            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                                                Tabs {attempt.tab_switch_count}
                                            </span>
                                            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                                                Refresh {attempt.page_refresh_count}
                                            </span>
                                            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                                                Fullscreen {attempt.fullscreen_exit_count}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">{new Date(attempt.started_at).toLocaleString()}</td>
                                    <td className="px-5 py-4">{attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : "N/A"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}
            </section>
        </main>
    );
}
