"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OldCreateQuizDetailRoute() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/edit_quiz/${params.id}`);
  }, [params.id, router]);

  return null;
}
