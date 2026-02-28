import { Suspense } from 'react';
import ScheduleInterviewClient from '@/components/schedule-interviews-client';

export default function ScheduleInterviewPage() {
  return (
    <Suspense fallback={<div>Loading schedule...</div>}>
      <ScheduleInterviewClient />
    </Suspense>
  );
}
