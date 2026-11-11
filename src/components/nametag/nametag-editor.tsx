"use client";

import { useState } from "react";

import { useNametagEditor } from "@/hooks/use-nametag-editor";

import { EditorIcon } from "./editor-ui";
import { IdentityFields } from "./identity-fields";
import { PhotoInput } from "./photo-input";
import { PhotoColorControls } from "./photo-color-controls";
import { PreviewPanel } from "./preview-panel";

const templates = [
  {
    type: "magang",
    label: "Magang",
    caption: "Peserta magang",
  },
  {
    type: "pegawai",
    label: "Pegawai",
    caption: "Staf dan tenaga medis",
  },
] as const;

export default function NametagEditor() {
  const editor = useNametagEditor();
  const [confirmReset, setConfirmReset] = useState(false);

  const canDownload = editor.isValid && !editor.isBusy && !editor.cropSource;

  const colorControlsDisabled =
    editor.isDownloading ||
    editor.isRemovingBg ||
    editor.isApplyingCrop ||
    Boolean(editor.cropSource);

  function getDownloadLabel() {
    if (editor.isDownloading) return "Menyiapkan PNG…";
    if (editor.isRemovingBg) return "Memproses foto…";
    if (editor.isApplyingCrop) return "Menyiapkan foto…";
    if (editor.photoColor.isProcessing) {
      return "Menyesuaikan warna…";
    }

    return "Unduh nametag";
  }

  function getDownloadHint() {
    if (editor.isDownloading) {
      return "Tunggu sebentar, file sedang dibuat.";
    }

    if (editor.cropSource) {
      return "Selesaikan crop foto terlebih dahulu.";
    }

    if (editor.photoColor.error) {
      return "Perbaiki pengaturan warna atau pilih Reset warna.";
    }

    if (editor.photoColor.isProcessing) {
      return "Tunggu sampai warna foto selesai diperbarui.";
    }

    return editor.isValid
      ? "Format PNG · Ukuran asli template"
      : "Lengkapi foto dan identitas untuk mengunduh.";
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,410px)_minmax(0,1fr)] lg:gap-12 [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-4 [&_:focus-visible]:outline-red-800">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void editor.download();
        }}
        className="min-w-0 rounded-2xl border border-stone-200 bg-white"
      >
        <fieldset
          disabled={editor.isDownloading}
          className="min-w-0 space-y-7 p-5 disabled:opacity-60 sm:p-6"
        >
          <legend className="sr-only">Pengaturan nametag</legend>

          <section aria-labelledby="template-heading">
            <h2
              id="template-heading"
              className="mb-4 text-sm font-semibold text-stone-900"
            >
              01 / Jenis nametag
            </h2>

            <div
              className="grid grid-cols-2 gap-3"
              role="group"
              aria-label="Jenis nametag"
            >
              {templates.map(({ type, label, caption }) => {
                const selected = editor.data.type === type;

                return (
                  <button
                    key={type}
                    type="button"
                    disabled={
                      Boolean(editor.cropSource) || editor.isApplyingCrop
                    }
                    aria-pressed={selected}
                    onClick={() => editor.changeTemplate(type)}
                    className={`relative rounded-lg border p-3 text-left transition disabled:opacity-50 ${
                      selected
                        ? "border-red-800 bg-red-50/50"
                        : "border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    <span
                      className={`block text-sm font-semibold ${
                        selected ? "text-red-900" : "text-stone-800"
                      }`}
                    >
                      {label}
                    </span>

                    <span className="mt-1 block text-[11px] leading-4 text-stone-500">
                      {caption}
                    </span>

                    {selected && (
                      <EditorIcon
                        name="check"
                        className="absolute right-2 top-2 h-3.5 w-3.5 text-red-800"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <PhotoInput editor={editor} />

          <PhotoColorControls
            color={editor.photoColor}
            hasPhoto={Boolean(editor.activePhoto)}
            disabled={colorControlsDisabled}
          />

          <IdentityFields editor={editor} />
        </fieldset>

        <div className="space-y-3 border-t border-stone-100 p-5 sm:p-6">
          {editor.notice && (
            <p
              role={editor.notice.kind === "error" ? "alert" : "status"}
              className={`rounded-lg px-3 py-2.5 text-sm leading-5 ${
                editor.notice.kind === "error"
                  ? "bg-red-50 text-red-900"
                  : "bg-emerald-50 text-emerald-900"
              }`}
            >
              {editor.notice.message}
            </p>
          )}

          <button
            type="submit"
            disabled={!canDownload}
            aria-describedby="download-hint"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-900 active:translate-y-px disabled:bg-stone-200 disabled:text-stone-500 motion-reduce:transform-none"
          >
            <EditorIcon name="download" className="h-4 w-4" />

            {getDownloadLabel()}
          </button>

          <p
            id="download-hint"
            className="text-center text-xs leading-5 text-stone-500"
          >
            {getDownloadHint()}
          </p>

          {confirmReset ? (
            <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg bg-stone-50 p-3 text-xs">
              <span className="text-stone-600">Kosongkan semua isian?</span>

              <button
                type="button"
                disabled={editor.isDownloading}
                onClick={() => {
                  editor.reset();
                  setConfirmReset(false);
                }}
                className="font-semibold text-red-800 hover:underline"
              >
                Ya, kosongkan
              </button>

              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="text-stone-600 hover:underline"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={editor.isDownloading}
              onClick={() => setConfirmReset(true)}
              className="mx-auto flex items-center gap-1.5 rounded px-2 py-1 text-xs text-stone-500 hover:text-stone-900 disabled:opacity-40"
            >
              <EditorIcon name="reset" className="h-3.5 w-3.5" />
              Mulai dari awal
            </button>
          )}
        </div>
      </form>

      <PreviewPanel editor={editor} />
    </div>
  );
}
