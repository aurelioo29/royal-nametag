import type { NametagEditor } from "@/hooks/use-nametag-editor";
import { inputClass } from "./editor-ui";

const fontSizes = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30];

type FontSelectProps = {
  id: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
};

function FontSelect({ id, label, value, onChange }: FontSelectProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-medium text-stone-600"
      >
        {label}
      </label>

      <select
        id={id}
        value={value ?? "auto"}
        onChange={(event) => {
          onChange(
            event.target.value === "auto" ? null : Number(event.target.value),
          );
        }}
        className={inputClass}
      >
        <option value="auto">Otomatis</option>

        {fontSizes.map((size) => (
          <option key={size} value={size}>
            {size} px
          </option>
        ))}
      </select>
    </div>
  );
}

export function IdentityFields({ editor }: { editor: NametagEditor }) {
  return (
    <section aria-labelledby="identity-heading" className="space-y-4">
      <h2
        id="identity-heading"
        className="text-sm font-semibold text-stone-900"
      >
        03 / Identitas
      </h2>

      <div>
        <label
          htmlFor="nametag-name"
          className="mb-2 block text-sm text-stone-700"
        >
          Nama lengkap <span className="text-red-700">*</span>
        </label>

        <input
          id="nametag-name"
          name="name"
          type="text"
          autoComplete="off"
          required
          value={editor.data.name}
          onChange={(event) => {
            editor.setField("name", event.target.value);
          }}
          placeholder="Nama beserta gelar"
          className={inputClass}
        />
      </div>

      {editor.data.type === "pegawai" && (
        <div>
          <label
            htmlFor="nametag-role"
            className="mb-2 block text-sm text-stone-700"
          >
            Jabatan <span className="text-red-700">*</span>
          </label>

          <input
            id="nametag-role"
            name="role"
            type="text"
            autoComplete="off"
            required
            value={editor.data.role}
            onChange={(event) => {
              editor.setField("role", event.target.value);
            }}
            placeholder="Contoh: Asisten Apoteker"
            className={inputClass}
          />
        </div>
      )}

      <details className="border-t border-stone-100 pt-4">
        <summary className="cursor-pointer text-xs font-medium text-stone-600 transition hover:text-stone-900">
          Sesuaikan ukuran teks
        </summary>

        <p className="mt-3 text-xs leading-5 text-stone-500">
          Biarkan otomatis, atau pilih ukuran setelah melihat preview.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <FontSelect
            id="name-font"
            label="Nama"
            value={editor.nameFontSize}
            onChange={editor.setNameFontSize}
          />

          {editor.data.type === "pegawai" && (
            <FontSelect
              id="role-font"
              label="Jabatan"
              value={editor.roleFontSize}
              onChange={editor.setRoleFontSize}
            />
          )}
        </div>
      </details>
    </section>
  );
}
