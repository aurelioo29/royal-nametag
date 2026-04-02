"use client";

import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { getCroppedImg } from "@/lib/crop-image";

type PhotoCropperProps = {
  image: string;
  onCancel: () => void;
  onApply: (croppedImage: string) => void;
};

export default function PhotoCropper({
  image,
  onCancel,
  onApply,
}: PhotoCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.2);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels) return;

    try {
      setIsSaving(true);
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onApply(croppedImage);
    } catch (error) {
      console.error(error);
      alert("Gagal crop foto.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="relative h-[320px] w-full overflow-hidden rounded-2xl bg-slate-900">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={3 / 4}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          objectFit="contain"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-800">
          Zoom
        </label>
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Batal
        </button>

        <button
          type="button"
          onClick={handleApply}
          disabled={isSaving}
          className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {isSaving ? "Memproses..." : "Gunakan Foto"}
        </button>
      </div>
    </div>
  );
}
