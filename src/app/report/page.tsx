'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

import { categoryLabels } from '@/features/incidents/model/labels';

import styles from './report-form.module.css';

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
      <p id={`report-${name}-error`} className={styles.error}>
        {errors[name]}
      </p>
    ) : null;
  }

  return (
    <section className={styles.report}>
      <header className={styles.header}>
        <h1>제보하기</h1>
        <Link href="/" aria-label="제보 닫기" className={styles.close}>
          <span aria-hidden="true">✕</span>
        </Link>
      </header>
      <form
        className={styles.form}
        noValidate
        onSubmit={checkInput}
        onChange={() => setConfirmed(false)}
      >
        <div className={styles.field}>
          <label htmlFor="report-category">카테고리 선택</label>
          <select
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
        <div className={styles.field}>
          <label htmlFor="report-occurred-at">발생 날짜 및 시간</label>
          <input
            id="report-occurred-at"
            name="occurredAt"
            {...errorAttributes('occurredAt')}
            type="datetime-local"
            required
          />
          {fieldError('occurredAt')}
        </div>
        <div className={styles.field}>
          <label htmlFor="report-title">제보 제목</label>
          <input
            id="report-title"
            name="title"
            {...errorAttributes('title')}
            placeholder="사건 제목을 입력하세요"
            required
          />
          {fieldError('title')}
        </div>
        <div className={styles.field}>
          <label htmlFor="report-location">발생 위치</label>
          <input
            id="report-location"
            name="location"
            {...errorAttributes('location')}
            placeholder="위치를 입력하세요"
            required
          />
          {fieldError('location')}
        </div>
        <div className={styles.field}>
          <label htmlFor="report-description">상세내용</label>
          <textarea
            id="report-description"
            name="description"
            {...errorAttributes('description')}
            placeholder="상세 내용을 입력하세요"
            required
          />
          {fieldError('description')}
        </div>
        <div className={styles.field}>
          <label htmlFor="report-attachments">사진/동영상 첨부</label>
          <div className={styles.attachment}>
            <span aria-hidden="true">＋</span>
            <span>이미지 첨부</span>
            <input
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
              className={styles.error}
            >
              {attachmentError}
            </p>
          )}
          {attachments.length > 0 && (
            <ul className={styles.attachmentList}>
              {attachments.map((file, index) => (
                <li key={`${index}-${file.name}`}>
                  <span>{file.name}</span>
                  <button
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
        <p className={styles.notice}>제보 접수 준비 중</p>
        {confirmed && (
          <p role="status">입력 확인 완료. 입력한 내용은 전송되지 않았어요</p>
        )}
        <button className={styles.submit} type="submit">
          입력 확인
        </button>
      </form>
    </section>
  );
}
