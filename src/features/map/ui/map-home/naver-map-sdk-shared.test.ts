// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';

import * as sdk from './naver-map-sdk';
import type { NaverMaps } from './naver-map-sdk';

type Subscriber = { ready(maps: NaverMaps): void; error(): void };
type Subscribe = (clientId: string, subscriber: Subscriber) => () => void;

afterEach(() => {
  document
    .querySelectorAll('script[src*="oapi.map.naver.com"]')
    .forEach((script) => script.remove());
  Reflect.deleteProperty(window, 'naver');
  Reflect.deleteProperty(window, 'navermap_authFailure');
  vi.restoreAllMocks();
});

test('sharedNaverSdkKeepsTheRemainingConsumerAndRestoresPriorCallback', () => {
  const subscribe = Reflect.get(sdk, 'subscribeNaverMaps') as
    Subscribe | undefined;
  expect(subscribe).toBeTypeOf('function');
  if (!subscribe) throw new Error('공통 지도 SDK 로더가 없습니다');
  const prior = vi.fn();
  Reflect.set(window, 'navermap_authFailure', prior);
  const first = { ready: vi.fn(), error: vi.fn() };
  const second = { ready: vi.fn(), error: vi.fn() };
  const releaseFirst = subscribe('same-client', first);
  const releaseSecond = subscribe('same-client', second);
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    'script[src*="oapi.map.naver.com"]',
  );
  expect(scripts).toHaveLength(1);
  const script = scripts[0];
  const maps = { Map: vi.fn(), Marker: vi.fn() } as unknown as NaverMaps;
  Reflect.set(window, 'naver', { maps });
  script.dispatchEvent(new Event('load'));
  expect(first.ready).toHaveBeenCalledExactlyOnceWith(maps);
  expect(second.ready).toHaveBeenCalledExactlyOnceWith(maps);
  releaseFirst();
  expect(script.isConnected).toBe(true);
  expect(Reflect.get(window, 'navermap_authFailure')).not.toBe(prior);
  releaseSecond();
  expect(script.isConnected).toBe(true);
  expect(Reflect.get(window, 'navermap_authFailure')).toBe(prior);
});

test('sharedNaverSdkReleasesDuplicateSubscriberRegistrationsIndependently', () => {
  const subscribe = Reflect.get(sdk, 'subscribeNaverMaps') as Subscribe;
  const previous = vi.fn();
  Reflect.set(window, 'navermap_authFailure', previous);
  const subscriber = { ready: vi.fn(), error: vi.fn() };
  const releaseFirst = subscribe('same-client', subscriber);
  const releaseSecond = subscribe('same-client', subscriber);
  try {
    const script = document.querySelector<HTMLScriptElement>(
      'script[src*="oapi.map.naver.com"]',
    )!;
    releaseFirst();
    expect(Reflect.get(window, 'navermap_authFailure')).not.toBe(previous);
    const maps = { Map: vi.fn(), Marker: vi.fn() } as unknown as NaverMaps;
    Reflect.set(window, 'naver', { maps });
    script.dispatchEvent(new Event('load'));
    expect(subscriber.ready).toHaveBeenCalledExactlyOnceWith(maps);
  } finally {
    releaseFirst();
    releaseSecond();
  }
  expect(Reflect.get(window, 'navermap_authFailure')).toBe(previous);
});

test('sharedNaverSdkSkipsConsumersReleasedDuringReadyNotification', () => {
  const first = { ready: vi.fn(), error: vi.fn() };
  const second = { ready: vi.fn(), error: vi.fn() };
  let releaseSecond = () => {};
  first.ready.mockImplementation(() => releaseSecond());
  const releaseFirst = sdk.subscribeNaverMaps('same-client', first);
  releaseSecond = sdk.subscribeNaverMaps('same-client', second);
  try {
    Reflect.set(window, 'naver', {
      maps: { Map: vi.fn(), Marker: vi.fn() },
    });
    document
      .querySelector<HTMLScriptElement>('script[src*="oapi.map.naver.com"]')!
      .dispatchEvent(new Event('load'));
    expect(first.ready).toHaveBeenCalledOnce();
    expect(second.ready).not.toHaveBeenCalled();
  } finally {
    releaseSecond();
    releaseFirst();
  }
});

test('sharedNaverSdkIgnoresLateEventsAfterTimeoutAndRetries', () => {
  vi.useFakeTimers();
  const first = { ready: vi.fn(), error: vi.fn() };
  const releaseFirst = sdk.subscribeNaverMaps('same-client', first);
  const oldScript = document.querySelector<HTMLScriptElement>(
    'script[src*="oapi.map.naver.com"]',
  )!;
  try {
    vi.advanceTimersByTime(10_001);
    expect(first.error).toHaveBeenCalledOnce();
    releaseFirst();
    const retry = { ready: vi.fn(), error: vi.fn() };
    const releaseRetry = sdk.subscribeNaverMaps('same-client', retry);
    try {
      const newScript = document.querySelector<HTMLScriptElement>(
        'script[src*="oapi.map.naver.com"]',
      )!;
      expect(newScript).not.toBe(oldScript);
      Reflect.set(window, 'naver', {
        maps: { Map: vi.fn(), Marker: vi.fn() },
      });
      oldScript.dispatchEvent(new Event('load'));
      expect(retry.ready).not.toHaveBeenCalled();
      newScript.dispatchEvent(new Event('load'));
      expect(retry.ready).toHaveBeenCalledOnce();
    } finally {
      releaseRetry();
    }
  } finally {
    releaseFirst();
    vi.useRealTimers();
  }
});

test('sharedNaverSdkRejectsConflictingKeysWithoutDisturbingActiveLoad', async () => {
  const first = { ready: vi.fn(), error: vi.fn() };
  const second = { ready: vi.fn(), error: vi.fn() };
  const releaseFirst = sdk.subscribeNaverMaps('first-client', first);
  const original = document.querySelector<HTMLScriptElement>(
    'script[src*="oapi.map.naver.com"]',
  )!;
  const releaseSecond = sdk.subscribeNaverMaps('second-client', second);
  try {
    await Promise.resolve();
    expect(second.error).toHaveBeenCalledOnce();
    expect(original.isConnected).toBe(true);
    Reflect.set(window, 'naver', {
      maps: { Map: vi.fn(), Marker: vi.fn() },
    });
    original.dispatchEvent(new Event('load'));
    expect(first.ready).toHaveBeenCalledOnce();
    expect(first.error).not.toHaveBeenCalled();
  } finally {
    releaseSecond();
    releaseFirst();
  }
});
