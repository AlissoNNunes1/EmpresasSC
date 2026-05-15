import { createServer as createTcp, Socket } from "net";
import { createServer as createHttp, request as makeRequest } from "http";
import { spawn, spawnSync } from "child_process";
import { networkInterfaces } from "os";

// ── build ─────────────────────────────────────────────────────────────────────

console.log("🔨 Compilando aplicação (next build)...\n");
const buildResult = spawnSync("npx", ["next", "build"], {
  stdio: "inherit",
  shell: true,
});

if (buildResult.status !== 0) {
  console.error("\n❌ Erro na compilação. Abortando...");
  process.exit(1);
}

console.log("\n✓ Compilação concluída com sucesso\n");

// ── utilidades ────────────────────────────────────────────────────────────────

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const s = createTcp();
    s.once("error", () => resolve(false));
    s.once("listening", () => { s.close(); resolve(true); });
    s.listen(port);
  });
}

async function findPort(start = 3000) {
  let port = start;
  while (!(await isPortAvailable(port))) {
    console.log(`Porta ${port} em uso, tentando ${port + 1}...`);
    port++;
  }
  return port;
}

function getLocalIP() {
  for (const iface of Object.values(networkInterfaces()).flat()) {
    if (iface?.family === "IPv4" && !iface.internal) return iface.address;
  }
  return null;
}

function waitForServer(port, timeoutMs = 60_000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const check = () => {
      const s = new Socket();
      s.setTimeout(500);
      s.once("connect", () => { s.destroy(); resolve(); });
      s.once("timeout", () => { s.destroy(); retry(); });
      s.once("error",   () => { s.destroy(); retry(); });
      s.connect(port, "127.0.0.1");
    };
    const retry = () => {
      if (Date.now() < deadline) setTimeout(check, 600);
      else reject(new Error(`Timeout aguardando porta ${port}`));
    };
    setTimeout(check, 1500);
  });
}

// ── portas ────────────────────────────────────────────────────────────────────

const publicPort   = await findPort(3000);
const internalPort = await findPort(publicPort + 1);
const localIP      = getLocalIP();

// ── Next.js ───────────────────────────────────────────────────────────────────

// Roda em localhost (127.0.0.1) para não entrar em conflito com o proxy
const nextProc = spawn(
  `npx next start -p ${internalPort} --hostname 127.0.0.1`,
  { shell: true, stdio: ["inherit", "pipe", "pipe"] },
);

const filterLine = (line) => {
  if (/^\s*$/.test(line)) return;
  if (/Local:\s+http/.test(line)) return;   // oculta URL interna
  if (/Network:\s+http/.test(line)) return; // oculta URL interna
  process.stdout.write(line + "\n");
};
nextProc.stdout?.on("data", (d) => d.toString().split("\n").forEach(filterLine));
nextProc.stderr?.on("data", (d) => process.stderr.write(d));

process.stdout.write("Aguardando Next.js iniciar...\n");

try {
  await waitForServer(internalPort);
} catch (err) {
  console.error("Erro: Next.js não iniciou a tempo.", err.message);
  process.exit(1);
}

// ── proxy HTTP ────────────────────────────────────────────────────────────────

const proxy = createHttp((req, res) => {
  const publicHost = req.headers.host ?? (localIP ? `${localIP}:${publicPort}` : `localhost:${publicPort}`);

  const proxyReq = makeRequest(
    {
      hostname: "127.0.0.1",
      port: internalPort,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host:                `localhost:${internalPort}`,
        "x-forwarded-host":  publicHost,
        "x-forwarded-proto": "http",
        "x-forwarded-port":  String(publicPort),
        connection:          "close", // evita problemas de keep-alive no proxy
      },
    },
    (proxyRes) => {
      const headers = { ...proxyRes.headers };
      delete headers["transfer-encoding"]; // deixa o Node calcular o tamanho

      if (headers.location) {
        headers.location = String(headers.location).replace(
          /https?:\/\/(localhost|127\.0\.0\.1):\d+/g,
          `http://${publicHost}`,
        );
      }

      res.writeHead(proxyRes.statusCode ?? 200, headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on("error", (err) => {
    console.error("Proxy erro:", err.message);
    if (!res.headersSent) res.writeHead(502);
    res.end("Bad Gateway");
  });

  // Para GET/HEAD não há body; para os demais, encaminha o body
  if (req.method === "GET" || req.method === "HEAD" || req.method === "DELETE") {
    proxyReq.end();
  } else {
    req.pipe(proxyReq);
  }
});

proxy.on("error", (err) => console.error("Servidor proxy erro:", err.message));

// Escuta sem fixar IPv4/IPv6 — Node escolhe o mais adequado para o SO
proxy.listen(publicPort, () => {
  console.log("\n▲ Servidor pronto");
  console.log(`  Local:   http://localhost:${publicPort}`);
  if (localIP) console.log(`  Network: http://${localIP}:${publicPort}`);
});

// ── encerramento ──────────────────────────────────────────────────────────────

nextProc.on("exit", (code) => { proxy.close(); process.exit(code ?? 0); });
process.on("SIGINT",  () => { nextProc.kill("SIGTERM"); proxy.close(); process.exit(0); });
process.on("SIGTERM", () => { nextProc.kill("SIGTERM"); proxy.close(); process.exit(0); });
