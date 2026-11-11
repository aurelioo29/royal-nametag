import NametagEditor from "@/components/nametag/nametag-editor";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f8f7f4] text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link
            href="/"
            aria-label="Royal Nametag, halaman utama"
            className="flex items-center gap-3 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-800"
          >
            <Image
              src="/logo.svg"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 object-contain"
            />

            <span className="text-sm font-semibold tracking-tight">
              Royal Nametag
            </span>
          </Link>

          <span className="hidden text-xs text-stone-500 sm:block">
            RSU Royal Prima
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 max-w-xl sm:mb-10">
          <p className="mb-2 text-xs font-medium text-red-800">
            Nametag pegawai & peserta magang
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Siapkan nametag kamu.
          </h1>

          <p className="mt-3 text-sm leading-6 text-stone-600">
            Pilih jenis kartu, atur foto, dan isi identitas. Cek hasilnya di
            preview, lalu unduh saat sudah pas.
          </p>
        </div>

        <NametagEditor />
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-5 pb-6 text-xs text-stone-500 sm:px-8">
        <span>Royal Nametag / RSU Royal Prima</span>
        <span>Pastikan data sudah benar sebelum dicetak.</span>
      </footer>
    </div>
  );
}
