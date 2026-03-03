import SkillCard from './SkillCard';

function Skills() {
  const skills = [
    { icon: 'code', name: 'Python', level: 'Expert' },
    { icon: 'webhook', name: 'Flask', level: 'Expert' },
    { icon: 'javascript', name: 'JavaScript', level: 'Expert' },
    { icon: 'speed', name: 'Vite', level: 'Advanced' },
    { icon: 'storage', name: 'MySQL', level: 'Advanced' },
    { icon: 'database', name: 'PostgreSQL', level: 'Advanced' },
  ];

  return (
    <section id="skills" className="w-full flex flex-col gap-8 md:gap-10 bg-[var(--color-bg-section)] px-4 md:px-8 lg:px-[120px] py-12 md:py-[60px]">
      <div className="w-full flex flex-col items-center gap-3">
        <div className="text-[var(--color-accent)] font-primary text-xs font-semibold tracking-[2px]">
          TECH STACK
        </div>
        <h2 className="text-[var(--color-text-primary)] font-secondary text-2xl md:text-3xl lg:text-4xl font-bold text-center">
          Skills & Technologies
        </h2>
      </div>
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        {skills.map((skill, index) => (
          <SkillCard key={index} {...skill} />
        ))}
      </div>
    </section>
  );
}

export default Skills;
