import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const pdfPath = "C:\\Users\\ibzao\\Downloads\\guide.pdf";
const outPath = "C:\\Users\\ibzao\\Downloads\\Project\\physicax-web\\scripts\\guide.txt";

const data = fs.readFileSync(pdfPath);
const result = await pdfParse(data);
fs.writeFileSync(outPath, result.text ?? "", "utf8");
console.log(`Extracted ${result.numpages ?? "?"} pages to ${outPath}`);
