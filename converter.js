const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

// 폴더 경로 설정
const INPUT_DIR = "./input";
const OUTPUT_DIR = "./output";

// 폴더가 없으면 생성
if (!fs.existsSync(INPUT_DIR)) fs.mkdirSync(INPUT_DIR);
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

// 1. 매핑 규칙 정의 (Header 1: 국가/언어명 -> lang_code)
const LANG_CODE_MAP = {
  Korean: "ko",
  English: "en",
  Khmer: "km",
  Nepal: "ne",
  Philiphine: "tl",
  Indonesia: "id",
  Vietnam: "vi",
  Bangladesh: "bn",
  Chinese: "zh",
  Uzbekistan: "uz",
  Srilanka: "si",
  Thailand: "th",
  MYANMAR: "my",
  Russia: "ru",
  Pakistan: "ur",
  Mongolian: "mn",
  日本語: "ja",
  LAOS: "lo",
};

// 2. 매핑 규칙 정의 (Header 2: 언어 표시명 -> lang_name)
const LANG_NAME_MAP = {
  한국: "한국어",
  캄보디아: "캄보디아어",
  네팔: "네팔어",
  필리핀: "필리핀어",
  인도네시아: "인도네시아어",
  베트남: "베트남어",
  방글라데시: "방글라데시어",
  우즈베키스탄: "우즈베키스탄어",
  스리랑카: "스리랑카어",
  태국: "태국어",
  미얀마: "미얀마어",
  러시아: "러시아어",
  파키스탄: "파키스탄어",
  몽골: "몽골어",
  일본: "일본어",
  라오스: "라오스어",
};

// 3. 축약어 사전 정의 (자주 쓰이는 단어 -> 축약형)
const ABBREVIATIONS = {
  employer: "emp",
  signature: "sign",
  recommend: "recom",
  application: "app",
  administrator: "admin",
  consultation: "consult",
  operation: "oper",
  policy: "policy",
  opportunities: "opps",
  opportunity: "opp",
  management: "mgmt",
  manager: "mgr",
  service: "svc",
  request: "req",
  required: "req",
  message: "msg",
  notification: "noti",
  information: "info",
  history: "hist",
  change: "chg",
  password: "pw",
};

// 4. 불용어(Stop Words) 정의 (코드 생성 시 제외할 단어들)
const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "this",
  "that",
  "these",
  "those",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "has",
  "have",
  "had",
  "will",
  "shall",
  "may",
  "might",
  "can",
  "could",
  "would",
  "should",
  "to",
  "of",
  "for",
  "in",
  "on",
  "at",
  "by",
  "with",
  "about",
  "from",
  "please",
  "your",
  "my",
  "our",
  "their",
  "his",
  "her",
  "its",
  "we",
  "you",
  "i",
  "he",
  "she",
  "it",
  "they",
  "ll",
  "ve",
  "re",
  "m",
]);

/**
 * 텍스트 정규화 함수
 */
function normalizeKey(str) {
  if (!str) return "";
  return String(str).trim().replace(/\s+/g, " ");
}

/**
 * trans_code 생성 함수 (고도화됨)
 * 규칙: Stop Words 제거 -> 축약어 매핑 -> camelCase 변환 -> 최대 15자 제한
 */
function generateTransCode(text) {
  if (!text) return "";

  // 1. 영문, 숫자, 공백만 남기고 특수문자 제거
  // (We'll -> Well 처럼 붙는 것을 방지하기 위해 특수문자를 공백으로 치환 후 정리하는 것이 나을 수도 있으나,
  // 예시의 We'll -> recom 처리를 위해선 'We', 'll'로 분리되어 Stop word 처리되는 것이 유리함)
  const cleanText = String(text).replace(/[^a-zA-Z0-9\s]/g, " ");

  // 2. 단어 분리 및 필터링
  const rawWords = cleanText.split(/\s+/).filter((w) => w.length > 0);

  // 3. 의미 있는 단어 추출 및 축약
  const meaningfulWords = rawWords
    .map((w) => w.toLowerCase()) // 소문자로 통일
    .filter((w) => !STOP_WORDS.has(w)) // 불용어 제거
    .map((w) => ABBREVIATIONS[w] || w); // 축약어 적용 (없으면 원본 유지)

  // 만약 모든 단어가 걸러졌다면(예: "It is for you"), 원본 첫 단어라도 사용
  const targetWords =
    meaningfulWords.length > 0 ? meaningfulWords : rawWords.slice(0, 1);

  // 4. camelCase 변환
  let code = targetWords
    .map((w, index) => {
      // 첫 단어는 소문자
      if (index === 0) return w.toLowerCase();
      // 이후 단어는 첫 글자 대문자
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join("");

  // 5. 길이 제한 (최대 15자)
  if (code.length > 15) {
    code = code.substring(0, 15);
  }

  return code;
}

// 메인 함수
function convertExcelFiles() {
  const files = fs.readdirSync(INPUT_DIR).filter((file) => {
    return file.endsWith(".xlsx") || file.endsWith(".xls");
  });

  if (files.length === 0) {
    console.log("❌ input 폴더에 엑셀 파일(.xlsx, .xls)이 없습니다.");
    return;
  }

  console.log(
    `📂 총 ${files.length}개의 파일을 발견했습니다. 변환을 시작합니다...`
  );

  files.forEach((file, index) => {
    const inputPath = path.join(INPUT_DIR, file);
    const fileBaseName = path.parse(file).name;

    const outputXlsxPath = path.join(
      OUTPUT_DIR,
      `converted_${fileBaseName}.xlsx`
    );
    const outputCsvPath = path.join(
      OUTPUT_DIR,
      `converted_${fileBaseName}.csv`
    );

    console.log(`[${index + 1}/${files.length}] 처리 중: ${file}`);

    try {
      const workbook = XLSX.readFile(inputPath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (rawData.length < 3) {
        console.log(`⚠️  ${file}: 데이터가 충분하지 않습니다 (최소 3행 필요).`);
        return;
      }

      const headerRow1 = rawData[0];
      const headerRow2 = rawData[1];
      const contentRows = rawData.slice(2);

      // 1. page_nm, page_id 컬럼 인덱스 찾기
      let pageNmIdx = -1;
      let pageIdIdx = -1;

      headerRow1.forEach((val, idx) => {
        const normalizedHeader = normalizeKey(val).toLowerCase();
        if (normalizedHeader === "page_nm") pageNmIdx = idx;
        if (normalizedHeader === "page_id") pageIdIdx = idx;
      });

      // 2. 언어 데이터 컬럼 인덱스 찾기
      const validColumns = [];
      headerRow1.forEach((colVal, colIdx) => {
        const key1 = normalizeKey(colVal);
        const key2 = normalizeKey(headerRow2[colIdx]);

        let matchedCode = null;
        Object.keys(LANG_CODE_MAP).forEach((k) => {
          if (normalizeKey(k) === key1) matchedCode = LANG_CODE_MAP[k];
        });

        let matchedName = null;
        if (/영어/.test(key2)) matchedName = "English";
        else if (/중국|간체/.test(key2)) matchedName = "중국어";
        else {
          Object.keys(LANG_NAME_MAP).forEach((k) => {
            if (normalizeKey(k) === key2) matchedName = LANG_NAME_MAP[k];
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
        console.log(`⚠️  ${file}: 매핑 가능한 언어 컬럼이 없습니다.`);
        return;
      }

      const englishColumn = validColumns.find((col) => col.langCode === "en");
      const koreanColumn = validColumns.find((col) => col.langCode === "ko");

      const newRows = [];
      const pageCodeTracker = {};
      const processedKoreanTexts = new Set();

      contentRows.forEach((row) => {
        // 3. 한국어 중복 체크 로직
        if (koreanColumn) {
          const koreanText = row[koreanColumn.index];
          const normalizedKoText = normalizeKey(koreanText);

          if (normalizedKoText) {
            if (processedKoreanTexts.has(normalizedKoText)) return;
            processedKoreanTexts.add(normalizedKoText);
          }
        }

        const pageNm = pageNmIdx !== -1 ? row[pageNmIdx] || "" : "";
        const pageId = pageIdIdx !== -1 ? row[pageIdIdx] || "" : "";

        // 영어 텍스트 추출 및 고도화된 trans_code 생성
        let baseTransCode = "";
        if (englishColumn) {
          const englishText = row[englishColumn.index];
          baseTransCode = generateTransCode(englishText);
        }

        // 4. trans_code 중복(Collision) 처리 로직
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

        // 5. 각 언어별로 행 생성
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

      // 6. 결과 파일 생성
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

      XLSX.writeFile(newWorkbook, outputXlsxPath);
      console.log(`✅ XLSX 변환 완료: ${outputXlsxPath}`);

      const csvContent = XLSX.utils.sheet_to_csv(newSheet);
      fs.writeFileSync(outputCsvPath, "\uFEFF" + csvContent, {
        encoding: "utf8",
      });
      console.log(`✅ CSV 변환 완료: ${outputCsvPath}`);
    } catch (error) {
      console.error(`❌ 오류 발생 (${file}):`, error.message);
    }
  });

  console.log("🎉 모든 작업이 완료되었습니다.");
}

// 실행
convertExcelFiles();
