export async function copyLink(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* HTTP da rede pode não oferecer a Clipboard API. */ }
  const previous = document.activeElement as HTMLElement | null;
  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.cssText = "position:fixed;left:-9999px;top:0";
  document.body.append(input);
  input.focus();
  input.select();
  let copied = false;
  try { copied = Boolean(document.execCommand?.("copy")); } catch { /* Exibir campo manual. */ }
  input.remove();
  previous?.focus();
  return copied;
}
