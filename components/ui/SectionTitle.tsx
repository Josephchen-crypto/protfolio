interface SectionTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionTitle({ title, subtitle, className = "" }: SectionTitleProps) {
  return (
    <div className={`mb-12 ${className}`}>
      <div className="w-12 h-0.5 bg-gradient-to-r from-primary to-neon-cyan rounded-full mb-4" />
      <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-3">
        {title}
      </h2>
      {subtitle && <p className="text-slate-400 text-lg">{subtitle}</p>}
    </div>
  );
}
