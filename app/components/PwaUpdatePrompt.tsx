'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';

export default function PwaUpdatePrompt({ version }: { version: string }) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;
    let disposed = false;
    let reloadOnControllerChange = Boolean(navigator.serviceWorker.controller);
    let reloading = false;

    const showWaitingUpdate = () => {
      if (registration?.waiting && navigator.serviceWorker.controller) setUpdateAvailable(true);
    };

    const onUpdateFound = () => {
      const installing = registration?.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) setUpdateAvailable(true);
      });
    };

    const checkForUpdate = () => {
      if (document.visibilityState === 'visible') void registration?.update().catch(() => {});
    };

    const onControllerChange = () => {
      if (!reloadOnControllerChange || reloading) {
        reloadOnControllerChange = true;
        return;
      }
      reloading = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    const workerUrl = `/sw.js?v=${encodeURIComponent(version)}`;
    void navigator.serviceWorker.register(workerUrl, { scope: '/', updateViaCache: 'none' }).then(result => {
      if (disposed) return;
      registration = result;
      registration.addEventListener('updatefound', onUpdateFound);
      showWaitingUpdate();
      void registration.update().catch(() => {});
    }).catch(() => {});

    window.addEventListener('focus', checkForUpdate);
    document.addEventListener('visibilitychange', checkForUpdate);
    const updateTimer = window.setInterval(checkForUpdate, 60 * 60 * 1000);

    return () => {
      disposed = true;
      window.clearInterval(updateTimer);
      window.removeEventListener('focus', checkForUpdate);
      document.removeEventListener('visibilitychange', checkForUpdate);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      registration?.removeEventListener('updatefound', onUpdateFound);
    };
  }, [version]);

  function applyUpdate() {
    const waiting = navigator.serviceWorker.getRegistration('/').then(registration => registration?.waiting);
    setApplying(true);
    void waiting.then(worker => {
      if (!worker) {
        setApplying(false);
        setUpdateAvailable(false);
        return;
      }
      worker.postMessage({ type: 'SKIP_WAITING' });
    }).catch(() => setApplying(false));
  }

  if (!updateAvailable) return null;

  return <aside className="pwa-update-banner" role="status" aria-live="polite">
    <span><Sparkles size={16} aria-hidden="true" /> Có phiên bản mới cho góc nhỏ này ♡</span>
    <button type="button" onClick={applyUpdate} disabled={applying}>
      <RefreshCw size={15} aria-hidden="true" /> {applying ? 'Đang cập nhật…' : 'Cập nhật ngay'}
    </button>
  </aside>;
}
