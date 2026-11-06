import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

function BarcodeInput({
  value,
  onChange,
  onScan,
  placeholder,
  disabled = false,
}) {
  const ref = useRef(null);
  const scannerRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = value.trim();

      if (code) {
        onScan(code);
      }
    }
  };

  const openScanner = async () => {
    if (disabled) return;

    setCameraOpen(true);

    setTimeout(async () => {
      const scanner = new Html5Qrcode("barcode-reader");
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
          },
          async (decodedText) => {
            onChange(decodedText);
            await closeScanner();

            // ส่งค่าที่สแกนได้ไปให้ SalesOrders ค้นหาสินค้า
            onScan(decodedText);
          },
          () => {
            // ไม่ต้องทำอะไรตอนยังอ่าน Barcode ไม่ได้
          }
        );
      } catch (err) {
        console.error("Camera scanner error:", err);
        setCameraOpen(false);
      }
    }, 100);
  };

  const closeScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error(err);
      }

      scannerRef.current = null;
    }

    setCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current?.clear().catch(() => {});
          });
      }
    };
  }, []);

  return (
    <>
      <div className="relative">
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          className="form-input pl-3 pr-10 font-mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
        />

        <button
          type="button"
          onClick={openScanner}
          disabled={disabled}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
          title="สแกน Barcode / QR Code"
        >
          <i className="fa-solid fa-barcode" />
        </button>
      </div>

      {cameraOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">
                สแกน Barcode / QR Code
              </h3>

              <button
                type="button"
                onClick={closeScanner}
                className="text-xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <div
              id="barcode-reader"
              className="overflow-hidden rounded-lg"
            />

            <p className="mt-3 text-center text-sm text-slate-500">
              วาง Barcode หรือ QR Code ให้อยู่ในกรอบ
            </p>

            <button
              type="button"
              onClick={closeScanner}
              className="btn btn-secondary mt-3 w-full"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default BarcodeInput;