import { motion } from "framer-motion";

function ExperienceCard({ role, company, date, description }) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      className="
        relative w-full flex flex-col gap-4
        bg-[rgba(255,255,255,0.03)]
        backdrop-blur-xl
        border border-[rgba(255,255,255,0.08)]
        rounded-xl
        p-6 md:p-8
        shadow-[0_10px_40px_rgba(0,0,0,0.4)]
        overflow-hidden
      "
    >
      {/* Glow accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[4px]"
        style={{
          background: "var(--color-accent)",
          boxShadow: "0 0 20px var(--color-accent)",
        }}
      />

      {/* Subtle animated highlight */}
      <motion.div
        className="absolute inset-0 opacity-0"
        whileHover={{ opacity: 0.08 }}
        transition={{ duration: 0.3 }}
        style={{
          background:
            "linear-gradient(120deg, transparent, var(--color-accent), transparent)",
        }}
      />

      {/* Header */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 relative z-10">
        <h3 className="text-[var(--color-text-primary)] text-lg md:text-xl font-semibold">
          {role}
        </h3>

        <span className="text-[var(--color-accent)] font-mono text-xs whitespace-nowrap">
          {date}
        </span>
      </div>

      {/* Company */}
      <div className="text-[var(--color-text-muted)] font-mono text-sm relative z-10">
        {company}
      </div>

      {/* Description */}
      <p className="text-[var(--color-text-secondary)] text-sm leading-[1.6] relative z-10">
        {description}
      </p>
    </motion.div>
  );
}

export default ExperienceCard;
