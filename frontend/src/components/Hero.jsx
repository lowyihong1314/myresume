import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";

function Hero() {
  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 40 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section
      id="hero"
      className="relative w-full flex flex-col lg:flex-row items-center gap-12 px-6 lg:px-[120px] py-24 overflow-hidden"
    >
      {/* 🌌 Animated background glow */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-[var(--color-accent)] opacity-20 blur-[160px] rounded-full -top-40 -left-40 animate-pulse" />
        <div className="absolute w-[500px] h-[500px] bg-blue-500 opacity-10 blur-[140px] rounded-full bottom-0 right-0 animate-pulse" />
      </div>

      {/* LEFT SIDE */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex-1 flex flex-col gap-6"
      >
        {/* Avatar with breathing animation */}
        <motion.div
          variants={item}
          animate={{
            scale: [1, 1.03, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
          }}
          className="w-40 h-40 rounded-full overflow-hidden border-4 border-[var(--color-accent)] shadow-2xl"
        >
          <img src="/avatar_420.png" className="w-full h-full object-cover" />
        </motion.div>

        <motion.div
          variants={item}
          className="text-[var(--color-accent)] font-mono text-sm"
        >
          {"// Electrician → Programmer"}
        </motion.div>

        {/* 🔥 Typing animation */}
        <motion.h1
          variants={item}
          className="text-5xl lg:text-6xl font-bold text-[var(--color-text-primary)]"
        >
          <TypeAnimation
            sequence={[
              "LOW YI HONG",
              2000,
              "yukang",
              1500,
              "宇康",
              1500,
              "阿康",
              1500,
              "Full Stack Developer",
              2000,
              "Python + React Builder",
              2000,
            ]}
            speed={40}
            repeat={Infinity}
          />
        </motion.h1>

        <motion.p
          variants={item}
          className="text-[var(--color-text-secondary)] max-w-[520px]"
        >
          Career switched during COVID-19. 6+ years industrial electrician →
          modern software engineer. Building scalable web systems with Flask,
          React & automation.
        </motion.p>

        <motion.div variants={item} className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="bg-[var(--color-accent)] text-black font-semibold px-8 py-4 rounded-lg shadow-lg"
            onClick={() =>
              document
                .getElementById("projects")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            View Projects
          </motion.button>

          <a href="tel:+601136600057">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="border border-[var(--color-accent)] text-[var(--color-accent)] px-8 py-4 rounded-lg"
            >
              Call Me
            </motion.button>
          </a>
        </motion.div>
      </motion.div>

      {/* RIGHT SIDE — 3D CODE CARD */}
      <motion.div
        initial={{ opacity: 0, rotateY: 20, x: 80 }}
        animate={{ opacity: 1, rotateY: 0, x: 0 }}
        transition={{ duration: 1 }}
        whileHover={{
          rotateX: 6,
          rotateY: -6,
          scale: 1.03,
        }}
        className="w-full lg:w-[500px] bg-[var(--color-bg-card)] rounded-xl shadow-2xl overflow-hidden perspective-1000"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="bg-[var(--color-bg-section)] px-4 py-3 flex gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <div className="w-3 h-3 bg-yellow-400 rounded-full" />
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span className="ml-2 text-xs text-gray-400 font-mono">
            developer.js
          </span>
        </div>

        <div className="p-6 font-mono text-sm space-y-2">
          <div className="text-gray-400">const developer = {"{"}</div>

          <div className="text-cyan-400">&nbsp;&nbsp;name: "LOW YI HONG",</div>
          <div className="text-cyan-400">
            &nbsp;&nbsp;phone: "+6011-3660-0057",
          </div>

          <div className="text-cyan-400">
            &nbsp;&nbsp;experience: "6+ years",
          </div>

          <div className="text-cyan-400">&nbsp;&nbsp;stack: [</div>

          <div className="text-purple-400 ml-6">
            "Python", "Flask", "React", "Automation"
          </div>

          <div className="text-cyan-400">&nbsp;&nbsp;],</div>

          <div className="text-green-400">&nbsp;&nbsp;available: true</div>

          <div className="text-gray-400">{"};"}</div>
        </div>
      </motion.div>
    </section>
  );
}

export default Hero;
