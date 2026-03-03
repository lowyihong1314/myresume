import { motion } from "framer-motion";

function SkillCard({ icon, name, level }) {
  // 把 level 转成百分比（支持 "90%" 或 "Advanced" 这种）
  const percent =
    typeof level === "string" && level.includes("%")
      ? parseInt(level)
      : 80; // 默认值

  return (
    <motion.div
      whileHover={{
        y: -8,
        scale: 1.04,
      }}
      transition={{ type: "spring", stiffness: 200 }}
      className="relative w-full flex flex-col items-center gap-4
                 bg-[var(--color-bg-card)] rounded-xl
                 p-6 overflow-hidden group cursor-default"
    >
      {/* 🌟 Glow effect */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100
                   transition duration-500 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, var(--color-accent)20, transparent 70%)",
        }}
      />

      {/* Icon */}
      <motion.span
        whileHover={{ rotate: 8 }}
        className="relative z-10 lucide-icon
                   text-[var(--color-accent)] text-[34px]"
        style={{ fontWeight: 100 }}
      >
        {icon}
      </motion.span>

      {/* Name */}
      <div
        className="relative z-10 text-[var(--color-text-primary)]
                   font-secondary text-base font-semibold text-center"
      >
        {name}
      </div>

      {/* Level text */}
      <div
        className="relative z-10 text-[var(--color-accent)]
                   font-primary text-xs"
      >
        {level}
      </div>

      {/* Progress bar */}
      <div className="relative z-10 w-full h-2 bg-black/20 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true }}
          className="h-full bg-[var(--color-accent)] rounded-full"
        />
      </div>
    </motion.div>
  );
}

export default SkillCard;
