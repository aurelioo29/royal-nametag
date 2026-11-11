import IdCardPreview from "@/components/id-card-preview";
import type { NametagEditor } from "@/hooks/use-nametag-editor";

import { EditorIcon } from "./editor-ui";

export function PreviewPanel({ editor }: { editor: NametagEditor }) {
  const checks = [
    {
      label: "Foto",
      done: Boolean(editor.activePhoto),
    },
    {
      label: "Nama",
      done: Boolean(editor.data.name.trim()),
    },
    ...(editor.data.type === "pegawai"
      ? [
          {
            label: "Jabatan",
            done: Boolean(editor.data.role.trim()),
          },
        ]
      : []),
  ];

  return (
    <section
      aria-labelledby="preview-heading"
      className="min-w-0 lg:sticky lg:top-8 lg:self-start"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2
          id="preview-heading"
          className="text-sm font-semibold text-stone-800"
        >
          Preview nametag
        </h2>

        <span className="flex items-center gap-1.5 text-xs text-stone-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          Langsung diperbarui
        </span>
      </div>

      <div
        tabIndex={0}
        role="region"
        aria-label="Pratinjau kartu. Geser jika kartu lebih lebar dari layar."
        className="overflow-auto rounded-2xl border border-stone-200 bg-[#eae7e2] px-4 py-8 sm:px-8 sm:py-10"
      >
        <div className="mx-auto flex w-max min-w-full justify-center">
          <div className="w-max shrink-0 overflow-hidden rounded-xl shadow-[0_12px_30px_-12px_rgba(40,30,20,0.35)]">
            <IdCardPreview
              ref={editor.cardRef}
              data={editor.previewData}
              nameFontSizeOverride={editor.nameFontSize}
              roleFontSizeOverride={editor.roleFontSize}
            />
          </div>
        </div>
      </div>

      <div
        className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2"
        aria-label="Kelengkapan nametag"
      >
        {checks.map(({ label, done }) => (
          <span
            key={label}
            className={`flex items-center gap-1.5 text-xs ${
              done ? "text-emerald-800" : "text-stone-500"
            }`}
          >
            {done ? (
              <EditorIcon name="check" className="h-3.5 w-3.5" />
            ) : (
              <span className="h-3.5 w-3.5 rounded-full border border-stone-300" />
            )}

            {label}
            {!done && " belum diisi"}
          </span>
        ))}
      </div>

      <p className="mt-4 text-xs leading-5 text-stone-500">
        Periksa penulisan nama, gelar, dan warna foto sebelum mengunduh.
      </p>
    </section>
  );
}
