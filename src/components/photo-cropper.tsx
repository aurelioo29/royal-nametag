"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import Cropper, { type Area } from "react-easy-crop";

import { getCroppedImg } from "@/lib/crop-image";
import type { CropSelection } from "@/types/id-card";

import { primaryButton, secondaryButton } from "@/components/nametag/editor-ui";

type PhotoCropperProps = {
  image: string;
  aspect?: number;
  initialSelection?: CropSelection | null;
  onCancel: () => void;
  onApply: (image: string, selection: CropSelection) => void | Promise<void>;
};

export default function PhotoCropper(props: PhotoCropperProps) {
  return (
    <CropSession key={`${props.image}-${props.aspect ?? 3 / 4}`} {...props} />
  );
}

function CropSession({
  image,
  aspect = 3 / 4,
  initialSelection,
  onCancel,
  onApply,
}: PhotoCropperProps) {
  const zoomId = useId();

  const locked = useRef(false);
  const mounted = useRef(true);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const [area, setArea] = useState<Area | null>(null);
  const [pixels, setPixels] = useState<Area | null>(null);

  const [saving, setSaving] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const savedArea =
    resetVersion === 0 && initialSelection?.aspect === aspect
      ? initialSelection.area
      : undefined;

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  const onCropComplete = useCallback((percent: Area, pixelArea: Area) => {
    setArea(percent);
    setPixels(pixelArea);
  }, []);

  function resetCrop() {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setArea(null);
    setPixels(null);
    setResetVersion((value) => value + 1);
    setError(null);
  }

  async function apply() {
    if (!area || !pixels || locked.current) return;

    locked.current = true;

    setSaving(true);
    setError(null);

    try {
      const imageData = await getCroppedImg(image, pixels);

      if (mounted.current) {
        await onApply(imageData, {
          area,
          aspect,
        });
      }
    } catch (error) {
      if (mounted.current) {
        setError(
          error instanceof Error ? error.message : "Crop belum berhasil.",
        );
      }
    } finally {
      locked.current = false;

      if (mounted.current) {
        setSaving(false);
      }
    }
  }

  return (
    <div className="space-y-4" aria-busy={saving}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs leading-5 text-stone-500">
          Atur dari foto asli. Posisi crop sebelumnya akan dipulihkan jika
          rasionya sama.
        </p>

        <button
          type="button"
          disabled={saving}
          onClick={resetCrop}
          className="shrink-0 text-xs font-medium text-red-800 hover:underline disabled:opacity-40"
        >
          Reset crop
        </button>
      </div>

      <div
        className={`relative h-80 overflow-hidden rounded-xl bg-stone-900 ${
          saving ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <Cropper
          key={resetVersion}
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          minZoom={1}
          maxZoom={3}
          initialCroppedAreaPercentages={savedArea}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          objectFit="contain"
          showGrid
        />
      </div>

      <div>
        <div className="mb-2 flex justify-between text-xs text-stone-600">
          <label htmlFor={zoomId}>Perbesar foto</label>
          <span>{zoom.toFixed(1)}×</span>
        </div>

        <input
          id={zoomId}
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          disabled={saving}
          onChange={(event) => {
            setZoom(Number(event.target.value));
          }}
          className="w-full accent-red-800"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className={secondaryButton}
        >
          Batal
        </button>

        <button
          type="button"
          disabled={saving || !pixels || !area}
          onClick={() => void apply()}
          className={primaryButton}
        >
          {saving ? "Memproses…" : "Gunakan foto"}
        </button>
      </div>
    </div>
  );
}
