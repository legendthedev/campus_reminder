import { HTMLAttributes } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-white rounded-xl border border-gray-100 shadow-sm",
        hover && "hover:shadow-md hover:border-gray-200 transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("px-6 py-4 border-b border-gray-50", className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("px-6 py-4", className)} {...props}>
      {children}
    </div>
  );
}
