import * as React from "react";

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "outline";
};

export function Badge({ className="", variant="default", ...props }: Props) {
  const v =
    variant === "secondary" ? "bg-gray-200 text-gray-900"
    : variant === "outline" ? "border border-gray-300 text-gray-900"
    : "bg-green-600 text-white";
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${v} ${className}`} {...props} />;
}
