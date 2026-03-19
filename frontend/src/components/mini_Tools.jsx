import { qr_generator } from "../tools/qr_generator";
import { barcode_generator } from "../tools/barcode_generator";
import { heic_to_jpg } from "../tools/heic_to_jpg";
import { auth_tool } from "../tools/auth_tool";

async function openDashboardOrAuth() {
    try {
        const response = await fetch("/api/auth/me", { method: "GET" });

        if (response.ok) {
            window.location.assign("/dashboard");
            return;
        }
    } catch {
        // Fall back to auth modal if the auth check fails.
    }

    auth_tool();
}
// mini_Tools.jsx
export function mini_Tools() {
    // 防止重复打开
    if (document.getElementById("mini-tools-modal")) return;

    const overlay = document.createElement("div");
    overlay.id = "mini-tools-modal";

    // 点背景关闭
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
    });

    Object.assign(overlay.style, {
        position: "fixed",
        inset: "0",
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "9999",
        padding: "16px",
    });

    const modal = document.createElement("div");
    modal.addEventListener("click", (e) => e.stopPropagation());

    Object.assign(modal.style, {
        width: "min(720px, 100%)",
        borderRadius: "16px",
        background: "var(--color-bg-card)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
        overflow: "hidden",
    });

    // Header
    const header = document.createElement("div");
    Object.assign(header.style, {
        padding: "16px 18px",
        background: "linear-gradient(180deg, rgba(34,211,238,0.10), rgba(34,211,238,0.00))",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
    });

    const titleWrap = document.createElement("div");

    const title = document.createElement("div");
    title.textContent = "mini_tools";
    Object.assign(title.style, {
        color: "var(--color-text-primary)",
        fontWeight: "800",
        letterSpacing: "0.3px",
        fontSize: "16px",
    });

    const subtitle = document.createElement("div");
    subtitle.textContent = "Quick utilities for your workflow";
    Object.assign(subtitle.style, {
        color: "var(--color-text-secondary)",
        fontSize: "12px",
        marginTop: "2px",
    });

    titleWrap.appendChild(title);
    titleWrap.appendChild(subtitle);

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.innerHTML = "✕";
    closeBtn.addEventListener("click", () => overlay.remove());
    Object.assign(closeBtn.style, {
        cursor: "pointer",
        width: "36px",
        height: "36px",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(10,15,28,0.55)",
        color: "var(--color-text-primary)",
        fontSize: "14px",
        lineHeight: "1",
        display: "grid",
        placeItems: "center",
        transition: "transform 0.15s ease, opacity 0.15s ease",
    });
    closeBtn.addEventListener("mouseenter", () => (closeBtn.style.opacity = "0.85"));
    closeBtn.addEventListener("mouseleave", () => (closeBtn.style.opacity = "1"));

    header.appendChild(titleWrap);
    header.appendChild(closeBtn);

    // Body
    const body = document.createElement("div");
    Object.assign(body.style, {
        padding: "18px",
        display: "flex",
        flexWrap: "wrap",
        gap: "14px",
    });

    const makeToolCard = ({ name, desc, badge, onClick }) => {
        const card = document.createElement("button");
        card.type = "button";
        card.addEventListener("click", onClick);

        Object.assign(card.style, {
            cursor: "pointer",
            textAlign: "left",
            borderRadius: "14px",
            padding: "16px",
            background: "var(--color-bg-section)",
            border: "1px solid rgba(255,255,255,0.08)",
            transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
        });

        card.addEventListener("mouseenter", () => {
            card.style.transform = "translateY(-2px)";
            card.style.borderColor = "rgba(34,211,238,0.55)";
            card.style.boxShadow = "0 10px 30px rgba(0,0,0,0.35)";
        });
        card.addEventListener("mouseleave", () => {
            card.style.transform = "translateY(0)";
            card.style.borderColor = "rgba(255,255,255,0.08)";
            card.style.boxShadow = "none";
        });

        const topRow = document.createElement("div");
        Object.assign(topRow.style, {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            marginBottom: "10px",
        });

        const toolName = document.createElement("div");
        toolName.textContent = name;
        Object.assign(toolName.style, {
            color: "var(--color-text-primary)",
            fontWeight: "800",
            fontSize: "14px",
            letterSpacing: "0.2px",
        });

        const toolBadge = document.createElement("div");
        toolBadge.textContent = badge;
        Object.assign(toolBadge.style, {
            color: "var(--color-bg-dark)",
            background: "var(--color-accent)",
            padding: "4px 8px",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: "800",
            whiteSpace: "nowrap",
        });

        const toolDesc = document.createElement("div");
        toolDesc.textContent = desc;
        Object.assign(toolDesc.style, {
            color: "var(--color-text-secondary)",
            fontSize: "12px",
            lineHeight: "1.45",
        });

        const hint = document.createElement("div");
        hint.textContent = "Click to open →";
        Object.assign(hint.style, {
            marginTop: "12px",
            color: "var(--color-primary)",
            fontSize: "12px",
            fontWeight: "700",
        });

        topRow.appendChild(toolName);
        topRow.appendChild(toolBadge);

        card.appendChild(topRow);
        card.appendChild(toolDesc);
        card.appendChild(hint);

        return card;
    };

    // 两个工具（先占位）
    const qrCard = makeToolCard({
        name: "QR Generator",
        desc: "Generate a QR code from text/URL, then download.",
        badge: "QR",
        onClick: () => {
            const overlay = document.getElementById("mini-tools-modal");
            if (overlay) overlay.remove();
            qr_generator();
        },
    });


    const heicCard = makeToolCard({
        name: "HEIC → JPG",
        desc: "Convert iPhone HEIC images to JPG locally in browser.",
        badge: "HEIC",
        onClick: () => {
            const overlay = document.getElementById("mini-tools-modal");
            if (overlay) overlay.remove();
            heic_to_jpg();
        },
    });

    const barcodeCard = makeToolCard({
        name: "Barcode Generator",
        desc: "Generate a CODE128 barcode, then download.",
        badge: "BAR",
        onClick: () => {
            const overlay = document.getElementById("mini-tools-modal");
            if (overlay) overlay.remove();
            barcode_generator();
        },
    });

    const authCard = makeToolCard({
        name: "Dashboard / Login",
        desc: "Open your dashboard if signed in, or login/register first.",
        badge: "AUTH",
        onClick: async () => {
            const overlay = document.getElementById("mini-tools-modal");
            if (overlay) overlay.remove();
            await openDashboardOrAuth();
        },
    });

    body.appendChild(qrCard);
    body.appendChild(barcodeCard);
    body.appendChild(heicCard);
    body.appendChild(authCard);

    // Footer
    const footer = document.createElement("div");
    Object.assign(footer.style, {
        padding: "14px 18px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        color: "var(--color-text-muted)",
        fontSize: "12px",
    });

    const left = document.createElement("div");
    left.textContent = "Esc / click outside to close";

    const right = document.createElement("div");
    right.textContent = "v0.1";

    footer.appendChild(left);
    footer.appendChild(right);

    // Esc 关闭
    const onKeyDown = (e) => {
        if (e.key === "Escape") {
            overlay.remove();
            window.removeEventListener("keydown", onKeyDown);
        }
    };
    window.addEventListener("keydown", onKeyDown);

    // 关闭时顺便清掉 listener
    const originalRemove = overlay.remove.bind(overlay);
    overlay.remove = () => {
        window.removeEventListener("keydown", onKeyDown);
        originalRemove();
    };

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}
