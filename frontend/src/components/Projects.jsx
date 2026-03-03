// Projects.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Projects() {
  const projects = useMemo(
    () => [
      {
        name: "Sim-Ray ERP",
        url: "https://sim-ray.com",
        description:
          "Large-scale manufacturing ERP platform spanning the full operational lifecycle: sales order intake, production planning and execution, machine and drawing/program management, purchasing and accounting workflows (including AutoCount integration), inventory/record control, internal task collaboration, and real-time operational dashboards and notifications.",
        tags: [
          "Python",
          "Flask",
          "PostgreSQL",
          "React",
          "Vite",
          "JavaScript",
          "Socket.IO",
          "Redis",
        ],
      },
      {
        name: "UTBA Buddha",
        url: "https://utbabuddha.com/?page=event_detail&event_id=91",
        description:
          "UTBA operations platform with event workflows, registration forms, payments, and role-based permissions.",
        tags: ["Python", "Flask", "MySQL", "React", "Vite", "JavaScript"],
      },
      {
        name: "BearBad",
        url: "https://bearbad.yihong1031.com",
        description:
          "Booking, cashier (POS), and reporting platform for Bear & Bad Theme Museum and BigGirl Cafe.",
        tags: ["Python", "Flask", "JavaScript", "Jinja2", "Socket.IO"],
      },
      {
        name: "Seng Chong Furniture",
        url: "https://sengchong.com",
        description:
          "Furniture catalog website with admin content editing, product image management, and authentication.",
        tags: ["Python", "Flask", "MySQL", "JavaScript", "Jinja2"],
      },
      {
        name: "Fantasy Adventure",
        url: "https://photo.yihong1031.com/",
        description: "Photography / gallery experience with fast browsing.",
        tags: ["Gallery", "CDN", "UX"],
      },
      {
        name: "Kelly Hardware",
        url: "https://kelly-hardware.com/#/products",
        description:
          "Hardware wholesale platform with product catalog, invoice workflow, delivery tracking, and settlement tools.",
        tags: ["Python", "Flask", "MySQL", "JavaScript", "Vite"],
      },
      {
        name: "Bank Rate (爬虫)",
        url: "https://bank-rate.utbabuddha.com/",
        description:
          "Forex rate crawler and dashboard that ingests Public Bank exchange data, stores history, and visualizes trends.",
        tags: [
          "Python",
          "Flask",
          "BeautifulSoup",
          "SQLite",
          "JavaScript",
          "Chart.js",
        ],
      },
      {
        name: "Greenstar HRMS",
        url: "https://hr.greenstar.work",
        description:
          "HRMS platform for employee records, attendance, leave approvals, payroll configuration, task tracking, and document workflows.",
        tags: [
          "Python",
          "Flask",
          "MySQL",
          "JavaScript",
          "Jinja2",
          "Socket.IO",
          "Redis",
        ],
      },
      {
        name: "World Buddhist Conference 2026",
        url: "https://wbc.ybam.org.my/",
        description:
          "Conference registration platform with paper submission, student verification uploads, payment gateway integration, and real-time admin updates.",
        tags: [
          "Python",
          "Flask",
          "SQLite",
          "JavaScript",
          "Flask-SocketIO",
          "Eventlet",
        ],
      },
    ],
    [],
  );

  const [index, setIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const autoplayRef = useRef(null);

  const next = () => setIndex((i) => (i + 1) % projects.length);
  const prev = () =>
    setIndex((i) => (i - 1 + projects.length) % projects.length);

  // 📱 Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // 🔁 Autoplay (desktop only)
  useEffect(() => {
    if (isMobile) return;
    if (isHovering) return;

    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => next(), 4500);

    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, isHovering, projects.length]);

  const openProject = (url) =>
    window.open(url, "_blank", "noopener,noreferrer");

  // =============================
  // 📱 MOBILE MODE (Click card to open)
  // =============================
  if (isMobile) {
    return (
      <section
        id="projects"
        className="w-full flex flex-col gap-6 px-4 py-12 bg-[var(--color-bg-section)]"
      >
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-2xl font-bold text-center text-[var(--color-text-primary)]">
            Projects
          </h2>
          <p className="text-sm opacity-80 text-center max-w-[720px] text-[var(--color-text-primary)]">
            Tap a card to open the live site.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {projects.map((p) => (
            <motion.button
              key={p.name}
              type="button"
              onClick={() => openProject(p.url)}
              whileTap={{ scale: 0.98 }}
              className="relative w-full h-[320px] rounded-xl overflow-hidden shadow-xl bg-black text-left"
              aria-label={`Open ${p.name}`}
            >
              {/* Preview (non-interactive so tap works reliably) */}
              <iframe
                src={p.url}
                title={p.name}
                className="w-full h-full pointer-events-none"
              />

              {/* Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-4 bg-black/60 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-white font-semibold">{p.name}</div>
                  <span className="text-xs text-white/80">Open ↗</span>
                </div>

                <div className="text-xs text-white/80 mt-1 leading-relaxed line-clamp-2">
                  {p.description}
                </div>

                {!!p.tags?.length && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {p.tags.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-white/90 border border-white/10"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </section>
    );
  }

  // =============================
  // 🖥 DESKTOP 3D CAROUSEL (center card clickable)
  // =============================
  return (
    <section
      id="projects"
      className="relative w-full h-[82vh] flex items-center justify-center overflow-hidden bg-[var(--color-bg-section)]"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Glow background */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div
          className="absolute w-[950px] h-[950px] blur-[190px] opacity-25"
          style={{
            background: "var(--color-accent)",
            top: "-280px",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
      </div>

      {/* Header */}
      <div className="absolute top-10 left-0 right-0 flex flex-col items-center gap-2 px-6">
        <h2 className="text-3xl font-bold text-center text-[var(--color-text-primary)]">
          Projects
        </h2>
        <p className="text-sm opacity-80 text-center max-w-[820px] text-[var(--color-text-primary)]">
          Drag left/right or use the arrows. Click the center card to open the
          site.
        </p>
      </div>

      {/* Carousel */}
      <div className="relative w-full max-w-[1400px] h-[620px] flex items-center justify-center perspective-[1200px]">
        {projects.map((p, i) => {
          const offset = i - index;

          // base
          let scale = 0.72;
          let x = offset * 420;
          let rotateY = offset * -35;
          let opacity = 0.35;
          let zIndex = 1;
          let blur = 2;

          const isCenter = offset === 0;

          if (isCenter) {
            scale = 1;
            x = 0;
            rotateY = 0;
            opacity = 1;
            zIndex = 10;
            blur = 0;
          }

          return (
            <motion.div
              key={p.name}
              className="absolute w-[840px] h-[540px] rounded-2xl overflow-hidden shadow-2xl bg-black"
              animate={{ x, scale, rotateY, opacity, zIndex }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(e, info) => {
                if (info.offset.x < -90) next();
                if (info.offset.x > 90) prev();
              }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Preview: keep non-interactive so drag works.
                  We open the site via overlay/button click. */}
              <iframe
                src={p.url}
                title={p.name}
                className="w-full h-full pointer-events-none"
              />

              {/* subtle blur for side cards */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backdropFilter: blur ? `blur(${blur}px)` : "none",
                  WebkitBackdropFilter: blur ? `blur(${blur}px)` : "none",
                }}
              />

              {/* Clickable overlay (only center card is clickable) */}
              <div className="absolute inset-x-0 bottom-0 p-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isCenter ? "center" : "side"}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-xl bg-black/55 backdrop-blur border border-white/10 p-4 text-white"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold">{p.name}</div>
                        <div className="text-sm text-white/80 mt-1 line-clamp-2">
                          {p.description}
                        </div>

                        {!!p.tags?.length && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {p.tags.slice(0, 5).map((t) => (
                              <span
                                key={t}
                                className="text-[11px] px-2 py-1 rounded-full bg-white/10 text-white/90 border border-white/10"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <motion.button
                        type="button"
                        onClick={() => isCenter && openProject(p.url)}
                        whileHover={isCenter ? { scale: 1.06 } : {}}
                        whileTap={isCenter ? { scale: 0.96 } : {}}
                        className={`shrink-0 px-4 py-2 rounded-lg border transition
                          ${
                            isCenter
                              ? "border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-black"
                              : "border-white/15 text-white/50 cursor-not-allowed"
                          }`}
                        aria-disabled={!isCenter}
                        title={
                          isCenter ? "Open site" : "Move to center to open"
                        }
                      >
                        Open ↗
                      </motion.button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Buttons */}
      {[
        { dir: "left", fn: prev },
        { dir: "right", fn: next },
      ].map((btn) => (
        <motion.button
          key={btn.dir}
          onClick={btn.fn}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className={`absolute ${
            btn.dir === "left" ? "left-8" : "right-8"
          } top-1/2 -translate-y-1/2 w-14 h-14 rounded-full backdrop-blur-xl
            bg-white/10 border border-white/20
            text-white text-2xl shadow-xl
            hover:bg-[var(--color-accent)] hover:text-black
            transition-all`}
          aria-label={btn.dir === "left" ? "Previous project" : "Next project"}
        >
          {btn.dir === "left" ? "←" : "→"}
        </motion.button>
      ))}

      {/* Dots */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2 px-6">
        {projects.map((p, i) => {
          const active = i === index;
          return (
            <button
              key={p.name}
              onClick={() => setIndex(i)}
              className={`h-2.5 rounded-full transition-all ${
                active
                  ? "w-8 bg-[var(--color-accent)]"
                  : "w-2.5 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Go to ${p.name}`}
            />
          );
        })}
      </div>
    </section>
  );
}
