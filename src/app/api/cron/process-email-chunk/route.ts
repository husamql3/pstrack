import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { sendDailyProblemEmail } from '@/utils/email/sendDailyProblemEmail';
import { env } from '@/config/env.mjs';
import type { LeetcoderWithProblem } from '@/types/leetcoders.type';
import { sendAdminNotification } from '@/utils/email/sendAdminNotification';

export const config = { runtime: 'nodejs', maxDuration: '60' };

async function emailChunkHandler(req: NextRequest): Promise<NextResponse> {
  try {
    const { batch }: { batch: LeetcoderWithProblem[] } = await req.json();

    let successCount = 0;
    let failureCount = 0;

    for (const leetcoder of batch) {
      try {
        await sendDailyProblemEmail({
          problem_slug: leetcoder.problemDetails.problem_slug,
          difficulty: leetcoder.problemDetails.difficulty,
          topic: leetcoder.problemDetails.topic,
          group_no: leetcoder.group.group_no.toString(),
          email: leetcoder.email,
        });
        console.log(`Sent email to ${leetcoder.email}`);
        successCount++;
      } catch (error) {
        console.error(`Failed to send email to ${leetcoder.email}:`, error);
        failureCount++;
        await sendAdminNotification({
          event: 'PROCESS_EMAIL_CHUNK_FAILURE',
          email: leetcoder.email,
          error: error instanceof Error ? (error.stack || error.message) : JSON.stringify(error),
          message: `Failed to send daily problem email to ${leetcoder.email} in chunk processing.`,
        });
      }
    }

    return NextResponse.json({ success: true, successCount, failureCount });
  } catch (error) {
    console.error('Worker error:', error);
    await sendAdminNotification({
      event: 'PROCESS_EMAIL_CHUNK_CRON_ERROR',
      error: error instanceof Error ? (error.stack || error.message) : JSON.stringify(error),
      message: 'Critical error in /api/cron/process-email-chunk',
    });
    return NextResponse.json({ success: false, error: 'WORKER_ERROR' }, { status: 500 });
  }
}

export const POST = verifySignatureAppRouter(emailChunkHandler, {
  currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
});
