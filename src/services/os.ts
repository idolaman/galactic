export const chooseProjectDirectory = async (): Promise<string | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return await window.electronAPI?.chooseProjectDirectory?.() ?? null;
  } catch (error) {
    console.error("Failed to choose project directory:", error);
    return null;
  }
};

