function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 bg-[var(--color-bg-section)] px-4 md:px-8 lg:px-[120px] py-6 md:py-8">
      <div className="text-[var(--color-text-muted)] font-primary text-xs text-center md:text-left">
        © 2025 LOW YI HONG. From electrician to developer - Building the future with code.
      </div>
      <div className="flex gap-6 md:gap-8">
        <a href="#" className="text-[var(--color-text-muted)] font-primary text-xs hover:text-[var(--color-accent)] transition-colors">
          Privacy
        </a>
        <a href="#" className="text-[var(--color-text-muted)] font-primary text-xs hover:text-[var(--color-accent)] transition-colors">
          Terms
        </a>
        <button
          onClick={scrollToTop}
          className="text-[var(--color-accent)] font-primary text-xs hover:opacity-80 transition-opacity"
        >
          Back to Top ↑
        </button>
      </div>
    </footer>
  );
}

export default Footer;
