// src/main.ts
type RouteKey = "home" | "github" | "about" | "contact";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  opts?: {
    text?: string;
    attrs?: Record<string, string>;
    style?: Partial<CSSStyleDeclaration>;
    className?: string;
  },
) {
  const node = document.createElement(tag);
  if (opts?.text != null) node.textContent = opts.text;
  if (opts?.className) node.className = opts.className;
  if (opts?.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) node.setAttribute(k, v);
  }
  if (opts?.style) Object.assign(node.style, opts.style);
  return node;
}

function setActiveNav(active: RouteKey, buttons: Record<RouteKey, HTMLButtonElement>) {
  (Object.keys(buttons) as RouteKey[]).forEach((k) => {
    const isActive = k === active;
    Object.assign(buttons[k].style, {
      background: isActive ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
      boxShadow: isActive ? "0 10px 28px rgba(0,0,0,0.35)" : "none",
    });
    if (isActive) buttons[k].setAttribute("aria-current", "page");
    else buttons[k].removeAttribute("aria-current");
  });
}

function parseHash(): RouteKey {
  const h = window.location.hash.replace("#", "");
  if (h === "home" || h === "github" || h === "about" || h === "contact") return h;
  return "home";
}

function go(route: RouteKey) {
  window.location.hash = route;
}

function mountApp(root: HTMLElement) {
  // Root reset
  root.innerHTML = "";
  Object.assign(root.style, {
    minHeight: "100vh",
  });

  // ===== Header =====
  const header = el("header", {
    style: {
      position: "sticky",
      top: "0",
      zIndex: "50",
      backdropFilter: "blur(10px)",
      // WebkitBackdropFilter: "blur(10px)",
      borderBottom: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(0,0,0,0.35)",
    },
  });

  const headerInner = el("div", {
    style: {
      maxWidth: "1100px",
      margin: "0 auto",
      padding: "14px 18px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
    },
  });

  // Brand (Left)
  const brand = el("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      userSelect: "none",
      cursor: "pointer",
    },
    attrs: { role: "link", tabindex: "0", "aria-label": "Go to Home" },
  });

  const badge = el("div", {
    style: {
      width: "40px",
      height: "40px",
      borderRadius: "999px",
      border: "1px solid rgba(255,255,255,0.22)",
      display: "grid",
      placeItems: "center",
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    },
  });
  const badgeText = el("span", { text: "Y", style: { fontWeight: "800" } });
  badge.appendChild(badgeText);

  const brandText = el("div", {
    style: { display: "flex", flexDirection: "column", lineHeight: "1.05" },
  });
  brandText.appendChild(el("span", { text: "YUKANG", style: { fontWeight: "800", letterSpacing: "1.6px" } }));
  brandText.appendChild(el("span", { text: "Developer • Portfolio", style: { fontSize: "12px", opacity: "0.75" } }));

  brand.appendChild(badge);
  brand.appendChild(brandText);

  brand.addEventListener("click", () => go("home"));
  brand.addEventListener("keydown", (e) => {
    if (e.key === "Enter") go("home");
  });

  // Nav (Right)
  const nav = el("nav", {
    attrs: { "aria-label": "Main navigation" },
    style: { display: "flex", alignItems: "center", gap: "10px" },
  });

  const pillStyleBase: Partial<CSSStyleDeclaration> = {
    padding: "10px 12px",
    borderRadius: "999px",
    fontWeight: "700",
    fontSize: "13px",
    letterSpacing: "0.4px",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    cursor: "pointer",
    transition: "transform 0.15s ease, background 0.15s ease",
  };

  const btnGithub = el("button", { text: "GitHub", style: { ...pillStyleBase } });
  const btnAbout = el("button", { text: "About Me", style: { ...pillStyleBase } });
  const btnContact = el("button", { text: "Contact Me", style: { ...pillStyleBase } });

  const buttons: Record<RouteKey, HTMLButtonElement> = {
    home: el("button", { text: "Home", style: { display: "none" } }), // 不显示，但方便统一处理
    github: btnGithub,
    about: btnAbout,
    contact: btnContact,
  };

  btnGithub.addEventListener("click", () => go("github"));
  btnAbout.addEventListener("click", () => go("about"));
  btnContact.addEventListener("click", () => go("contact"));

  [btnGithub, btnAbout, btnContact].forEach((b) => {
    b.addEventListener("mousedown", () => (b.style.transform = "scale(0.98)"));
    b.addEventListener("mouseup", () => (b.style.transform = "scale(1)"));
    b.addEventListener("mouseleave", () => (b.style.transform = "scale(1)"));
  });

  nav.appendChild(btnGithub);
  nav.appendChild(btnAbout);
  nav.appendChild(btnContact);

  headerInner.appendChild(brand);
  headerInner.appendChild(nav);
  header.appendChild(headerInner);

  // ===== Main =====
  const main = el("main", {
    style: {
      maxWidth: "1100px",
      margin: "0 auto",
      padding: "28px 18px 40px",
    },
  });

  // Hero
  const hero = el("section", {
    attrs: { id: "home" },
    style: {
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "18px",
      padding: "22px",
      background: "rgba(255,255,255,0.04)",
      boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
      marginBottom: "18px",
    },
  });

  const heroRow = el("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
      flexWrap: "wrap",
    },
  });

  const heroTextBox = el("div", { style: { minWidth: "240px" } });
  heroTextBox.appendChild(el("h1", { text: "YUKANG", style: { margin: "0", letterSpacing: "0.6px" } }));
  const p = el("p", { style: { margin: "8px 0 0", opacity: "0.8" } });
  p.appendChild(document.createTextNode("我是程序员。写产品、写系统、写体验。"));
  p.appendChild(el("br"));
  p.appendChild(document.createTextNode("React + Vite + Hono + Cloudflare Workers。"));
  heroTextBox.appendChild(p);

  const logoRow = el("div", {
    style: { display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" },
  });

  // 你要继续用原本的 logo 图，也可以用 <img> DOM 方式插
  const mkLogo = (src: string, href: string, alt: string) => {
    const a = el("a", { attrs: { href, target: "_blank", rel: "noreferrer" } });
    const img = el("img", { attrs: { src, alt } });
    img.className = "logo"; // 继续用你 App.css 的 logo 样式
    a.appendChild(img);
    return a;
  };

  logoRow.appendChild(mkLogo("/vite.svg", "https://vite.dev", "Vite logo"));
  logoRow.appendChild(mkLogo("/src/assets/react.svg", "https://react.dev", "React logo"));
  logoRow.appendChild(mkLogo("/src/assets/hono.svg", "https://hono.dev/", "Hono logo"));
  logoRow.appendChild(mkLogo("/src/assets/Cloudflare_Logo.svg", "https://workers.cloudflare.com/", "Cloudflare logo"));

  heroRow.appendChild(heroTextBox);
  heroRow.appendChild(logoRow);
  hero.appendChild(heroRow);

  // ===== app_container（你要的留空容器） =====
  const appContainer = el("section", {
    attrs: { id: "app_container" },
    style: {
      border: "1px dashed rgba(255,255,255,0.22)",
      borderRadius: "18px",
      padding: "20px",
      minHeight: "240px",
      background: "rgba(255,255,255,0.03)",
    },
  });

  appContainer.appendChild(el("div", { text: "app_container（留空给你）", style: { opacity: "0.7", fontWeight: "700" } }));

  // Anchors sections
  const mkSection = (id: RouteKey, title: string, desc: string) => {
    const s = el("section", { attrs: { id }, style: { marginTop: "26px" } });
    s.appendChild(el("h2", { text: title, style: { marginBottom: "8px" } }));
    s.appendChild(el("p", { text: desc, style: { opacity: "0.8" } }));
    return s;
  };

  const secGithub = mkSection("github", "GitHub", "这里放你的 GitHub 链接、项目列表、精选 repo。");
  const secAbout = mkSection("about", "About Me", "这里写你的简介：擅长什么、做过什么系统、技术栈。");
  const secContact = mkSection("contact", "Contact Me", "这里放 Email / Telegram / LinkedIn / 表单。");

  main.appendChild(hero);
  main.appendChild(appContainer);
  main.appendChild(secGithub);
  main.appendChild(secAbout);
  main.appendChild(secContact);

  // Mount
  root.appendChild(header);
  root.appendChild(main);

  // Route sync
  const sync = () => {
    const r = parseHash();
    setActiveNav(r, buttons);
    const target = document.getElementById(r);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  window.addEventListener("hashchange", sync);
  // initial
  setActiveNav(parseHash(), buttons);
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");
mountApp(root);
