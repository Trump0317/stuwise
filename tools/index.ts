import type { AgentTool, ExecutionEnv } from "@earendil-works/pi-agent-core";
import { createReadTool } from "./read";
import { createWriteTool } from "./write";
import { createEditTool } from "./edit";
import { createLsTool } from "./ls";
import { createGrepTool } from "./grep";
import { createFindTool } from "./find";
import { createBashTool } from "./bash";
import { createWebSearchTool } from "./web-search";
import { createWebFetchTool } from "./web-fetch";

export function createAllTools(env: ExecutionEnv): AgentTool[] {
  return [
    createReadTool(env),
    createWriteTool(env),
    createEditTool(env),
    createLsTool(env),
    createGrepTool(env),
    createFindTool(env),
    createBashTool(env),
    createWebSearchTool(),
    createWebFetchTool(),
  ];
}
