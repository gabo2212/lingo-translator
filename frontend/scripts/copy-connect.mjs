import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(here, "../../connect.json");
const target = path.resolve(here, "../public/connect.json");

if (!fs.existsSync(source)) {
  process.stdout.write("connect.json parent file is not in this build. Keeping frontend/public/connect.json.\n");
  process.exit(0);
}

fs.copyFileSync(source, target);
process.stdout.write("Copied repo-root connect.json into frontend/public/connect.json.\n");
