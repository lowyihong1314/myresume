import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { mini_Tools } from "./mini_Tools.jsx";
import { qr_generator } from "../tools/qr_generator";

function NavButton({ label, onClick, accent }) {
  const ref = useRef(null);

  const handleMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ref.current.style.setProperty("--x", `${x}px`);
    ref.current.style.setProperty("--y", `${y}px`);
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMove}
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative px-3 py-2 rounded-md
        font-mono text-sm
        overflow-hidden group
        transition-colors w-full text-left
        ${
          accent
            ? "text-[var(--color-accent)]"
            : "text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
        }
      `}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(120px circle at var(--x) var(--y), var(--color-accent), transparent 40%)",
        }}
      />

      <span className="relative z-10">{label}</span>
    </motion.button>
  );
}

function Header() {
  const [open, setOpen] = useState(false);

  const scrollToSection = (id) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const navItems = [
    { label: "Share()", action: qr_generator },
    { label: "projects()", action: () => scrollToSection("projects") },
    {
      label: "contact()",
      action: () => scrollToSection("contact"),
      accent: true,
    },
    { label: "Tools()", action: mini_Tools },
  ];

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="
        fixed top-0 left-0 w-full z-50
        backdrop-blur-xl
        bg-[rgba(10,15,28,0.6)]
        border-b border-[rgba(255,255,255,0.08)]
      "
    >
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{
          background: "var(--color-accent)",
          boxShadow: "0 0 12px var(--color-accent)",
        }}
      />

      <div className="flex items-center justify-between px-6 lg:px-[120px] py-4">
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="font-mono text-[var(--color-accent)] font-bold"
        >
          {"<LYH />"}
        </motion.div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item, i) => (
            <NavButton
              key={i}
              label={item.label}
              onClick={item.action}
              accent={item.accent}
            />
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-[var(--color-accent)] font-mono text-xl"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile slide menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="
              md:hidden fixed top-[64px] right-0 w-64 h-[calc(100vh-64px)]
              bg-[rgba(10,15,28,0.95)]
              backdrop-blur-xl
              border-l border-[rgba(255,255,255,0.08)]
              p-6 flex flex-col gap-4
            "
          >
            {navItems.map((item, i) => (
              <NavButton
                key={i}
                label={item.label}
                onClick={item.action}
                accent={item.accent}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export default Header;
