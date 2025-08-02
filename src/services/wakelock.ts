let wakeLock: WakeLockSentinel | null = null;

export async function requestWakeLock(): Promise<void> {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
  } catch (error) {
    console.log('error requesting wake lock: ', error);
  }
}

export function releaseWakeLock(): void {
  if (!wakeLock) return;
  wakeLock.release();
}
