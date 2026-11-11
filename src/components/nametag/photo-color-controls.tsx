import type { PhotoColorEditor } from "@/hooks/use-photo-color";

const channels = [
  {
    key: "red",
    label: "Merah",
    accent: "accent-red-700",
    dot: "bg-red-600",
  },
  {
    key: "green",
    label: "Hijau",
    accent: "accent-emerald-700",
    dot: "bg-emerald-600",
  },
  {
    key: "blue",
    label: "Biru",
    accent: "accent-blue-700",
    dot: "bg-blue-600",
  },
] as const;

type PhotoColorControlsProps = {
  color: PhotoColorEditor;
  hasPhoto: boolean;
  disabled?: boolean;
};

export function PhotoColorControls({
  color,
  hasPhoto,
  disabled = false,
}: PhotoColorControlsProps) {
  const locked = disabled || !hasPhoto;

  return (
    <section
      aria-labelledby="photo-color-heading"
      className="space-y-4 border-t border-stone-100 pt-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h3
          id="photo-color-heading"
          className="text-sm font-semibold text-stone-900"
        >
          Warna foto
        </h3>

        <button
          type="button"
          disabled={locked || !color.changed}
          onClick={color.reset}
          className="text-xs font-medium text-stone-500 transition hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset warna
        </button>
      </div>

      <p className="text-xs leading-5 text-stone-500">
        Sesuaikan sedikit demi sedikit. Nilai 0 memakai warna asli foto.
      </p>

      <fieldset disabled={locked} className="space-y-4 disabled:opacity-40">
        <legend className="sr-only">
          Koreksi kanal merah, hijau, dan biru
        </legend>

        {channels.map(({ key, label, accent, dot }) => {
          const value = color.values[key];
          const inputId = `photo-color-${key}`;

          return (
            <div key={key}>
              <div className="mb-2 flex items-center justify-between text-xs">
                <label
                  htmlFor={inputId}
                  className="flex items-center gap-2 text-stone-700"
                >
                  <span className={`h-2 w-2 rounded-full ${dot}`} />
                  {label}
                </label>

                <output
                  htmlFor={inputId}
                  className="w-10 text-right tabular-nums text-stone-500"
                >
                  {value > 0 ? `+${value}` : value}
                </output>
              </div>

              <input
                id={inputId}
                type="range"
                min={-100}
                max={100}
                step={1}
                value={value}
                onChange={(event) => {
                  color.setChannel(key, Number(event.target.value));
                }}
                className={`block w-full ${accent}`}
              />
            </div>
          );
        })}
      </fieldset>

      {!hasPhoto && (
        <p className="text-xs text-stone-500">
          Tambahkan foto terlebih dahulu untuk mengatur warnanya.
        </p>
      )}

      {color.isProcessing && (
        <p role="status" className="text-xs text-red-800">
          Memperbarui warna foto…
        </p>
      )}

      {color.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-900"
        >
          {color.error} Coba ubah slider atau pilih Reset warna.
        </p>
      )}
    </section>
  );
}
