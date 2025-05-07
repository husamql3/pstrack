import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/prisma/db';
import { env } from '@/config/env.mjs';
import { fetchApprovedLeetcodersWithProblems } from '@/dao/leetcoder.dao';
import type { LeetcoderWithProblem } from '@/types/leetcoders.type';
import { sendAdminNotification } from '@/utils/email/sendAdminNotification'

export const config = { runtime: 'nodejs', maxDuration: '60' };

const BATCH_SIZE = 50;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get('X-Secret-Key');
  console.log("Secret received:", secret);
  if (secret !== env.API_SECRET) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    await db.$connect();
    const { approvedLeetcoders, groupProblems } = await fetchApprovedLeetcodersWithProblems();

    const leetcodersWithProblems: LeetcoderWithProblem[] = approvedLeetcoders
      .map((leetcoder) => {
        const problem = groupProblems.get(leetcoder.group.group_no);
        if (!problem) {
          console.warn(`No problem found for group ${leetcoder.group.group_no} for leetcoder ${leetcoder.email}`);
          return null;
        }
        return {
          ...leetcoder,
          problemDetails: {
            problem_slug: problem.problem_slug,
            difficulty: problem.difficulty,
            topic: problem.topic,
          },
        };
      })
      .filter((lc) => lc !== null) as LeetcoderWithProblem[];

    const batches: LeetcoderWithProblem[][] = [];
    for (let i = 0; i < leetcodersWithProblems.length; i += BATCH_SIZE) {
      batches.push(leetcodersWithProblems.slice(i, i + BATCH_SIZE));
    }

    const processChunkUrl = `${env.NEXT_PUBLIC_SITE_URL}/api/cron/process-email-chunk`;
    const failedToEnqueueBatchesIndices: number[] = [];

    await Promise.all(
      batches.map(async (batch, index) => {
        const res = await fetch(`${env.QSTASH_URL}/v2/publish/${processChunkUrl}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.QSTASH_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ batch }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`Failed to enqueue batch ${index} to ${processChunkUrl}. Status: ${res.status}. Response: ${errorText}`);
          failedToEnqueueBatchesIndices.push(index);
        } else {
          console.log(`Successfully enqueued batch ${index} to ${processChunkUrl}`);
        }
      })
    );

    await sendAdminNotification({
      event: 'DISPATCH_EMAIL_CHUNKS_SUMMARY',
      message: 'Summary of dispatching email chunks to QStash',
      summary: JSON.stringify({
        totalLeetcodersToProcess: leetcodersWithProblems.length,
        totalBatchesCreated: batches.length,
        successfullyEnqueuedBatches: batches.length - failedToEnqueueBatchesIndices.length,
        failedToEnqueueBatchesCount: failedToEnqueueBatchesIndices.length,
        failedToEnqueueBatchesIndices: failedToEnqueueBatchesIndices,
      }),
    });

    return NextResponse.json({
      success: failedToEnqueueBatchesIndices.length === 0,
      totalBatches: batches.length,
      failedBatches: failedToEnqueueBatchesIndices,
    });
  } catch (error) {
    console.error('Dispatcher error:', error);
    await sendAdminNotification({
      event: 'DISPATCH_EMAIL_CHUNKS_CRON_ERROR',
      error: error instanceof Error ? (error.stack || error.message) : JSON.stringify(error),
      message: 'Critical error in /api/cron/dispatch-email-chunks',
    });
    return NextResponse.json({ success: false, error: 'DISPATCH_ERROR' }, { status: 500 });
  } finally {
    await db.$disconnect();
  }
}
