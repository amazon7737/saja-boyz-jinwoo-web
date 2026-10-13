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

export default function ReportPage() {
  const [errors, setErrors] = useState<RequiredField[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  function checkInput(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const missing = requiredFields.filter(
      (name) => !String(values.get(name) ?? '').trim(),
    );

    setErrors(missing);
    setConfirmed(missing.length === 0);

    if (missing.length > 0) {
      const firstField = form.elements.namedItem(missing[0]);

      if (firstField instanceof HTMLElement) firstField.focus();
    }
  }

  function errorAttributes(name: RequiredField) {
    return {
      'aria-invalid': errors.includes(name) || undefined,
      'aria-describedby': errors.includes(name)
        ? `report-${name}-error`
        : undefined,
    };
  }

  function fieldError(name: RequiredField) {
    return errors.includes(name) ? (
      <p id={`report-${name}-error`} className={styles.error}>
        필수 항목이에요
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
      <form className={styles.form} noValidate onSubmit={checkInput}>
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
            />
          </div>
        </div>
        <p className={styles.notice}>제보 접수 준비 중</p>
        {confirmed && <p role="status">입력 확인 완료</p>}
        <button className={styles.submit} type="submit">
          입력 확인
        </button>
      </form>
    </section>
  );
}
