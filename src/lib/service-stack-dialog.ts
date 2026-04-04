import { getNextMockServicePort } from "./service-stack-mock.js";
import type {
  ServiceStackConnection,
  ServiceStackEnvironment,
  ServiceStackService,
} from "../types/service-stack.js";

export const createMockId = () =>
  crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

export const createEmptyConnection = (): ServiceStackConnection => ({
  id: createMockId(),
  envKey: "",
  targetStackId: "",
  targetServiceId: "",
});

export const createEmptyService = (
  existingServices: ServiceStackService[],
  allStacks: ServiceStackEnvironment[],
): ServiceStackService => ({
  id: createMockId(),
  name: "",
  slug: "service",
  relativePath: "",
  port: getNextMockServicePort(
    allStacks,
    existingServices.map((service) => service.port),
  ),
  createdAt: Date.now(),
  connections: [],
});
