"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import IdCardPreview from "@/components/id-card-preview";
import WebcamCapture from "@/components/webcam-capture";
import PhotoCropper from "@/components/photo-cropper";
import type { CardType, IdCardData, PhotoSource } from "@/types/id-card";

async function processImageFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/remove-bg", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to remove background");
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

function dataUrlToFile(dataUrl: string, filename = "image.png"): File {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

export default function HomePage() {
  const [data, setData] = useState<IdCardData>({
    type: "magang",
    name: "",
    role: "",
    originalPhoto: null,
    processedPhoto: null,
    removeBackground: false,
    photoSource: "upload",
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);

  const [nameFontSizeOverride, setNameFontSizeOverride] = useState<
    number | null
  >(null);
  const [roleFontSizeOverride, setRoleFontSizeOverride] = useState<
    number | null
  >(null);

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const fontSizeOptions = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30];

  const cardRef = useRef<HTMLDivElement>(null);
  const originalObjectUrlRef = useRef<string | null>(null);
  const processedObjectUrlRef = useRef<string | null>(null);
  const uploadedFileRef = useRef<File | null>(null);

  const isPegawai = data.type === "pegawai";

  const activePhoto = useMemo(() => {
    if (data.removeBackground && data.processedPhoto) {
      return data.processedPhoto;
    }
    return data.originalPhoto;
  }, [data.removeBackground, data.processedPhoto, data.originalPhoto]);

  const isValid = useMemo(() => {
    if (data.type === "magang") {
      return Boolean(data.name.trim() && activePhoto);
    }

    return Boolean(data.name.trim() && data.role.trim() && activePhoto);
  }, [data.type, data.name, data.role, activePhoto]);

  const revokeProcessedUrl = () => {
    if (processedObjectUrlRef.current) {
      URL.revokeObjectURL(processedObjectUrlRef.current);
      processedObjectUrlRef.current = null;
    }
  };

  const revokeOriginalUrlIfObjectUrl = () => {
    if (
      originalObjectUrlRef.current &&
      originalObjectUrlRef.current.startsWith("blob:")
    ) {
      URL.revokeObjectURL(originalObjectUrlRef.current);
    }
    originalObjectUrlRef.current = null;
  };

  const clearPhotoState = () => {
    revokeOriginalUrlIfObjectUrl();
    revokeProcessedUrl();
    uploadedFileRef.current = null;

    setData((prev) => ({
      ...prev,
      originalPhoto: null,
      processedPhoto: null,
    }));
  };

  const handleTemplateChange = (value: CardType) => {
    setData((prev) => ({
      ...prev,
      type: value,
      role: value === "magang" ? "" : prev.role,
    }));

    if (value === "magang") {
      setRoleFontSizeOverride(null);
    }
  };

  const handlePhotoSourceChange = (value: PhotoSource) => {
    clearPhotoState();
    setCropImageSrc(null);
    setIsCropping(false);

    setData((prev) => ({
      ...prev,
      photoSource: value,
    }));
  };

  const handleInputChange =
    (field: "name" | "role") => (e: ChangeEvent<HTMLInputElement>) => {
      setData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleProcessBackground = async (fileArg?: File) => {
    const file = fileArg ?? uploadedFileRef.current;
    if (!file) return;

    try {
      setIsRemovingBg(true);

      revokeProcessedUrl();

      const processedUrl = await processImageFile(file);
      processedObjectUrlRef.current = processedUrl;

      setData((prev) => ({
        ...prev,
        processedPhoto: processedUrl,
      }));
    } catch (error) {
      console.error("Failed to remove background:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Gagal memproses hapus background. Foto asli akan tetap digunakan.";

      alert(message);

      setData((prev) => ({
        ...prev,
        processedPhoto: null,
      }));
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadedFileRef.current = file;

    revokeOriginalUrlIfObjectUrl();
    revokeProcessedUrl();

    const originalUrl = URL.createObjectURL(file);
    originalObjectUrlRef.current = originalUrl;

    setCropImageSrc(originalUrl);
    setIsCropping(true);
  };

  const handleCaptureFromWebcam = async (imageDataUrl: string) => {
    revokeOriginalUrlIfObjectUrl();
    revokeProcessedUrl();

    originalObjectUrlRef.current = imageDataUrl;
    setCropImageSrc(imageDataUrl);
    setIsCropping(true);
  };

  const handleApplyCrop = async (croppedImage: string) => {
    revokeOriginalUrlIfObjectUrl();

    originalObjectUrlRef.current = croppedImage;

    setData((prev) => ({
      ...prev,
      originalPhoto: croppedImage,
      processedPhoto: null,
    }));

    setCropImageSrc(null);
    setIsCropping(false);

    const croppedFile = dataUrlToFile(croppedImage, "cropped-image.png");
    uploadedFileRef.current = croppedFile;

    if (data.removeBackground) {
      await handleProcessBackground(croppedFile);
    }
  };

  const handleCancelCrop = () => {
    setCropImageSrc(null);
    setIsCropping(false);
  };

  const handleToggleRemoveBackground = async (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const checked = e.target.checked;

    setData((prev) => ({
      ...prev,
      removeBackground: checked,
    }));

    if (!checked) {
      revokeProcessedUrl();

      setData((prev) => ({
        ...prev,
        processedPhoto: null,
      }));
      return;
    }

    if (checked && !data.processedPhoto && uploadedFileRef.current) {
      await handleProcessBackground(uploadedFileRef.current);
    }
  };

  const handleReset = () => {
    revokeOriginalUrlIfObjectUrl();
    revokeProcessedUrl();
    uploadedFileRef.current = null;

    setData({
      type: "magang",
      name: "",
      role: "",
      originalPhoto: null,
      processedPhoto: null,
      removeBackground: false,
      photoSource: "upload",
    });

    setNameFontSizeOverride(null);
    setRoleFontSizeOverride(null);
    setCropImageSrc(null);
    setIsCropping(false);
  };

  const handleDownload = async () => {
    if (!isValid) {
      if (data.type === "magang") {
        alert("Lengkapi foto dan nama terlebih dahulu.");
      } else {
        alert("Lengkapi foto, nama, dan role terlebih dahulu.");
      }
      return;
    }

    if (!cardRef.current) return;

    try {
      setIsDownloading(true);

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
      });

      const link = document.createElement("a");
      const safeName = data.name.trim().toLowerCase().replace(/\s+/g, "-");

      link.download = `${data.type}-${safeName || "id-card"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to download PNG:", error);
      alert("Gagal download ID Card.");
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    return () => {
      revokeOriginalUrlIfObjectUrl();

      if (
        processedObjectUrlRef.current &&
        processedObjectUrlRef.current !== originalObjectUrlRef.current
      ) {
        URL.revokeObjectURL(processedObjectUrlRef.current);
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Generator ID Card
          </h1>
          <p className="mt-2 text-sm text-slate-600 md:text-base">
            Pilih template, upload foto atau gunakan webcam, isi nama, lalu
            download hasilnya.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Jenis ID Card
                </label>

                <select
                  value={data.type}
                  onChange={(e) =>
                    handleTemplateChange(e.target.value as CardType)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="magang">Magang</option>
                  <option value="pegawai">Pegawai</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Sumber Foto
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handlePhotoSourceChange("upload")}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      data.photoSource === "upload"
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Upload
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePhotoSourceChange("webcam")}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      data.photoSource === "webcam"
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Webcam
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Foto
                </label>

                {isCropping && cropImageSrc ? (
                  <PhotoCropper
                    image={cropImageSrc}
                    onCancel={handleCancelCrop}
                    onApply={handleApplyCrop}
                  />
                ) : data.photoSource === "upload" ? (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
                  />
                ) : (
                  <WebcamCapture onCapture={handleCaptureFromWebcam} />
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={data.removeBackground}
                    onChange={handleToggleRemoveBackground}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Hapus background foto
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Jika aktif, sistem akan mencoba memproses foto menjadi
                      transparan.
                    </p>
                  </div>
                </label>

                {isRemovingBg && (
                  <p className="mt-3 text-sm font-medium text-blue-600">
                    Sedang memproses background...
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Font Size Nama
                  </label>
                  <select
                    value={nameFontSizeOverride ?? "auto"}
                    onChange={(e) =>
                      setNameFontSizeOverride(
                        e.target.value === "auto"
                          ? null
                          : Number(e.target.value),
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="auto">Auto</option>
                    {fontSizeOptions.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                {data.type === "pegawai" && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Font Size Role
                    </label>
                    <select
                      value={roleFontSizeOverride ?? "auto"}
                      onChange={(e) =>
                        setRoleFontSizeOverride(
                          e.target.value === "auto"
                            ? null
                            : Number(e.target.value),
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="auto">Auto</option>
                      {fontSizeOptions.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Nama
                </label>

                <input
                  type="text"
                  value={data.name}
                  onChange={handleInputChange("name")}
                  placeholder="Masukkan nama"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {isPegawai && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Role
                  </label>

                  <input
                    type="text"
                    value={data.role}
                    onChange={handleInputChange("role")}
                    placeholder="Masukkan role"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Reset
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading || isRemovingBg || isCropping}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDownloading ? "Downloading..." : "Download PNG"}
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">Preview</h2>
              <p className="mt-1 text-sm text-slate-600">
                Preview akan berubah secara realtime sesuai input.
              </p>
            </div>

            <div className="flex min-h-[600px] items-start justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6">
              <IdCardPreview
                ref={cardRef}
                data={data}
                isRemovingBg={isRemovingBg}
                nameFontSizeOverride={nameFontSizeOverride}
                roleFontSizeOverride={roleFontSizeOverride}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
