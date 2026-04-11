import { readDataFile } from "../../lib/readText";
import { TextFilter } from "../components/TextFilter";

export default function AppendixPage() {
  const ocrText = readDataFile("data/guide_ocr_ascii.txt");

  return (
    <>
      <section className="section reveal">
        <h2>Appendix: Full OCR of the Guide</h2>
        <p>
          The complete OCR text is included for full traceability. This preserves the entire scope of
          the original PDF inside the website.
        </p>
        <TextFilter
          title="OCR Search"
          text={ocrText}
          placeholder="Search the OCR text..."
          maxLines={120}
        />
        <details className="details-block" open>
          <summary>Open full OCR text</summary>
          <pre className="ocr">{ocrText}</pre>
        </details>
      </section>
    </>
  );
}
