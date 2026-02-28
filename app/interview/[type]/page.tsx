"use client";

import { Suspense } from "react";
import InterviewRoom from "@/components/interview-room";
import { useSearchParams } from "next/navigation";

export default function InterviewPage() {
  const searchParams = useSearchParams();
  const interviewType = searchParams.get("type") || "technical"; // Default to technical if not provided

  return (
    <Suspense fallback={<div>Loading Interview...</div>}>
      <InterviewRoom interviewType={interviewType} />
    </Suspense>
  );
}
