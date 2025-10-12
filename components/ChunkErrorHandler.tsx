"use client";

import { useEffect } from 'react';

export function ChunkErrorHandler() {
  useEffect(() => {
    const handleChunkError = (event: ErrorEvent) => {
      if (
        event.message.includes('Loading chunk') ||
        event.message.includes('ChunkLoadError') ||
        event.error?.name === 'ChunkLoadError'
      ) {
        window.location.reload();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason?.message?.includes('Loading chunk') ||
        event.reason?.name === 'ChunkLoadError'
      ) {
        window.location.reload();
      }
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}