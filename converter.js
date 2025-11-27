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
  "영어 (작성된 부분은 맞게 표기 되었는지 검토 요청)": "English",
  캄보디아: "캄보디아어",
  네팔: "네팔어",
  필리핀: "필리핀어",
  인도네시아: "인도네시아어",
  베트남: "베트남어",
  방글라데시: "방글라데시어",
  "중국 (간체)": "중국어",
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

/**
 * 텍스트 정규화 함수
 */
function normalizeKey(str) {
  if (!str) return "";
  return String(str).trim().replace(/\s+/g, " ");
}

/**
 * trans_code 생성 함수
 * 규칙: 영어 텍스트 기준 -> 특수문자 제거 -> 단어 첫글자 대문자(PascalCase) -> 공백제거 -> 14자 이내 축약
 * 예: "Manage your application history" -> "ManageYourAppl" (14자)
 */
function generateTransCode(text) {
  if (!text) return "";

  // 1. 영문, 숫자, 공백만 남기고 특수문자 제거
  const cleanText = String(text).replace(/[^a-zA-Z0-9\s]/g, "");

  // 2. 단어 단위로 분리하여 각 단어의 첫 글자를 대문자로 변환 (PascalCase)
  const words = cleanText.split(/\s+/);
  let code = words
    .map((w) => {
      if (w.length === 0) return "";
      // 소문자로 바꾼 뒤 첫 글자만 대문자로 (Manage, Your, Application...)
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join("");

  // 3. 길이 제한 (최대 14자)
  // 10자 미만인 경우는 늘릴 수 없으므로 그대로 둡니다.
  if (code.length > 14) {
    code = code.substring(0, 14);
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
    const outputPath = path.join(OUTPUT_DIR, `converted_${file}`);

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

      // 유효한 컬럼 인덱스 찾기
      const validColumns = [];

      headerRow1.forEach((colVal, colIdx) => {
        const key1 = normalizeKey(colVal);
        const key2 = normalizeKey(headerRow2[colIdx]);

        let matchedCode = null;
        Object.keys(LANG_CODE_MAP).forEach((k) => {
          if (normalizeKey(k) === key1) matchedCode = LANG_CODE_MAP[k];
        });

        let matchedName = null;
        Object.keys(LANG_NAME_MAP).forEach((k) => {
          if (normalizeKey(k) === key2) matchedName = LANG_NAME_MAP[k];
        });

        if (matchedCode && matchedName) {
          validColumns.push({
            index: colIdx,
            langCode: matchedCode,
            langName: matchedName,
          });
        }
      });

      if (validColumns.length === 0) {
        console.log(`⚠️  ${file}: 매핑 가능한 컬럼이 없습니다.`);
        return;
      }

      // 영어(en) 컬럼 정보 찾기 (trans_code 생성용)
      const englishColumn = validColumns.find((col) => col.langCode === "en");

      // 데이터 변환
      const newRows = [];

      contentRows.forEach((row) => {
        // 1. 현재 행(Row)의 영어 텍스트 추출 및 trans_code 생성
        let rowTransCode = "";
        if (englishColumn) {
          const englishText = row[englishColumn.index];
          rowTransCode = generateTransCode(englishText);
        }

        // 2. 각 언어별로 행 생성
        validColumns.forEach((colInfo) => {
          const cellValue = row[colInfo.index];

          if (cellValue !== undefined && cellValue !== null) {
            newRows.push({
              page_nm: "",
              page_id: "",
              lang_code: colInfo.langCode,
              lang_name: colInfo.langName,
              trans_code: rowTransCode, // 생성된 코드 입력
              trans_content: String(cellValue),
            });
          }
        });
      });

      // 파일 저장
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
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 15 },
        { wch: 20 },
        { wch: 50 },
      ];

      XLSX.utils.book_append_sheet(newWorkbook, newSheet, "Converted");
      XLSX.writeFile(newWorkbook, outputPath);
      console.log(`✅ 변환 완료: ${outputPath}`);
    } catch (error) {
      console.error(`❌ 오류 발생 (${file}):`, error.message);
    }
  });

  console.log("🎉 모든 작업이 완료되었습니다.");
}

// 실행
convertExcelFiles();
