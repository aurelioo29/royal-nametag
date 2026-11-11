"use client";

import { useEffect, useState } from "react";

import {
  DEFAULT_PHOTO_COLORS,
  clampColorAdjustment,
  createColorAdjustedPhoto,
  hasColorChanges,
  type PhotoColorChannel,
  type PhotoColorValues,
} from "@/lib/photo-color";

type ColorResult = {
  key: string;
  url: string | null;
  error: string | null;
};

export function usePhotoColor(source: string | null) {
  const [values, setValues] = useState<PhotoColorValues>(() => ({
    ...DEFAULT_PHOTO_COLORS,
  }));

  const [result, setResult] = useState<ColorResult>({
    key: "",
    url: null,
    error: null,
  });

  const { red, green, blue } = values;

  const changed = hasColorChanges(values);
  const key = JSON.stringify([source, red, green, blue]);

  const needsProcessing = Boolean(source) && changed;
  const isCurrent = result.key === key;

  const isProcessing = needsProcessing && !isCurrent;

  const error = needsProcessing && isCurrent ? result.error : null;

  const photo =
    needsProcessing && isCurrent && result.url ? result.url : source;

  useEffect(() => {
    if (!source || !needsProcessing) return;

    let cancelled = false;

    // Tunggu sebentar agar satu gerakan slider tidak memicu
    // pemrosesan untuk setiap perubahan kecil.
    const timer = window.setTimeout(() => {
      void createColorAdjustedPhoto(source, {
        red,
        green,
        blue,
      })
        .then((blob) => {
          if (cancelled) return;

          const objectUrl = URL.createObjectURL(blob);

          setResult({
            key,
            url: objectUrl,
            error: null,
          });
        })
        .catch((error: unknown) => {
          if (cancelled) return;

          setResult({
            key,
            url: null,
            error:
              error instanceof Error
                ? error.message
                : "Warna foto belum berhasil diperbarui.",
          });
        });
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [source, red, green, blue, key, needsProcessing]);

  useEffect(() => {
    const url = result.url;

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [result.url]);

  function setChannel(channel: PhotoColorChannel, value: number) {
    setValues((previous) => ({
      ...previous,
      [channel]: clampColorAdjustment(value),
    }));
  }

  function reset() {
    setValues({
      ...DEFAULT_PHOTO_COLORS,
    });
  }

  return {
    values,
    changed,
    photo,
    isProcessing,
    error,
    setChannel,
    reset,
  };
}

export type PhotoColorEditor = ReturnType<typeof usePhotoColor>;
