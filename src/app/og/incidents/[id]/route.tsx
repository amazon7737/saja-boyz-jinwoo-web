import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ImageResponse } from 'next/og';

import { loadDetail } from '@/app/incidents/[id]/load-detail';
import {
  articleOgDetails,
  articleOgTitleLines,
} from '@/features/article-detail/model/article-og';

export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'no-store' };
const renderTimeoutMs = 2000;

async function readPngWithinDeadline(response: Response) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      response.arrayBuffer(),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new Error('image render timed out')),
          renderTimeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: input } = await params;
  const match = /^([a-f0-9]{64})\.png$/.exec(input);

  if (!match) return new Response(null, { status: 404, headers: noStore });

  const result = await loadDetail(match[1]);

  if (result.status === 'not-found')
    return new Response(null, { status: 404, headers: noStore });
  if (result.status === 'error')
    return new Response(null, {
      status: 503,
      headers: { ...noStore, 'Retry-After': '60' },
    });

  const details = articleOgDetails(result.item, result.apiOrigin);

  if (!details) return new Response(null, { status: 404, headers: noStore });

  const versions = new URL(request.url).searchParams.getAll('v');

  if (versions.length !== 1 || versions[0] !== details.version) {
    return new Response(null, {
      status: 307,
      headers: { ...noStore, Location: details.image.url },
    });
  }

  try {
    const [font, background] = await Promise.all([
      readFile(join(process.cwd(), 'public/fonts/Pretendard-Bold.otf')),
      readFile(join(process.cwd(), 'public/og/site-v2.png')),
    ]);
    const response = new ImageResponse(
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        {/* The Figma image stays intact as the shared-card background. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${background.toString('base64')}`}
          alt=""
          width={1200}
          height={630}
        />
        <div
          style={{
            position: 'absolute',
            left: 60,
            top: 155,
            width: 650,
            height: 245,
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px 12px 0',
          }}
        >
          {articleOgTitleLines(details.title).map((line, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                fontSize: 40,
                lineHeight: 1.2,
                color: '#0f172a',
                fontFamily: 'Pretendard',
                fontWeight: 700,
              }}
            >
              {line}
            </div>
          ))}
          {details.displayHostname && (
            <div
              style={{
                display: 'flex',
                fontSize: 20,
                lineHeight: 1.25,
                color: '#64748b',
                marginTop: 12,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >{`출처: ${details.displayHostname}`}</div>
          )}
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Pretendard',
            data: Uint8Array.from(font).buffer,
            weight: 700,
            style: 'normal',
          },
        ],
      },
    );

    // Read the generated stream before returning so renderer failures are not cached as images.
    if (!response.ok) throw new Error('image generation failed');
    const png = await readPngWithinDeadline(response);

    return new Response(png, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response(null, {
      status: 307,
      headers: { ...noStore, Location: '/og/site-v2.png' },
    });
  }
}
