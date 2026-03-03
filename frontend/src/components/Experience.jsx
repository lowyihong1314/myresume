import { motion } from "framer-motion";
import ExperienceCard from "./ExperienceCard";

function Experience() {
  const experiences = [
    {
      role: "Full Stack Developer",
      company: "Freelance & Contract Projects",
      date: "2020 - Present",
      description:
        "Developed ERP systems, CRM platforms, and e-commerce solutions using Python Flask and modern JS frameworks. Specialized in automation and workflow optimization.",
    },
    {
      role: "Senior Electrician",
      company: "Industrial & Commercial Projects",
      date: "2012 - 2020",
      description:
        "Specialized in industrial electrical systems, CCTV, alarms, and access control. Started working at age 13, building real-world engineering experience.",
    },
  ];

  return (
    <section
      id="experience"
      className="relative w-full flex flex-col gap-10 px-6 lg:px-[120px] py-20 overflow-hidden"
    >
      {/* 🌌 Animated background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">

        {/* moving gradient */}
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            background:
              "linear-gradient(120deg, transparent, var(--color-accent), transparent)",
            backgroundSize: "200% 200%",
            filter: "blur(120px)",
          }}
        />

        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `
              linear-gradient(var(--color-accent) 1px, transparent 1px),
              linear-gradient(90deg, var(--color-accent) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Header */}
      <div className="w-full flex flex-col items-center gap-3">
        <div className="text-[var(--color-accent)] font-mono text-xs font-semibold tracking-[2px]">
          WORK HISTORY
        </div>

        <h2 className="text-[var(--color-text-primary)] text-3xl lg:text-4xl font-bold text-center">
          Professional Experience
        </h2>
      </div>

      {/* Timeline */}
      <div className="relative w-full flex flex-col gap-8">

        {/* vertical line */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[2px] bg-[var(--color-accent)] opacity-20" />

        {experiences.map((exp, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.6,
              delay: index * 0.15,
            }}
            className={`w-full flex ${
              index % 2 === 0
                ? "md:justify-start"
                : "md:justify-end"
            }`}
          >
            <div className="w-full md:w-[48%]">
              <ExperienceCard {...exp} />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default Experience;
