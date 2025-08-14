import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost";
  size?: "sm" | "md" | "icon";
};

export function Button({ className="", variant="default", size="md", ...props }: Props) {
  const v =
    variant === "secondary" ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
    : variant === "ghost" ? "bg-transparent text-gray-900 hover:bg-gray-100"
    : "bg-green-600 text-white hover:bg-green-700";
  const sz =
    size === "icon" ? "h-9 w-9 p-0"
    : size === "sm" ? "h-8 px-3"
    : "h-9 px-3";
  return (
    <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium ${v} ${sz} ${className}`} {...props}/>
  );
}
