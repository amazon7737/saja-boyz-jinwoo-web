'use client';

import Link from 'next/link';

import { categoryLabels } from '@/features/incidents/model/labels';

import styles from './report-form.module.css';

export default function ReportPage() {
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
        onSubmit={(event) => event.preventDefault()}
      >
        <div className={styles.field}>
          <label htmlFor="report-category">카테고리 선택</label>
          <select id="report-category" name="category" required defaultValue="">
            <option value="" disabled>
              카테고리를 선택하세요
            </option>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="report-occurred-at">발생 날짜 및 시간</label>
          <input
            id="report-occurred-at"
            name="occurredAt"
            type="datetime-local"
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="report-title">제보 제목</label>
          <input
            id="report-title"
            name="title"
            placeholder="사건 제목을 입력하세요"
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="report-location">발생 위치</label>
          <input
            id="report-location"
            name="location"
            placeholder="위치를 입력하세요"
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="report-description">상세내용</label>
          <textarea
            id="report-description"
            name="description"
            placeholder="상세 내용을 입력하세요"
            required
          />
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
        <button className={styles.submit} type="submit">
          입력 확인
        </button>
      </form>
    </section>
  );
}
