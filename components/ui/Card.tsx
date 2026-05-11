import { clsx } from "clsx";
import { type HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, hover = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "bg-surface border border-border rounded-xl p-6 transition-all duration-300",
          hover &&
            "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
