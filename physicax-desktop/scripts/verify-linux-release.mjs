import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const releaseDir = path.join(distDir, "linux-release");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf-8"));
const version = packageJson.version || "0.1.0";
const appImageName = `PhysicaX-${version}.AppImage`;
const debName = `physicax-desktop_${version}_amd64.deb`;

const requiredFiles = [
  appImageName,
  debName,
  "run-PhysicaX-linux.sh",
  "run-PhysicaX-wsl.sh",
  "install-PhysicaX-deb.sh",
  "README.txt"
];

const issues = [];

const expectFile = (fileName) => {
  const filePath = path.join(releaseDir, fileName);
  if (!fs.existsSync(filePath)) {
    issues.push(`Missing expected release file: ${fileName}`);
    return null;
  }
  return filePath;
};

const checkExecutable = (fileName) => {
  const filePath = expectFile(fileName);
  if (!filePath) return;
  const mode = fs.statSync(filePath).mode & 0o777;
  if ((mode & 0o111) === 0) {
    issues.push(`${fileName} is not executable.`);
  }
};

const readmePath = expectFile("README.txt");
const readme = readmePath ? fs.readFileSync(readmePath, "utf-8") : "";

for (const fileName of requiredFiles) {
  expectFile(fileName);
}

checkExecutable("run-PhysicaX-linux.sh");
checkExecutable("run-PhysicaX-wsl.sh");
checkExecutable("install-PhysicaX-deb.sh");

const expectedReadmeSnippets = [
  `./run-PhysicaX-linux.sh`,
  `./run-PhysicaX-wsl.sh`,
  `sudo apt install ./${debName}`,
  appImageName,
  debName,
  `npm run desktop:run:linux`
];

for (const snippet of expectedReadmeSnippets) {
  if (!readme.includes(snippet)) {
    issues.push(`README.txt is missing expected guidance: ${snippet}`);
  }
}

if (issues.length) {
  console.error("Linux release verification failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      releaseDir,
      verifiedFiles: requiredFiles.map((fileName) => path.join(releaseDir, fileName)),
      version
    },
    null,
    2
  )
);
