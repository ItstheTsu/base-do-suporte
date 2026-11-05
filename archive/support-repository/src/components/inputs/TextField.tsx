import { type InputHTMLAttributes, forwardRef } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, id, className = "", ...rest }, ref) => {
    const inputId = id ?? rest.name;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-[#8B98A5]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`rounded-md border bg-[#0B0F14] px-3 py-2 text-sm text-[#E6EDF3]
            placeholder:text-[#5B6675] outline-none transition-colors
            ${error ? "border-[#F87171]" : "border-[#1F2733] focus:border-[#5EEAD4]/60"}
            ${className}`}
          {...rest}
        />
        {error && <span className="text-xs text-[#F87171]">{error}</span>}
      </div>
    );
  }
);

TextField.displayName = "TextField";

export default TextField;
