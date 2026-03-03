// barcode_generator.js (ESM)
import JsBarcode from "jsbarcode";

export function barcode_generator() {
  if (document.getElementById("barcode-generator-modal")) return;

  const overlay = document.createElement("div");
  overlay.id = "barcode-generator-modal";
  overlay.onclick = (e) => e.target === overlay && overlay.remove();

  Object.assign(overlay.style, {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
    padding: "16px",
  });

  const modal = document.createElement("div");
  modal.onclick = (e) => e.stopPropagation();
  Object.assign(modal.style, {
    width: "min(560px,100%)",
    background: "var(--color-bg-card)",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
    overflow: "hidden",
  });

  const header = document.createElement("div");
  Object.assign(header.style, {
    padding: "16px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  });

  const title = document.createElement("div");
  title.textContent = "Barcode Generator";
  Object.assign(title.style, {
    color: "var(--color-text-primary)",
    fontWeight: 800,
    fontSize: "16px",
  });

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.onclick = () => overlay.remove();
  Object.assign(closeBtn.style, {
    cursor: "pointer",
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "rgba(10,15,28,0.6)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "var(--color-text-primary)",
  });

  header.append(title, closeBtn);

  const body = document.createElement("div");
  Object.assign(body.style, {
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  });

  const input = document.createElement("input");
  input.placeholder = "Enter barcode value (e.g. 123456789)";
  Object.assign(input.style, {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "var(--color-bg-section)",
    color: "var(--color-text-primary)",
    outline: "none",
  });

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  Object.assign(svg.style, {
    marginTop: "12px",
    background: "#fff",
    borderRadius: "8px",
    alignSelf: "center",
    width: "100%",
    maxWidth: "420px",
  });

  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "Download Barcode";
  downloadBtn.disabled = true;

  Object.assign(downloadBtn.style, {
    marginTop: "8px",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    border: "none",
    fontWeight: "700",
    background: "var(--color-accent)",
    color: "var(--color-bg-dark)",
    opacity: "0.6",
  });

  body.append(input, svg, downloadBtn);
  modal.append(header, body);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const render = () => {
    const val = input.value.trim();
    if (!val) {
      downloadBtn.disabled = true;
      downloadBtn.style.opacity = "0.6";
      svg.innerHTML = "";
      return;
    }

    try {
      JsBarcode(svg, val, {
        format: "CODE128",
        displayValue: true,
        background: "#ffffff",
        lineColor: "#000000",
        height: 80,
        margin: 10,
      });

      downloadBtn.disabled = false;
      downloadBtn.style.opacity = "1";
    } catch {
      downloadBtn.disabled = true;
      downloadBtn.style.opacity = "0.6";
    }
  };

  input.addEventListener("input", render);

  downloadBtn.onclick = () => {
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "barcode.svg";
    a.click();

    URL.revokeObjectURL(url);
  };
}
