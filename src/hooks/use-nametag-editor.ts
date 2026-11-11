"use client";

import { useEffect, useRef, useState } from "react";

import { applyBackgroundMask } from "@/lib/apply-background-mask";
import { getCroppedImgFromPercent } from "@/lib/crop-image";
import {
  croppedPhotoToFile,
  removePhotoBackground,
  validatePhoto,
} from "@/lib/nametag-image";
import { createColorAdjustedPhoto, hasColorChanges } from "@/lib/photo-color";
import { usePhotoColor } from "@/hooks/use-photo-color";

import type {
  CardType,
  CropSelection,
  IdCardData,
  PhotoSource,
} from "@/types/id-card";

type Notice = {
  kind: "error" | "success";
  message: string;
} | null;

type PhotoFile = {
  file: File;
  source: string;
};

function initialData(): IdCardData {
  return {
    type: "magang",
    name: "",
    role: "",
    originalPhoto: null,
    processedPhoto: null,
    removeBackground: false,
    photoSource: "upload",
  };
}

async function fileFingerprint(file: File): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer(),
  );

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function useNametagEditor() {
  const [data, setData] = useState<IdCardData>(initialData);
  const [nameFontSize, setNameFontSize] = useState<number | null>(null);
  const [roleFontSize, setRoleFontSize] = useState<number | null>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [cropSelection, setCropSelection] = useState<CropSelection | null>(
    null,
  );
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const original = useRef<PhotoFile | null>(null);
  const candidate = useRef<PhotoFile | null>(null);
  const clean = useRef<PhotoFile | null>(null);

  const controller = useRef<AbortController | null>(null);
  const urls = useRef(new Map<string, string>());
  const backgroundCache = useRef(new Map<string, Promise<Blob>>());

  const generation = useRef(0);
  const locked = useRef(false);
  const alive = useRef(true);

  const activePhoto =
    data.removeBackground && data.processedPhoto
      ? data.processedPhoto
      : data.originalPhoto;

  const photoColor = usePhotoColor(activePhoto);

  const isValid = Boolean(
    data.name.trim() &&
    activePhoto &&
    (data.type === "magang" || data.role.trim()) &&
    !photoColor.error,
  );

  const isBusy =
    isRemovingBg || isApplyingCrop || isDownloading || photoColor.isProcessing;

  const previewData: IdCardData = {
    ...data,
    originalPhoto: photoColor.photo,
    processedPhoto: null,
    removeBackground: false,
  };

  function releaseUrl(slot: string) {
    const url = urls.current.get(slot);

    if (url) {
      URL.revokeObjectURL(url);
    }

    urls.current.delete(slot);
  }

  function ownUrl(slot: string, blob: Blob) {
    releaseUrl(slot);

    const url = URL.createObjectURL(blob);
    urls.current.set(slot, url);

    return url;
  }

  useEffect(() => {
    alive.current = true;

    const ownedUrls = urls.current;
    const savedCache = backgroundCache.current;

    return () => {
      alive.current = false;
      generation.current += 1;
      controller.current?.abort();

      for (const url of ownedUrls.values()) {
        URL.revokeObjectURL(url);
      }

      ownedUrls.clear();
      savedCache.clear();
    };
  }, []);

  function setField(field: "name" | "role", value: string) {
    if (locked.current) return;

    setNotice(null);
    setData((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function changeTemplate(type: CardType) {
    if (locked.current || cropSource) return;

    setNotice(null);
    setData((previous) => ({
      ...previous,
      type,
    }));
  }

  function cancelCrop() {
    if (locked.current) return;

    generation.current += 1;
    releaseUrl("candidate");
    candidate.current = null;

    setCropSource(null);
    setIsApplyingCrop(false);
  }

  function changeSource(photoSource: PhotoSource) {
    if (locked.current || photoSource === data.photoSource) return;

    cancelCrop();
    setData((previous) => ({
      ...previous,
      photoSource,
    }));
  }

  function chooseFile(file: File) {
    if (locked.current || isApplyingCrop) return;

    try {
      validatePhoto(file);
      generation.current += 1;

      candidate.current = {
        file,
        source: ownUrl("candidate", file),
      };

      setCropSource(candidate.current.source);
      setNotice(null);
    } catch (error) {
      setNotice({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Foto tidak dapat dibuka.",
      });
    }
  }

  async function capturePhoto(source: string) {
    const current = generation.current;

    try {
      const file = await croppedPhotoToFile(source);

      if (alive.current && current === generation.current) {
        chooseFile(file);
      }
    } catch {
      if (alive.current && current === generation.current) {
        setNotice({
          kind: "error",
          message: "Foto kamera belum dapat dibuka.",
        });
      }
    }
  }

  async function applyCrop(croppedImage: string, selection: CropSelection) {
    if (locked.current || isApplyingCrop) return;

    const selected = candidate.current ?? original.current;

    if (!selected) return;

    const current = generation.current;

    setIsApplyingCrop(true);

    try {
      const sameOriginal = original.current?.file === selected.file;
      const masked = clean.current;

      const processedPhoto =
        sameOriginal && masked?.file === selected.file
          ? await getCroppedImgFromPercent(masked.source, selection.area)
          : null;

      if (!alive.current || current !== generation.current) return;

      if (!sameOriginal) {
        releaseUrl("original");

        // Pindahkan kepemilikan URL kandidat ke foto asli.
        urls.current.delete("candidate");
        urls.current.set("original", selected.source);

        original.current = selected;
        clean.current = null;
        releaseUrl("clean");
      }

      candidate.current = null;

      setData((previous) => ({
        ...previous,
        originalPhoto: croppedImage,
        processedPhoto,
      }));

      setCropSelection(selection);
      setCropSource(null);
      setNotice(null);
    } catch {
      if (alive.current && current === generation.current) {
        setNotice({
          kind: "error",
          message: "Crop belum berhasil diterapkan. Silakan coba lagi.",
        });
      }
    } finally {
      if (alive.current && current === generation.current) {
        setIsApplyingCrop(false);
      }
    }
  }

  function recrop() {
    if (isBusy || locked.current || !original.current) return;

    candidate.current = null;
    setCropSource(original.current.source);
    setNotice(null);
  }

  function toggleBackground(checked: boolean) {
    if (locked.current || isApplyingCrop || cropSource) return;

    setData((previous) => ({
      ...previous,
      removeBackground: checked,
    }));

    setNotice(null);
  }

  async function getCleanPhoto(file: File): Promise<Blob> {
    const key = await fileFingerprint(file);

    if (!alive.current) {
      throw new Error("Editor sudah ditutup.");
    }

    const cached = backgroundCache.current.get(key);

    if (cached) {
      return cached;
    }

    const requestController = new AbortController();
    controller.current = requestController;

    const task = removePhotoBackground(file, requestController.signal);

    if (backgroundCache.current.size >= 5) {
      const oldest = backgroundCache.current.keys().next().value;

      if (oldest) {
        backgroundCache.current.delete(oldest);
      }
    }

    // Cache respons API agar percobaan masker atau ekspor bisa diulang.
    backgroundCache.current.set(key, task);

    try {
      return await task;
    } catch (error) {
      backgroundCache.current.delete(key);
      throw error;
    } finally {
      if (controller.current === requestController) {
        controller.current = null;
      }
    }
  }

  async function download() {
    const source = original.current;
    const selection = cropSelection;

    if (
      locked.current ||
      !isValid ||
      isBusy ||
      cropSource ||
      !source ||
      !selection
    ) {
      return;
    }

    locked.current = true;
    setIsDownloading(true);
    setNotice(null);

    let colorUrl: string | null = null;

    try {
      const [{ renderNametag }, { exportNametag }] = await Promise.all([
        import("@/lib/render-nametag"),
        import("@/components/nametag/export-card"),
      ]);

      // Periksa template, foto, dan teks sebelum memakai kredit API.
      await renderNametag({
        data,
        nameFontSize,
        roleFontSize,
        strictText: true,
      });

      if (!alive.current) return;

      let exportPhoto = data.originalPhoto;

      if (data.removeBackground) {
        setIsRemovingBg(true);

        const savedMask = clean.current;
        let cleanSource =
          savedMask?.file === source.file ? savedMask.source : null;

        if (!cleanSource) {
          const removedBackground = await getCleanPhoto(source.file);

          if (!alive.current) return;

          // Ambil alpha dari hasil API dan warna dari foto asli.
          const maskedPhoto = await applyBackgroundMask(
            source.file,
            removedBackground,
          );

          if (!alive.current) return;

          cleanSource = ownUrl("clean", maskedPhoto);

          clean.current = {
            file: source.file,
            source: cleanSource,
          };
        }

        // Terapkan crop setelah masker selesai pada foto utuh.
        const processedPhoto = await getCroppedImgFromPercent(
          cleanSource,
          selection.area,
        );

        if (!alive.current) return;

        exportPhoto = processedPhoto;

        setData((previous) => ({
          ...previous,
          processedPhoto,
        }));

        setIsRemovingBg(false);
      }

      if (!exportPhoto) {
        throw new Error("Foto belum tersedia.");
      }

      if (hasColorChanges(photoColor.values)) {
        const adjustedPhoto = await createColorAdjustedPhoto(
          exportPhoto,
          photoColor.values,
        );

        if (!alive.current) return;

        colorUrl = URL.createObjectURL(adjustedPhoto);
        exportPhoto = colorUrl;
      }

      if (!alive.current) return;

      await exportNametag({
        data: {
          ...data,
          originalPhoto: exportPhoto,
          processedPhoto: null,
          removeBackground: false,
        },
        nameFontSize,
        roleFontSize,
      });

      if (alive.current) {
        setNotice({
          kind: "success",
          message: "PNG sudah disiapkan dengan ukuran asli template.",
        });
      }
    } catch (error) {
      if (alive.current) {
        setNotice({
          kind: "error",
          message:
            error instanceof Error
              ? error.message
              : "Nametag belum berhasil diunduh.",
        });
      }
    } finally {
      if (colorUrl) {
        URL.revokeObjectURL(colorUrl);
      }

      locked.current = false;

      if (alive.current) {
        setIsRemovingBg(false);
        setIsDownloading(false);
      }
    }
  }

  function reset() {
    if (locked.current) return;

    generation.current += 1;

    for (const url of urls.current.values()) {
      URL.revokeObjectURL(url);
    }

    urls.current.clear();
    original.current = null;
    candidate.current = null;
    clean.current = null;

    // Respons remove.bg tetap bisa dipakai untuk file identik di sesi ini.
    setData(initialData());
    setCropSource(null);
    setCropSelection(null);
    setIsApplyingCrop(false);
    setNameFontSize(null);
    setRoleFontSize(null);
    setNotice(null);
    photoColor.reset();
  }

  return {
    data,
    previewData,
    photoColor,
    activePhoto,
    nameFontSize,
    roleFontSize,
    cropSource,
    cropSelection: candidate.current ? null : cropSelection,
    notice,
    cardRef,
    isValid,
    isBusy,
    isRemovingBg,
    isApplyingCrop,
    isDownloading,
    setField,
    changeTemplate,
    changeSource,
    chooseFile,
    capturePhoto,
    applyCrop,
    cancelCrop,
    toggleBackground,
    recrop,
    reset,
    download,
    setNameFontSize,
    setRoleFontSize,
  };
}

export type NametagEditor = ReturnType<typeof useNametagEditor>;
