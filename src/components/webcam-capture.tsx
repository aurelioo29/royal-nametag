"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  EditorIcon,
  primaryButton,
  secondaryButton,
} from "./nametag/editor-ui";

type WebcamCaptureProps = {
  onCapture: (image: string) => void;
  disabled?: boolean;
};

function cameraMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (["NotAllowedError", "SecurityError"].includes(error.name)) {
      return "Izin kamera ditolak. Izinkan akses kamera melalui pengaturan browser.";
    }

    if (error.name === "NotFoundError") {
      return "Kamera tidak ditemukan di perangkat ini.";
    }

    if (error.name === "NotReadableError") {
      return "Kamera sedang dipakai aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.";
    }
  }

  return "Kamera belum bisa dibuka. Coba lagi atau unggah foto dari perangkat.";
}

export default function WebcamCapture({
  onCapture,
  disabled = false,
}: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestId = useRef(0);

  const [open, setOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    requestId.current += 1;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setOpen(false);
    setStarting(false);
    setReady(false);
  }, []);

  useEffect(() => {
    return () => {
      requestId.current += 1;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!open || !videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const token = requestId.current;

    video.srcObject = streamRef.current;

    void video.play().catch(() => {
      if (token !== requestId.current) return;

      stopCamera();
      setError("Video kamera tidak dapat diputar. Silakan buka kamera lagi.");
    });
  }, [open, stopCamera]);

  async function startCamera() {
    if (disabled || starting || open) return;

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError(
        "Kamera memerlukan HTTPS atau localhost. Kamu tetap bisa mengunggah foto.",
      );
      return;
    }

    const token = ++requestId.current;

    setStarting(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      if (token !== requestId.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      setOpen(true);
    } catch (error) {
      if (token === requestId.current) {
        setError(cameraMessage(error));
      }
    } finally {
      if (token === requestId.current) {
        setStarting(false);
      }
    }
  }

  function capture() {
    const video = videoRef.current;

    if (disabled || !ready || !video?.videoWidth || !video.videoHeight) {
      return;
    }

    try {
      const canvas = document.createElement("canvas");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Canvas tidak tersedia.");
      }

      // Preview bercermin; file foto memakai orientasi asli kamera.
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const image = canvas.toDataURL("image/png");

      stopCamera();
      onCapture(image);
    } catch {
      setError("Foto belum berhasil diambil. Silakan coba lagi.");
    }
  }

  return (
    <div className="space-y-3">
      {open ? (
        <>
          <div className="overflow-hidden rounded-xl bg-stone-900">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedData={() => setReady(true)}
              className="block aspect-[4/3] w-full -scale-x-100 object-cover"
            />
          </div>

          <p className="text-xs text-stone-500">
            Preview bercermin. Hasil foto mengikuti orientasi asli kamera.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={stopCamera}
              className={secondaryButton}
            >
              Tutup kamera
            </button>

            <button
              type="button"
              disabled={disabled || !ready}
              onClick={capture}
              className={primaryButton}
            >
              <EditorIcon name="camera" className="h-4 w-4" />
              Ambil foto
            </button>
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => void startCamera()}
            disabled={disabled || starting}
            className={`${secondaryButton} w-full py-5`}
          >
            <EditorIcon name="camera" className="h-5 w-5" />
            {starting ? "Menunggu izin kamera…" : "Buka kamera"}
          </button>

          {starting && (
            <button
              type="button"
              onClick={stopCamera}
              className="text-xs text-stone-500 hover:underline"
            >
              Batalkan
            </button>
          )}
        </>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm leading-5 text-red-900"
        >
          {error}
        </p>
      )}
    </div>
  );
}
