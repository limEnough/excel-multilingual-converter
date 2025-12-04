import * as XLSX from "xlsx";
import { LANG } from "../constants/lang.constants";
import { TRANS } from "../constants/trans.constants";

const excelConverter = {
  normalizeKey: (str: any): string => {
    if (!str) return "";
    return String(str).trim().replace(/\s+/g, " ");
  },
  generateTransCode: (text: string): string => {
    if (!text) return "";

    const cleanText = String(text).replace(/[^a-zA-Z0-9\s]/g, " ");
    const rawWords = cleanText.split(/\s+/).filter((w) => w.length > 0);

    const meaningfulWords = rawWords
      .map((w) => w.toLowerCase())
      .filter((w) => !TRANS.STOP_WORDS.has(w))
      .map((w) => TRANS.ABBREVIATIONS[w] || w);

    const targetWords =
      meaningfulWords.length > 0 ? meaningfulWords : rawWords.slice(0, 1);

    let code = targetWords
      .map((w, index) => {
        if (index === 0) return w.toLowerCase();
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      })
      .join("");

    if (code.length > 15) {
      code = code.substring(0, 15);
    }

    return code;
  },
  processor: (arrayBuffer: ArrayBuffer, fileName: string) => {
    if (!XLSX) throw new Error("XLSX library not loaded");

    // 1. Read Workbook
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    if (rawData.length < 3) {
      throw new Error("데이터가 충분하지 않습니다 (최소 3행 필요).");
    }

    const headerRow1 = rawData[0];
    const headerRow2 = rawData[1];
    const contentRows = rawData.slice(2);

    // 2. Identify Columns
    let pageNmIdx = -1;
    let pageIdIdx = -1;

    headerRow1.forEach((val: any, idx: number) => {
      const normalizedHeader = excelConverter.normalizeKey(val).toLowerCase();
      if (normalizedHeader === "page_nm") pageNmIdx = idx;
      if (normalizedHeader === "page_id") pageIdIdx = idx;
    });

    const validColumns: any[] = [];
    headerRow1.forEach((colVal: any, colIdx: number) => {
      const key1 = excelConverter.normalizeKey(colVal);
      const key2 = excelConverter.normalizeKey(headerRow2[colIdx]);

      let matchedCode = null;
      Object.keys(LANG.CODE_MAP).forEach((k) => {
        if (excelConverter.normalizeKey(k) === key1)
          matchedCode = LANG.CODE_MAP[k];
      });

      let matchedName = null;
      if (/영어/.test(key2)) matchedName = "English";
      else if (/중국|간체/.test(key2)) matchedName = "중국어";
      else {
        Object.keys(LANG.NAME_MAP).forEach((k) => {
          if (excelConverter.normalizeKey(k) === key2)
            matchedName = LANG.NAME_MAP[k];
        });
      }

      if (matchedCode && matchedName) {
        validColumns.push({
          index: colIdx,
          langCode: matchedCode,
          langName: matchedName,
        });
      }
    });

    if (validColumns.length === 0) {
      throw new Error("매핑 가능한 언어 컬럼이 없습니다.");
    }

    const englishColumn = validColumns.find((col) => col.langCode === "en");
    const koreanColumn = validColumns.find((col) => col.langCode === "ko");

    const newRows: any[] = [];
    const pageCodeTracker: any = {};
    const processedKoreanTexts = new Set();

    // 3. Process Rows
    contentRows.forEach((row: any[]) => {
      // Korean Duplicate Check
      if (koreanColumn) {
        const koreanText = row[koreanColumn.index];
        const normalizedKoText = excelConverter.normalizeKey(koreanText);
        if (normalizedKoText) {
          if (processedKoreanTexts.has(normalizedKoText)) return;
          processedKoreanTexts.add(normalizedKoText);
        }
      }

      const pageNm = pageNmIdx !== -1 ? row[pageNmIdx] || "" : "";
      const pageId = pageIdIdx !== -1 ? row[pageIdIdx] || "" : "";

      // Generate trans_code
      let baseTransCode = "";
      if (englishColumn) {
        const englishText = row[englishColumn.index];
        baseTransCode = excelConverter.generateTransCode(englishText);
      }

      // Collision Handling
      let finalTransCode = baseTransCode;
      if (pageId && baseTransCode) {
        if (!pageCodeTracker[pageId]) {
          pageCodeTracker[pageId] = {};
        }
        if (pageCodeTracker[pageId][baseTransCode]) {
          pageCodeTracker[pageId][baseTransCode] += 1;
          const count = pageCodeTracker[pageId][baseTransCode];
          finalTransCode = `${baseTransCode}_${count}`;
        } else {
          pageCodeTracker[pageId][baseTransCode] = 1;
        }
      }

      // Create New Rows
      validColumns.forEach((colInfo) => {
        const cellValue = row[colInfo.index];
        if (cellValue !== undefined && cellValue !== null) {
          newRows.push({
            page_nm: pageNm,
            page_id: pageId,
            lang_code: colInfo.langCode,
            lang_name: colInfo.langName,
            trans_code: finalTransCode,
            trans_content: String(cellValue),
          });
        }
      });
    });

    // 4. Generate Output Buffers
    const newWorkbook = XLSX.utils.book_new();
    const newSheet = XLSX.utils.json_to_sheet(newRows, {
      header: [
        "page_nm",
        "page_id",
        "lang_code",
        "lang_name",
        "trans_code",
        "trans_content",
      ],
    });
    newSheet["!cols"] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
      { wch: 20 },
      { wch: 50 },
    ];
    XLSX.utils.book_append_sheet(newWorkbook, newSheet, "Converted");

    // XLSX Blob
    const xlsxArray = XLSX.write(newWorkbook, {
      bookType: "xlsx",
      type: "array",
    });
    const xlsxBlob = new Blob([xlsxArray], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // CSV Blob (with BOM)
    const csvContent = XLSX.utils.sheet_to_csv(newSheet);
    const csvBlob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    return {
      name: fileName.replace(/\.[^/.]+$/, ""),
      xlsxBlob,
      csvBlob,
    };
  },
};

export default excelConverter;
