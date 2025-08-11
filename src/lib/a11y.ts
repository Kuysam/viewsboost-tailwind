export function announce(message: string) {
  document.dispatchEvent(new CustomEvent("announce", { detail: message }));
}
