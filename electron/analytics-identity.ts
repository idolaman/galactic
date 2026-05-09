import crypto from "node:crypto";
import os from "node:os";

export const getAnalyticsDistinctId = (): string => {
  const machineId = `${process.platform}-${process.arch}-${os.hostname()}`;
  return crypto.createHash("sha256").update(machineId).digest("hex").slice(0, 16);
};
