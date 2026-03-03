import { motion } from "framer-motion";
import { useRef } from "react";

function ContactCard({ icon, text, href }) {
  const ref = useRef(null);

  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ref.current.style.setProperty("--x", `${x}px`);
    ref.current.style.setProperty("--y", `${y}px`);
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      target="_blank"
      onMouseMove={handleMove}
      whileHover={{ y: -6, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="
        relative flex items-center gap-3
        px-6 py-4 rounded-xl
        bg-[rgba(255,255,255,0.03)]
        border border-[rgba(255,255,255,0.08)]
        backdrop-blur-xl
        overflow-hidden
        shadow-xl
        group
      "
    >
      {/* Mouse glow */}
      <div
        className="
          absolute inset-0 opacity-0 group-hover:opacity-100
          transition-opacity duration-300
        "
        style={{
          background:
            "radial-gradient(200px circle at var(--x) var(--y), var(--color-accent), transparent 40%)",
        }}
      />

      {/* Content */}
      <span className="lucide-icon text-[var(--color-accent)] text-xl relative z-10">
        {icon}
      </span>

      <span className="text-[var(--color-text-primary)] font-mono text-sm relative z-10">
        {text}
      </span>
    </motion.a>
  );
}

function Contact() {
  const contacts = [
    {
      icon: "mail",
      text: "yukang@utbabuddha.com",
      href: "mailto:yukang@utbabuddha.com",
    },
    {
      icon: "code",
      text: "github.com/lowyihong1314",
      href: "https://github.com/lowyihong1314",
    },
  ];

  return (
    <section
      id="contact"
      className="
        relative w-full flex flex-col items-center
        gap-10 px-6 lg:px-[120px] py-20 overflow-hidden
      "
    >
      {/* 🌌 Background energy */}
      <motion.div
        className="absolute inset-0 -z-10 opacity-20"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          background:
            "linear-gradient(120deg, transparent, var(--color-accent), transparent)",
          backgroundSize: "200% 200%",
          filter: "blur(140px)",
        }}
      />

      {/* Header */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-[var(--color-accent)] font-mono text-xs font-semibold tracking-[2px]">
          GET IN TOUCH
        </div>

        <h2 className="text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)]">
          Let's Build Something Together
        </h2>

        <p className="text-[var(--color-text-secondary)] max-w-[500px]">
          Open to new opportunities and exciting projects
        </p>
      </div>

      {/* Contact cards */}
      <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
        {contacts.map((c, i) => (
          <ContactCard key={i} {...c} />
        ))}
      </div>
    </section>
  );
}

export default Contact;
