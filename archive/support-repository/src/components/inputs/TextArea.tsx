import { type TextareaHTMLAttributes, forwardRef } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, id, className = "", rows = 4, ...rest }, ref) => {
    const textareaId = id ?? rest.name;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-medium text-[#8B98A5]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={`resize-none rounded-md border bg-[#0B0F14] px-3 py-2 text-sm text-[#E6EDF3]
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

TextArea.displayName = "TextArea";

export default TextArea;
