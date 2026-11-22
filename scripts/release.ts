import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { version } from "../package.json";

const __dirname = dirname(fileURLToPath(import.meta.url));

// npm 包名与 Cargo 包名不同，版本同步需使用 Cargo 包名
const CARGO_PACKAGE_NAME = "EcoPaste";

(() => {
  const tomlPath = resolve(__dirname, "..", "src-tauri", "Cargo.toml");
  const lockPath = resolve(__dirname, "..", "Cargo.lock");

  for (const path of [tomlPath, lockPath]) {
    let content = readFileSync(path, "utf-8");

    const regexp = new RegExp(
      `(name\\s*=\\s*"${CARGO_PACKAGE_NAME}"\\s*version\\s*=\\s*)"[^"]+"`,
    );

    content = content.replace(regexp, `$1"${version}"`);

    writeFileSync(path, content);
  }
})();
