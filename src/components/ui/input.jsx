
import React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
       "flex h-11 w-full rounded-md border border-[#3CB371] bg-white/90 px-4 py-2 text-base text-[#36383b] placeholder:text-[#3CB371] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8B57] focus-visible:ring-offset-2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
