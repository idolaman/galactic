import net from "node:net";
import { WORKSPACE_ISOLATION_SERVICE_PORT_START } from "./routing.js";

const isPortAvailable = (port: number): Promise<boolean> =>
  new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
  });

export const getNextAvailableServicePort = async (usedPorts: Set<number>): Promise<number> => {
  let port = WORKSPACE_ISOLATION_SERVICE_PORT_START;
  while (true) {
    if (!usedPorts.has(port) && await isPortAvailable(port)) {
      usedPorts.add(port);
      return port;
    }
    port += 1;
  }
};
