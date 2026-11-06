#!/usr/bin/env node
/**
 * One-command local stack: Hardhat node -> deploy ShinkanshenLocal -> Vite dev server.
 * Usage: pnpm dev:local   (PORT and HOST override the web server bind)
 */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const rpcUrl = "http://127.0.0.1:8545";
const children = [];

function run(name, cmd, args, cwd) {
  const child = spawn(cmd, args, { cwd, stdio: "inherit", env: process.env });
  child.on("exit", (code) => {
    if (code !== null && code !== 0 && !shuttingDown) {
      console.error(`[dev-local] ${name} exited with code ${code}`);
      shutdown(code);
    }
  });
  children.push(child);
  return child;
}

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill("SIGTERM");
  setTimeout(() => process.exit(code), 500);
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

async function waitForRpc(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
      });
      if (res.ok) return;
    } catch {
      // node not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Hardhat node did not come up at ${rpcUrl} within ${timeoutMs / 1000}s`);
}

const contractsDir = join(root, "contracts");
console.log("[dev-local] starting Hardhat node…");
run("hardhat node", "pnpm", ["run", "chain"], contractsDir);
await waitForRpc();

console.log("[dev-local] deploying ShinkanshenLocal…");
await new Promise((resolve, reject) => {
  const deploy = spawn("pnpm", ["run", "deploy:local"], { cwd: contractsDir, stdio: "inherit", env: process.env });
  deploy.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`deploy exited with ${code}`))));
}).catch((err) => {
  console.error(`[dev-local] ${err.message}`);
  shutdown(1);
});

if (!shuttingDown) {
  const port = process.env.PORT ?? "5173";
  const host = process.env.HOST ?? "0.0.0.0";
  console.log(`[dev-local] starting web on http://${host}:${port}`);
  run("vite", "pnpm", ["exec", "vite", "--host", host, "--port", port, "--strictPort"], join(root, "web"));
}
