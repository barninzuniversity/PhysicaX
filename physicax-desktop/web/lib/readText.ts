import fs from "fs";
import path from "path";

export function readDataFile(relativePath: string): string {
  const fullPath = path.join(process.cwd(), relativePath);
  return fs.readFileSync(fullPath, "utf8");
}
