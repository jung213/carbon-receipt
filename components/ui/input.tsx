import * as React from "react";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm ${className}`} {...props} />;
}
