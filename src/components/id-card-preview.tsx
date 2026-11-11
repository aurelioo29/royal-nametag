/* eslint-disable @next/next/no-img-element */
"use client";

import { forwardRef, useEffect, useRef, useState } from "react";

import { renderNametag } from "@/lib/render-nametag";
import { templateConfigs } from "@/lib/templates";

import type { IdCardData } from "@/types/id-card";

type IdCardPreviewProps = {
  data: IdCardData;
  nameFontSizeOverride?: number | null;
  roleFontSizeOverride?: number | null;
};

const IdCardPreview = forwardRef<HTMLDivElement, IdCardPreviewProps>(
  function IdCardPreview(
    { data, nameFontSizeOverride = null, roleFontSizeOverride = null },
    ref,
  ) {
    const config = templateConfigs[data.type];

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [error, setError] = useState<string | null>(null);

    const [overflow, setOverflow] = useState(false);

    const [photoUpscaled, setPhotoUpscaled] = useState(false);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
      let cancelled = false;

      setLoading(true);
      setError(null);

      void renderNametag({
        data,
        nameFontSize: nameFontSizeOverride,
        roleFontSize: roleFontSizeOverride,
      })
        .then((result) => {
          if (cancelled || !canvasRef.current) {
            return;
          }

          const target = canvasRef.current;

          target.width = result.canvas.width;
          target.height = result.canvas.height;

          target.getContext("2d")?.drawImage(result.canvas, 0, 0);

          setOverflow(result.textOverflow);
          setPhotoUpscaled(result.photoUpscaled);
          setLoading(false);
        })
        .catch((error: unknown) => {
          if (cancelled) return;

          setError(
            error instanceof Error
              ? error.message
              : "Preview belum dapat dibuat.",
          );

          setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [data, nameFontSizeOverride, roleFontSizeOverride]);

    return (
      <div
        style={{
          width: config.cardWidth,
        }}
      >
        <div
          ref={ref}
          data-text-overflow={overflow}
          className="relative overflow-hidden bg-white"
          style={{
            width: config.cardWidth,
            height: config.cardHeight,
          }}
        >
          <img
            data-template-image
            src={config.background}
            alt=""
            className="hidden"
          />

          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`Preview nametag ` + (data.name || "belum diisi")}
            className="block h-full w-full"
          />

          {(loading || error) && (
            <div className="absolute inset-0 grid place-items-center bg-white/95 p-5 text-center text-xs leading-5 text-stone-600">
              {error || "Menyiapkan preview…"}
            </div>
          )}
        </div>

        {overflow && (
          <p
            role="alert"
            className="bg-red-50 p-3 text-xs leading-5 text-red-900"
          >
            Teks melewati area kartu. Sesuaikan ukuran atau ringkas isian.
          </p>
        )}

        {photoUpscaled && !error && (
          <p className="bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            Resolusi foto lebih kecil dari area cetaknya. Gunakan foto asli yang
            lebih besar atau kurangi zoom untuk hasil lebih tajam.
          </p>
        )}
      </div>
    );
  },
);

export default IdCardPreview;
