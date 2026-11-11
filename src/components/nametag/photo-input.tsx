import { useRef, useState } from "react";
import dynamic from "next/dynamic";

import { templateConfigs } from "@/lib/templates";

import type { NametagEditor } from "@/hooks/use-nametag-editor";

import { EditorIcon } from "./editor-ui";

const PhotoCropper = dynamic(() => import("@/components/photo-cropper"), {
  ssr: false,
  loading: () => (
    <p className="p-5 text-sm text-stone-500">Membuka pengaturan foto…</p>
  ),
});

const WebcamCapture = dynamic(() => import("@/components/webcam-capture"), {
  ssr: false,
  loading: () => (
    <p className="p-5 text-sm text-stone-500">Menyiapkan kamera…</p>
  ),
});

export function PhotoInput({ editor }: { editor: NametagEditor }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);

  const { data, cropSource, isBusy } = editor;

  const photoConfig = templateConfigs[data.type].photo;

  return (
    <section aria-labelledby="photo-heading" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="photo-heading" className="text-sm font-semibold text-stone-900">
          02 / Foto
        </h2>

        {data.originalPhoto && !cropSource && (
          <button
            type="button"
            disabled={isBusy}
            onClick={editor.recrop}
            className="text-xs font-medium text-red-800 hover:underline disabled:opacity-40"
          >
            Atur crop lagi
          </button>
        )}
      </div>

      <div
        className="flex gap-1 rounded-lg bg-stone-100 p-1"
        role="group"
        aria-label="Sumber foto"
      >
        {(
          [
            ["upload", "Unggah foto", "upload"],
            ["webcam", "Kamera", "camera"],
          ] as const
        ).map(([value, label, icon]) => (
          <button
            key={value}
            type="button"
            aria-pressed={data.photoSource === value}
            disabled={isBusy}
            onClick={() => editor.changeSource(value)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm transition disabled:opacity-40 ${
              data.photoSource === value
                ? "bg-white font-medium text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <EditorIcon name={icon} className="h-4 w-4" />

            {label}
          </button>
        ))}
      </div>

      {cropSource ? (
        <div aria-busy={editor.isApplyingCrop}>
          <PhotoCropper
            image={cropSource}
            aspect={photoConfig.width / photoConfig.height}
            initialSelection={editor.cropSelection}
            onCancel={editor.cancelCrop}
            onApply={editor.applyCrop}
          />
        </div>
      ) : data.photoSource === "webcam" ? (
        <WebcamCapture onCapture={editor.capturePhoto} disabled={isBusy} />
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();

            if (!isBusy) {
              setIsDragging(true);
            }
          }}
          onDragLeave={(event) => {
            if (
              !event.currentTarget.contains(event.relatedTarget as Node | null)
            ) {
              setIsDragging(false);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);

            const file = event.dataTransfer.files[0];

            if (file && !isBusy) {
              editor.chooseFile(file);
            }
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Pilih foto untuk nametag"
            className="sr-only"
            disabled={isBusy}
            onChange={(event) => {
              const file = event.target.files?.[0];

              event.target.value = "";

              if (file) {
                editor.chooseFile(file);
              }
            }}
          />

          <button
            type="button"
            disabled={isBusy}
            onClick={() => inputRef.current?.click()}
            className={`flex w-full flex-col items-center rounded-xl border border-dashed px-5 py-7 text-center transition disabled:opacity-50 ${
              isDragging
                ? "border-red-700 bg-red-50"
                : "border-stone-300 bg-stone-50/50 hover:border-red-700 hover:bg-red-50/40"
            }`}
          >
            <EditorIcon name="upload" className="mb-3 h-6 w-6 text-stone-500" />

            <span className="text-sm font-medium text-stone-800">
              {data.originalPhoto
                ? "Pilih foto pengganti"
                : "Pilih foto atau tarik ke sini"}
            </span>

            <span className="mt-1 text-xs text-stone-500">
              JPG, PNG, WebP · Maks. 10 MB
            </span>
          </button>
        </div>
      )}

      <div className="border-t border-stone-100 pt-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={data.removeBackground}
            disabled={
              editor.isDownloading ||
              Boolean(cropSource) ||
              editor.isApplyingCrop
            }
            onChange={(event) => {
              editor.toggleBackground(event.target.checked);
            }}
            className="mt-0.5 h-4 w-4 shrink-0 accent-red-800"
          />

          <span>
            <span className="block text-sm font-medium text-stone-800">
              Hapus background
            </span>

            <span className="mt-1 block text-xs leading-5 text-stone-500">
              Foto baru dikirim ke layanan penghapus background saat tombol
              Unduh ditekan.
            </span>
          </span>
        </label>

        {editor.isRemovingBg && (
          <p role="status" className="mt-3 text-xs text-red-800">
            Menyiapkan foto tanpa background…
          </p>
        )}

        {data.removeBackground &&
          !data.processedPhoto &&
          !editor.isRemovingBg && (
            <p className="mt-3 text-xs leading-5 text-stone-500">
              Background akan dihapus saat Unduh. Preview sementara masih
              memakai foto asli.
            </p>
          )}

        {data.removeBackground && data.processedPhoto && (
          <p className="mt-3 text-xs leading-5 text-emerald-800">
            Hasil background tersedia. Crop ulang dan unduh kembali memakai
            hasil yang sama.
          </p>
        )}
      </div>
    </section>
  );
}
