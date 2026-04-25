export interface ClipboardWriter {
  writeText: (text: string) => Promise<void>;
}

export const copyTextToClipboard = async (
  text: string,
  clipboard?: ClipboardWriter,
): Promise<boolean> => {
  const writer = clipboard ?? globalThis.navigator?.clipboard;
  if (!writer?.writeText) {
    return false;
  }

  try {
    await writer.writeText(text);
    return true;
  } catch {
    return false;
  }
};
