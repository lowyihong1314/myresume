// heic_to_jpg.js (ESM)
import heic2any from "heic2any";

export function heic_to_jpg() {
  if (document.getElementById("heic-to-jpg-modal")) return;

  const overlay = document.createElement("div");
  overlay.id = "heic-to-jpg-modal";
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
    width: "min(620px,100%)",
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
  title.textContent = "HEIC → JPG";
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
  input.type = "file";
  input.accept = ".heic,image/heic";
  input.multiple = true;
  Object.assign(input.style, {
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "var(--color-bg-section)",
    color: "var(--color-text-primary)",
  });

  const list = document.createElement("div");
  Object.assign(list.style, {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontSize: "12px",
    color: "var(--color-text-secondary)",
  });

  const downloadAllBtn = document.createElement("button");
  downloadAllBtn.textContent = "Convert & Download";
  downloadAllBtn.disabled = true;

  Object.assign(downloadAllBtn.style, {
    marginTop: "6px",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    border: "none",
    fontWeight: "700",
    background: "var(--color-accent)",
    color: "var(--color-bg-dark)",
    opacity: "0.6",
  });

  body.append(input, list, downloadAllBtn);
  modal.append(header, body);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  let files = [];

  input.onchange = () => {
    files = Array.from(input.files || []);
    list.innerHTML = "";
    files.forEach((f) => {
      const item = document.createElement("div");
      item.textContent = `• ${f.name}`;
      list.appendChild(item);
    });

    downloadAllBtn.disabled = files.length === 0;
    downloadAllBtn.style.opacity = files.length ? "1" : "0.6";
  };

  downloadAllBtn.onclick = async () => {
    for (const file of files) {
      const blob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.95,
      });

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = file.name.replace(/\.heic$/i, ".jpg");
      a.click();
      URL.revokeObjectURL(a.href);
    }
  };
}
