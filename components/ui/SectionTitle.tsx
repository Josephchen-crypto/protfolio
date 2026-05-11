interface SectionTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionTitle({ title, subtitle, className = "" }: SectionTitleProps) {
  return (
    <div className={`mb-12 ${className}`}>
      <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-3">
        {title}
      </h2>
      {subtitle && <p className="text-slate-400 text-lg">{subtitle}</p>}
    </div>
  );
}
