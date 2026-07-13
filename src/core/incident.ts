import type { AntiSpamIncident, ModuleContext } from "./types.js";

let sequence = 0;

export const createModuleContext = (): ModuleContext => ({
  createIncident(input): AntiSpamIncident {
    sequence += 1;
    return {
      ...input,
      id: `${input.moduleId}:${input.detectedAt}:${sequence}`,
    };
  },
});
