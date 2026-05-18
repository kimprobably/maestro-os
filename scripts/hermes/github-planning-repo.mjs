#!/usr/bin/env node
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { request } from "node:https";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function planningRepo() {
  return process.env.GITHUB_PLANNING_REPO || "kimprobably/maestro-agent-planning";
}

function assertSafeRepoPath(path) {
  if (!path || isAbsolute(path)) throw new Error(`Unsafe repo path: ${path}`);
  const parts = path.split(/[\\/]+/).filter(Boolean);
  if (!parts.length || parts.some((part) => part === "." || part === "..")) {
    throw new Error(`Unsafe repo path: ${path}`);
  }
  return parts.join("/");
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `${command} failed`);
  }
  return result.stdout;
}

function writeDeployKey(workDir) {
  const encoded = requireEnv("GITHUB_PLANNING_REPO_SSH_KEY_B64");
  const keyPath = join(workDir, "planning-repo-key");
  writeFileSync(keyPath, Buffer.from(encoded, "base64"));
  chmodSync(keyPath, 0o600);
  return keyPath;
}

function gitEnv(keyPath) {
  return {
    ...process.env,
    GIT_SSH_COMMAND: `ssh -i ${keyPath} -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new`,
  };
}

function sshUrl(repo = planningRepo()) {
  return `git@github.com:${repo}.git`;
}

function httpsUrl(repo = planningRepo()) {
  return `https://github.com/${repo}.git`;
}

function planningAuthMode() {
  const requested = (process.env.GITHUB_PLANNING_REPO_AUTH || "").trim().toLowerCase();
  if (["ssh", "https"].includes(requested)) return requested;
  if (process.env.GITHUB_PLANNING_REPO_SSH_KEY_B64) return "ssh";
  return "https";
}

function writeAskpass(workDir) {
  requireEnv("GITHUB_TOKEN");
  const askpassPath = join(workDir, "github-token-askpass.sh");
  writeFileSync(
    askpassPath,
    `#!/usr/bin/env sh
case "$1" in
  *Username*) printf '%s\\n' "x-access-token" ;;
  *Password*) printf '%s\\n' "$GITHUB_TOKEN" ;;
  *) printf '\\n' ;;
esac
`,
  );
  chmodSync(askpassPath, 0o700);
  return askpassPath;
}

function writeAuth(workDir) {
  const mode = planningAuthMode();
  if (mode === "https") {
    const askpassPath = writeAskpass(workDir);
    return {
      mode,
      remoteUrl: httpsUrl(),
      env: {
        ...process.env,
        GIT_ASKPASS: askpassPath,
        GIT_TERMINAL_PROMPT: "0",
      },
    };
  }

  const keyPath = writeDeployKey(workDir);
  return {
    mode,
    remoteUrl: sshUrl(),
    env: gitEnv(keyPath),
  };
}

function apiGet(path) {
  const token = requireEnv("GITHUB_TOKEN");
  return new Promise((resolvePromise, reject) => {
    const req = request(
      {
        hostname: "api.github.com",
        path,
        method: "GET",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "User-Agent": "maestro-hermes-planning-repo/1.0",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`GitHub API ${res.statusCode}: ${body.slice(0, 300)}`));
            return;
          }
          resolvePromise(body ? JSON.parse(body) : {});
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

async function status() {
  const repo = planningRepo();
  const [owner, name] = repo.split("/");
  const output = {
    ok: true,
    repo,
    read_token_present: Boolean(process.env.GITHUB_TOKEN),
    deploy_key_present: Boolean(process.env.GITHUB_PLANNING_REPO_SSH_KEY_B64),
    write_auth_mode: planningAuthMode(),
    read_api_ok: false,
    ssh_write_key_ok: null,
    write_auth_ok: null,
  };

  if (output.read_token_present && !hasFlag("--offline")) {
    try {
      const info = await apiGet(`/repos/${owner}/${name}`);
      output.read_api_ok = Boolean(info.full_name === repo);
      output.private = Boolean(info.private);
    } catch (error) {
      output.read_api_ok = false;
      output.read_api_error = error.message.replace(/github_pat_[A-Za-z0-9_]+/g, "[redacted]");
    }
  }

  if (output.deploy_key_present && hasFlag("--check-ssh")) {
    const workDir = mkdtempSync(join(tmpdir(), "github-planning-repo-status-"));
    try {
      const keyPath = writeDeployKey(workDir);
      run("git", ["ls-remote", sshUrl(repo), "HEAD"], { env: gitEnv(keyPath), cwd: workDir });
      output.ssh_write_key_ok = true;
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  }

  if (hasFlag("--check-write-auth")) {
    const workDir = mkdtempSync(join(tmpdir(), "github-planning-repo-status-"));
    try {
      const auth = writeAuth(workDir);
      run("git", ["ls-remote", auth.remoteUrl, "HEAD"], { env: auth.env, cwd: workDir });
      output.write_auth_ok = true;
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  }

  return output;
}

function cloneRepo(target) {
  const repo = planningRepo();
  const targetPath = resolve(target);
  const workDir = mkdtempSync(join(tmpdir(), "github-planning-repo-clone-"));
  try {
    const auth = writeAuth(workDir);
    run("git", ["clone", auth.remoteUrl, targetPath], { env: auth.env, cwd: workDir });
    return { ok: true, repo, target: targetPath };
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

function commitIfChanged(repoDir, message, env) {
  run("git", ["add", "."], { cwd: repoDir, env });
  const diff = spawnSync("git", ["diff", "--cached", "--quiet"], { cwd: repoDir, env });
  if (diff.status === 0) return { committed: false };
  run("git", ["config", "user.name", "Miles"], { cwd: repoDir, env });
  run("git", ["config", "user.email", "miles@maestro.local"], { cwd: repoDir, env });
  run("git", ["commit", "-m", message], { cwd: repoDir, env });
  run("git", ["push", "origin", "HEAD"], { cwd: repoDir, env });
  const sha = run("git", ["rev-parse", "HEAD"], { cwd: repoDir, env }).trim();
  return { committed: true, sha };
}

function syncDocs() {
  const source = resolve(argValue("--source", "/app/docs/operator"));
  const prefix = assertSafeRepoPath(argValue("--prefix", "docs/operator"));
  const message = argValue("--message", "Sync planning context from Miles");
  if (!existsSync(source)) throw new Error(`Source does not exist: ${source}`);

  const workDir = mkdtempSync(join(tmpdir(), "github-planning-repo-sync-"));
  try {
    const auth = writeAuth(workDir);
    const env = auth.env;
    const repoDir = join(workDir, "repo");
    run("git", ["clone", auth.remoteUrl, repoDir], { env, cwd: workDir });
    const dest = join(repoDir, ...prefix.split("/"));
    rmSync(dest, { recursive: true, force: true });
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(source, dest, { recursive: true, force: false });
    const commit = commitIfChanged(repoDir, message, env);
    return { ok: true, repo: planningRepo(), prefix, ...commit };
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

function publishFile() {
  const source = resolve(argValue("--source"));
  const destPath = assertSafeRepoPath(argValue("--path"));
  const message = argValue("--message", `Publish ${destPath} from Miles`);
  if (!existsSync(source)) throw new Error(`Source does not exist: ${source}`);

  const workDir = mkdtempSync(join(tmpdir(), "github-planning-repo-file-"));
  try {
    const auth = writeAuth(workDir);
    const env = auth.env;
    const repoDir = join(workDir, "repo");
    run("git", ["clone", auth.remoteUrl, repoDir], { env, cwd: workDir });
    const dest = join(repoDir, ...destPath.split("/"));
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(source, dest);
    const commit = commitIfChanged(repoDir, message, env);
    return { ok: true, repo: planningRepo(), path: destPath, ...commit };
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

function usage(exitCode = 1) {
  console.log(`Usage:
  node /app/scripts/hermes/github-planning-repo.mjs status [--offline] [--check-ssh] [--check-write-auth]
  node /app/scripts/hermes/github-planning-repo.mjs clone --target <dir>
  node /app/scripts/hermes/github-planning-repo.mjs sync-docs [--source /app/docs/operator] [--prefix docs/operator] [--message <commit-message>]
  node /app/scripts/hermes/github-planning-repo.mjs publish-file --source <file> --path <repo-path> [--message <commit-message>]
`);
  process.exit(exitCode);
}

async function main() {
  const command = process.argv[2];
  if (!command || command === "--help" || command === "-h") usage(command ? 0 : 1);

  let result;
  if (command === "status") result = await status();
  else if (command === "clone") result = cloneRepo(argValue("--target"));
  else if (command === "sync-docs") result = syncDocs();
  else if (command === "publish-file") result = publishFile();
  else throw new Error(`Unknown command: ${command}`);

  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message.replace(/github_pat_[A-Za-z0-9_]+/g, "[redacted]"));
    process.exit(1);
  });
}
