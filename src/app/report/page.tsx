'use client';

import Link from 'next/link';
import { ErrorBoundary, useErrorBoundary } from '@suspensive/react';
import { useEffect, useRef, useState, type FormEvent } from 'react';

import { categoryLabels } from '@/features/incidents/model/labels';

const requiredFields = [
  'category',
  'occurredAt',
  'title',
  'location',
  'description',
] as const;

type RequiredField = (typeof requiredFields)[number];

const textLimits: Partial<Record<RequiredField, number>> = {
  title: 100,
  location: 200,
  description: 5000,
};

const attachmentTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
];

function getReportEndpoint() {
  try {
    const baseUrl = new URL(process.env.NEXT_PUBLIC_REPORT_API_BASE_URL ?? '');

    if (baseUrl.protocol !== 'https:' || baseUrl.username || baseUrl.password) {
      return null;
    }

    return new URL('/reports', baseUrl);
  } catch {
    return null;
  }
}

function isReceiptTimestamp(value: string) {
  const timestamp =
    /^(\d{4})-(\d{2})-(\d{2})[Tt](?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:[Zz]|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(
      value,
    );

  if (!timestamp) return false;

  const year = Number(timestamp[1]);
  const month = Number(timestamp[2]);
  const day = Number(timestamp[3]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthLengths = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return (
    month >= 1 && month <= 12 && day >= 1 && day <= monthLengths[month - 1]
  );
}

const uncertainReceiptMessage =
  '접수 여부를 확인하지 못했어요. 다시 시도해 주세요';

type ReportRequest = {
  controller: AbortController;
  deadline?: ReturnType<typeof setTimeout>;
};

function SubmissionError({ message }: { message: string }) {
  const { setError } = useErrorBoundary();

  useEffect(() => {
    if (message) setError(new Error(message));
  }, [message, setError]);

  return null;
}

export default function ReportPage() {
  const [errors, setErrors] = useState<Partial<Record<RequiredField, string>>>(
    {},
  );
  const [confirmedReportId, setConfirmedReportId] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInFlight = useRef(false);
  const activeRequest = useRef<ReportRequest | null>(null);
  const submissionBoundary = useRef<{ reset: () => void }>(null);
  const retryRequest = useRef<{
    key: string;
    fields: string;
    attachments: File[];
  } | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState('');
  const formLocked = isSubmitting || Boolean(confirmedReportId);

  useEffect(() => {
    return () => {
      const request = activeRequest.current;

      activeRequest.current = null;

      if (request) {
        clearTimeout(request.deadline);
        request.controller.abort();
      }
    };
  }, []);

  async function checkInput(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submissionInFlight.current || confirmedReportId) return;

    const form = event.currentTarget;
    const values = new FormData(form);
    const nextErrors: Partial<Record<RequiredField, string>> = {};

    for (const name of requiredFields) {
      const value = String(values.get(name) ?? '').trim();
      const limit = textLimits[name];

      if (!value) {
        nextErrors[name] = '필수 항목이에요';
      } else if (limit !== undefined && value.length > limit) {
        nextErrors[name] = `${limit}자를 초과했어요`;
      }
    }

    const firstInvalid = requiredFields.find((name) => nextErrors[name]);

    setErrors(nextErrors);
    setAttachmentError('');
    setConfirmedReportId('');
    setSubmissionError('');
    submissionBoundary.current?.reset();

    if (firstInvalid !== undefined) {
      const firstField = form.elements.namedItem(firstInvalid);

      if (firstField instanceof HTMLElement) firstField.focus();

      return;
    }

    const endpoint = getReportEndpoint();

    if (endpoint === null) {
      setSubmissionError('제보 접수 연결이 준비되지 않았어요');

      return;
    }

    submissionInFlight.current = true;
    setIsSubmitting(true);

    const request: ReportRequest = { controller: new AbortController() };

    activeRequest.current = request;

    try {
      const body = new FormData();

      for (const name of requiredFields) {
        const value = String(values.get(name) ?? '').trim();

        if (name === 'occurredAt') {
          body.append('occurred_at', new Date(`${value}+09:00`).toISOString());
        } else {
          body.append(name, value);
        }
      }

      const fields = JSON.stringify(Array.from(body.entries()));

      for (const file of attachments) body.append('attachments', file);

      const previousRequest = retryRequest.current;
      const requestKey =
        previousRequest?.fields === fields &&
        previousRequest.attachments.length === attachments.length &&
        attachments.every(
          (file, index) => file === previousRequest.attachments[index],
        )
          ? previousRequest.key
          : crypto.randomUUID();

      retryRequest.current = { key: requestKey, fields, attachments };

      request.deadline = setTimeout(() => request.controller.abort(), 60000);

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'omit',
        headers: { 'Idempotency-Key': requestKey },
        body,
        signal: request.controller.signal,
      }).catch(() => {
        if (activeRequest.current === request) {
          setSubmissionError(uncertainReceiptMessage);
        }

        return null;
      });

      if (response === null || activeRequest.current !== request) return;

      let receipt: unknown;

      try {
        receipt = await response.json();
      } catch {
        if (activeRequest.current === request) {
          setSubmissionError(uncertainReceiptMessage);
        }

        return;
      }

      if (activeRequest.current !== request) return;

      if (
        (response.status !== 200 && response.status !== 201) ||
        typeof receipt !== 'object' ||
        receipt === null ||
        !('report_id' in receipt) ||
        typeof receipt.report_id !== 'string' ||
        !/^[a-f0-9]{32}$/.test(receipt.report_id) ||
        !('status' in receipt) ||
        receipt.status !== 'pending' ||
        !('received_at' in receipt) ||
        typeof receipt.received_at !== 'string' ||
        !isReceiptTimestamp(receipt.received_at)
      ) {
        setSubmissionError(
          response.status >= 500 ||
            (response.status >= 200 && response.status < 300)
            ? uncertainReceiptMessage
            : '제보를 접수하지 못했어요. 다시 시도해 주세요',
        );

        return;
      }

      retryRequest.current = null;
      setConfirmedReportId(receipt.report_id);
    } catch {
      if (activeRequest.current === request) {
        setSubmissionError('제보를 접수하지 못했어요. 다시 시도해 주세요');
      }
    } finally {
      clearTimeout(request.deadline);

      if (activeRequest.current === request) {
        activeRequest.current = null;
        submissionInFlight.current = false;
        setIsSubmitting(false);
      }
    }
  }

  function errorAttributes(name: RequiredField) {
    return {
      'aria-invalid': Boolean(errors[name]) || undefined,
      'aria-describedby': errors[name] ? `report-${name}-error` : undefined,
    };
  }

  function fieldError(name: RequiredField) {
    return errors[name] ? (
      <p
        id={`report-${name}-error`}
        className="m-0 text-[13px]/[normal] text-brand"
      >
        {errors[name]}
      </p>
    ) : null;
  }

  return (
    <section className="bg-surface text-text">
      <header className="grid grid-cols-[32px_1fr_32px] items-center border-0 border-b border-solid border-border px-4 py-3">
        <h1 className="col-start-2 m-0 text-center text-[16px]/[normal] font-extrabold">
          제보하기
        </h1>
        <Link
          href="/"
          aria-label="제보 닫기"
          className="-m-1.5 grid size-11 place-items-center rounded-full text-[14px]/[normal]"
        >
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-full bg-slate-100"
          >
            ✕
          </span>
        </Link>
      </header>
      <form
        className="flex min-h-[calc(100dvh-57px)] flex-col"
        noValidate
        onSubmit={checkInput}
      >
        <div className="flex flex-col gap-5 p-4">
          <div className="flex min-w-0 flex-col gap-2">
            <label
              htmlFor="report-category"
              className="text-[13px]/[normal] font-bold text-muted"
            >
              카테고리 선택
            </label>
            <div className="relative">
              <select
                className="box-border h-[43px] w-full min-w-0 appearance-none rounded-[10px] border border-solid border-border bg-background py-3 pr-11 pl-3.5 text-[14px]/[17px] text-text invalid:text-slate-400"
                id="report-category"
                name="category"
                disabled={formLocked}
                required
                defaultValue=""
                {...errorAttributes('category')}
              >
                <option value="" disabled>
                  카테고리를 선택하세요
                </option>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[12px]/[normal] text-muted"
              >
                ▼
              </span>
            </div>
            {fieldError('category')}
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <label
              htmlFor="report-occurred-at"
              className="text-[13px]/[normal] font-bold text-muted"
            >
              발생 날짜 및 시간 (한국시간)
            </label>
            <input
              className="box-border h-[43px] w-full min-w-0 rounded-[10px] border border-solid border-border bg-background px-3.5 py-3 text-[14px]/[17px] text-muted"
              id="report-occurred-at"
              name="occurredAt"
              disabled={formLocked}
              {...errorAttributes('occurredAt')}
              type="datetime-local"
              required
            />
            {fieldError('occurredAt')}
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <label
              htmlFor="report-title"
              className="text-[13px]/[normal] font-bold text-muted"
            >
              제보 제목
            </label>
            <input
              className="box-border h-[43px] w-full min-w-0 appearance-none rounded-[10px] border border-solid border-border bg-background px-3.5 py-3 text-[14px]/[17px] text-text placeholder:text-slate-400"
              id="report-title"
              name="title"
              disabled={formLocked}
              {...errorAttributes('title')}
              placeholder="사건 제목을 입력하세요"
              required
            />
            {fieldError('title')}
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <label
              htmlFor="report-location"
              className="text-[13px]/[normal] font-bold text-muted"
            >
              발생 위치
            </label>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[14px]/[17px]"
              >
                📍
              </span>
              <input
                className="box-border h-[43px] w-full min-w-0 appearance-none rounded-[10px] border border-solid border-border bg-background py-3 pr-3.5 pl-10 text-[14px]/[17px] text-text placeholder:text-slate-400"
                id="report-location"
                name="location"
                disabled={formLocked}
                {...errorAttributes('location')}
                placeholder="위치를 입력하세요"
                required
              />
            </div>
            {fieldError('location')}
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <label
              htmlFor="report-description"
              className="text-[13px]/[normal] font-bold text-muted"
            >
              상세내용
            </label>
            <textarea
              className="box-border h-[120px] w-full min-w-0 resize-y appearance-none rounded-[10px] border border-solid border-border bg-background p-3.5 text-[14px]/[17px] text-text placeholder:text-slate-400"
              id="report-description"
              name="description"
              disabled={formLocked}
              {...errorAttributes('description')}
              placeholder="상세 내용을 입력하세요"
              required
            />
            {fieldError('description')}
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <label
              htmlFor="report-attachments"
              className="text-[13px]/[normal] font-bold text-muted"
            >
              사진/동영상 첨부
            </label>
            <div className="relative flex h-[100px] flex-col items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-slate-400 bg-background p-5 text-[13px]/[normal] font-bold text-muted focus-within:outline-[3px] focus-within:outline-solid focus-within:outline-brand focus-within:outline-offset-4">
              <span
                aria-hidden="true"
                className="text-[18px]/[normal] font-normal"
              >
                ➕
              </span>
              <span>이미지 첨부</span>
              <input
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                id="report-attachments"
                name="attachments"
                type="file"
                disabled={formLocked}
                multiple
                accept={attachmentTypes.join(',')}
                aria-invalid={Boolean(attachmentError) || undefined}
                aria-describedby={
                  attachmentError ? 'report-attachments-error' : undefined
                }
                onChange={(event) => {
                  if (submissionInFlight.current || confirmedReportId) return;

                  const selected = Array.from(event.currentTarget.files ?? []);

                  event.currentTarget.value = '';

                  if (selected.length === 0) return;

                  if (attachments.length + selected.length > 3) {
                    setAttachmentError(
                      '첨부파일은 최대 3개까지 선택할 수 있어요',
                    );

                    return;
                  }

                  if (
                    selected.some(
                      (file) =>
                        !attachmentTypes.includes(file.type) ||
                        file.size === 0 ||
                        file.size > 10 * 1024 * 1024,
                    )
                  ) {
                    setAttachmentError(
                      'JPEG·PNG·WebP·MP4·WebM 형식의 0바이트보다 크고 10 MiB 이하인 파일을 선택해 주세요',
                    );

                    return;
                  }

                  setAttachmentError('');
                  setAttachments((previous) => [...previous, ...selected]);
                }}
              />
            </div>
            {attachmentError && (
              <p
                id="report-attachments-error"
                role="alert"
                className="m-0 text-[13px]/[normal] text-brand"
              >
                {attachmentError}
              </p>
            )}
            {attachments.length > 0 && (
              <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[13px]/[normal]">
                {attachments.map((file, index) => (
                  <li
                    key={`${index}-${file.name}`}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      {file.name}
                    </span>
                    <button
                      className="shrink-0 cursor-pointer rounded-[10px] border border-solid border-border bg-surface px-3 py-2 text-muted"
                      type="button"
                      disabled={formLocked}
                      aria-label={`${file.name} 삭제`}
                      onClick={() => {
                        if (submissionInFlight.current || confirmedReportId)
                          return;

                        setAttachmentError('');
                        setAttachments((previous) =>
                          previous.filter((_, position) => position !== index),
                        );
                      }}
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="m-0 text-[13px]/[normal] text-muted">
            접수된 제보 내용과 첨부파일은 비공개로 저장돼요
          </p>
          <ErrorBoundary
            ref={submissionBoundary}
            onReset={() => setSubmissionError('')}
            fallback={({ error, reset }) => (
              <div>
                <p role="alert">{error.message}</p>
                <button
                  className="cursor-pointer rounded-[10px] border border-solid border-border bg-surface px-3 py-2 text-muted"
                  type="button"
                  onClick={reset}
                >
                  오류 닫기
                </button>
              </div>
            )}
          >
            <SubmissionError message={submissionError} />
          </ErrorBoundary>
          {confirmedReportId && (
            <p role="status">
              제보가 접수됐어요 · 접수번호: {confirmedReportId}
            </p>
          )}
          {confirmedReportId && (
            <button
              className="cursor-pointer rounded-[10px] border border-solid border-border bg-surface px-3 py-2 text-muted"
              type="button"
              onClick={(event) => {
                event.currentTarget.form?.reset();
                retryRequest.current = null;
                setErrors({});
                setConfirmedReportId('');
                setSubmissionError('');
                setAttachments([]);
                setAttachmentError('');
              }}
            >
              새 제보 작성
            </button>
          )}
        </div>
        <div className="mt-auto px-4 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
          <button
            className="min-h-[52px] w-full cursor-pointer rounded-card border-0 bg-brand text-[16px]/[normal] font-extrabold text-surface disabled:cursor-default disabled:opacity-60"
            type="submit"
            disabled={formLocked}
          >
            {isSubmitting ? '접수 중' : '제보 접수'}
          </button>
        </div>
      </form>
    </section>
  );
}
