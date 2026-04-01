"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type ManifestSnapshot = {
  version?: string;
};

type ServiceWorkerRegistrationHandle = globalThis.ServiceWorkerRegistration;

const MANIFEST_URL = "/manifest.webmanifest";
const VERSION_CHECK_INTERVAL_MS = 60_000;
const CACHE_PREFIX = "aya-mobile";
const SHOULD_REGISTER_SERVICE_WORKER = process.env.NODE_ENV === "production";

async function readManifestVersion(): Promise<string | null> {
  const response = await fetch(`${MANIFEST_URL}?fresh=${Date.now()}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const manifest = (await response.json()) as ManifestSnapshot;
  return manifest.version ?? null;
}

function isServiceWorkerSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator;
}

function activateWaitingWorker(registration: ServiceWorkerRegistrationHandle) {
  if (registration.waiting) {
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  }
}

async function unregisterDevelopmentServiceWorkers() {
  if (!isServiceWorkerSupported()) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  const cacheKeys = await caches.keys();
  await Promise.all(
    cacheKeys
      .filter((key) => key.startsWith(CACHE_PREFIX))
      .map((key) => caches.delete(key))
  );
}

export function ServiceWorkerRegistration({ buildId }: { buildId: string }) {
  const hasShownUpdateToast = useRef(false);

  useEffect(() => {
    if (!isServiceWorkerSupported()) {
      return;
    }

    if (!SHOULD_REGISTER_SERVICE_WORKER) {
      void unregisterDevelopmentServiceWorkers();
      return;
    }

    let cancelled = false;
    let freshnessTimer: number | null = null;

    const handleControllerChange = () => {
      window.location.reload();
    };

    const handleFreshDeployment = () => {
      if (hasShownUpdateToast.current) {
        return;
      }

      hasShownUpdateToast.current = true;
      toast.info("تم نشر نسخة جديدة من النظام. يجري تحديث الصفحة الآن.");

      window.setTimeout(() => {
        const freshUrl = new URL(window.location.href);
        freshUrl.searchParams.set("fresh", Date.now().toString());
        window.location.replace(freshUrl.toString());
      }, 900);
    };

    const checkForFreshDeployment = async () => {
      try {
        const version = await readManifestVersion();

        if (!version || version === buildId) {
          return;
        }

        handleFreshDeployment();
      } catch {
        // Keep the shell usable if the version beacon is temporarily unavailable.
      }
    };

    const startFreshnessWatch = async () => {
      await checkForFreshDeployment();

      freshnessTimer = window.setInterval(() => {
        void checkForFreshDeployment();
      }, VERSION_CHECK_INTERVAL_MS);
    };

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register(`/sw.js?build=${encodeURIComponent(buildId)}`, {
          scope: "/"
        });

        if (cancelled) {
          return;
        }

        navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

        const updateListener = () => {
          activateWaitingWorker(registration);
        };

        registration.addEventListener("updatefound", updateListener);

        if (registration.waiting) {
          activateWaitingWorker(registration);
        }
      } catch {
        // Registration failure should never block the rest of the shell.
      }
    };

    void startFreshnessWatch();
    void register();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkForFreshDeployment();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);

      if (freshnessTimer !== null) {
        window.clearInterval(freshnessTimer);
      }
    };
  }, [buildId]);

  return null;
}
