'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

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

export default function ReportPage() {
  const [errors, setErrors] = useState<Partial<Record<RequiredField, string>>>(
    {},
  );
  const [confirmed, setConfirmed] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState('');

  function checkInput(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    setConfirmed(firstInvalid === undefined);

    if (firstInvalid !== undefined) {
      const firstField = form.elements.namedItem(firstInvalid);

      if (firstField instanceof HTMLElement) firstField.focus();
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
          className="grid size-8 place-items-center rounded-full bg-[#f1f5f9] text-[14px]/[normal]"
        >
          <span aria-hidden="true">✕</span>
        </Link>
      </header>
      <form
        className="flex flex-col gap-5 px-4 pt-4 pb-6"
        noValidate
        onSubmit={checkInput}
        onChange={() => setConfirmed(false)}
      >
        <div className="flex min-w-0 flex-col gap-2">
          <label
            htmlFor="report-category"
            className="text-[13px]/[normal] font-bold text-muted"
          >
            카테고리 선택
          </label>
          <select
            className="box-border w-full min-w-0 rounded-[10px] border border-solid border-border bg-[#f8fafc] px-3.5 py-3 font-[family-name:inherit] text-[14px]/[normal] text-text invalid:text-[#94a3b8]"
            id="report-category"
            name="category"
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
            className="box-border w-full min-w-0 rounded-[10px] border border-solid border-border bg-[#f8fafc] px-3.5 py-3 text-[14px]/[normal] text-text placeholder:text-[#94a3b8]"
            id="report-occurred-at"
            name="occurredAt"
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
            className="box-border w-full min-w-0 rounded-[10px] border border-solid border-border bg-[#f8fafc] px-3.5 py-3 text-[14px]/[normal] text-text placeholder:text-[#94a3b8]"
            id="report-title"
            name="title"
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
          <input
            className="box-border w-full min-w-0 rounded-[10px] border border-solid border-border bg-[#f8fafc] px-3.5 py-3 text-[14px]/[normal] text-text placeholder:text-[#94a3b8]"
            id="report-location"
            name="location"
            {...errorAttributes('location')}
            placeholder="위치를 입력하세요"
            required
          />
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
            className="box-border h-[120px] w-full min-w-0 resize-y rounded-[10px] border border-solid border-border bg-[#f8fafc] p-3.5 text-[14px]/[normal] text-text placeholder:text-[#94a3b8]"
            id="report-description"
            name="description"
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
          <div className="relative flex h-[100px] flex-col items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-[#94a3b8] bg-[#f8fafc] text-[13px]/[normal] font-bold text-muted focus-within:outline-[3px] focus-within:outline-solid focus-within:outline-brand focus-within:outline-offset-4">
            <span aria-hidden="true">＋</span>
            <span>이미지 첨부</span>
            <input
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              id="report-attachments"
              name="attachments"
              type="file"
              multiple
              accept={attachmentTypes.join(',')}
              aria-invalid={Boolean(attachmentError) || undefined}
              aria-describedby={
                attachmentError ? 'report-attachments-error' : undefined
              }
              onChange={(event) => {
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
                    aria-label={`${file.name} 삭제`}
                    onClick={() => {
                      setConfirmed(false);
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
        {confirmed && (
          <p role="status">입력 확인 완료. 입력한 내용은 전송되지 않았어요</p>
        )}
        <button
          className="min-h-[52px] cursor-pointer rounded-card border-0 bg-brand text-[16px]/[normal] font-extrabold text-surface"
          type="submit"
        >
          제보 접수
        </button>
      </form>
    </section>
  );
}
