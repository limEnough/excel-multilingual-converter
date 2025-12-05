import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";

import {
  Loader2,
  Upload,
  FileDown,
  Search as SearchIcon,
  FileSpreadsheet,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  ImageIcon,
  HelpCircle,
  Download,
  CheckSquare,
  Square,
  Lock,
  LogOut,
  Database,
  Copy,
} from "lucide-react";
import excelConverter from "./utils/excel-converter";
import { SEARCH } from "./constants/search.constants";
const EXAMPLE_IMAGE_URL = "./src/assets/set_pageId_example.png";
const API_BASE_URL = "/api/v1/trans/list"; // CORS 해결을 위한 Proxy 경로 설정

// #region Components
interface StepItemProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  tips?: (string | React.ReactNode)[]; // Updated to accept React Nodes
  actions?: React.ReactNode;
}

function StepItem({ icon, title, desc, tips, actions }: StepItemProps) {
  return (
    <>
      <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
        <div className="w-16 h-16 bg-white flex items-center justify-center rounded-md border border-slate-200 shadow-sm shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-slate-800">{title}</h3>
            {actions && actions}
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
          {tips && tips.length > 0 && (
            <ul className="mt-3 space-y-1.5 bg-white p-3 rounded-md border border-slate-200 text-sm text-slate-600 shadow-sm">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
// #endregion

// #region Page
// 다국어 조회 목록 > 아이템
interface TranslationItem {
  transCode: string;
  langCode: string;
  langName: string;
  transContent: string;
  pageId: string;
}

function UploadPage({
  showToast,
}: {
  showToast: (type: "success" | "error", text: string) => void;
}) {
  const [isConverting, setIsConverting] = useState(false);
  const [resultFiles, setResultFiles] = useState<{
    name: string;
    xlsxBlob: Blob;
    csvBlob: Blob;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(true);
  const [isPageIdModalOpen, setIsPageIdModalOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sample File Download Logic
  const downloadSampleFile = () => {
    const sampleHeader1 = [
      "page_nm",
      "page_id",
      "Korean",
      "English",
      "Khmer",
      "Nepal",
      "Philiphine",
      "Indonesia",
      "Vietnam",
      "Bangladesh",
      "Chinese",
      "Uzbekistan",
      "Srilanka",
      "Thailand",
      "MYANMAR",
      "Russia",
      "Pakistan",
      "Mongolian",
      "日本語",
      "LAOS",
    ];
    const sampleHeader2 = [
      "",
      "",
      "한국",
      "영어",
      "캄보디아",
      "네팔",
      "필리핀",
      "인도네시아",
      "베트남",
      "방글라데시",
      "중국 (간체)",
      "우즈베키스탄",
      "스리랑카",
      "태국",
      "미얀마",
      "러시아",
      "파키스탄",
      "몽골",
      "일본",
      "라오스",
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([sampleHeader1, sampleHeader2]);

    ws["!cols"] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "sample.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsConverting(true);
    setResultFiles(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const arrayBuffer = await file.arrayBuffer();
      const result = excelConverter.processor(arrayBuffer, file.name);
      setResultFiles(result);
      showToast("success", "변환이 완료되었습니다.");
    } catch (error: any) {
      console.error(error);
      showToast("error", error.message || "파일 변환 중 오류가 발생했습니다.");
    } finally {
      setIsConverting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const downloadFile = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          Excel Multi-Language Converter
        </h1>
        <p className="text-slate-500">
          엑셀 파일을 업로드하여 다국어 포맷으로 변환하세요.
        </p>
      </div>

      <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setIsGuideOpen(!isGuideOpen)}
          className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <span className="font-semibold text-slate-700">Step Guide</span>
          {isGuideOpen ? (
            <ChevronUp size={20} className="text-slate-500" />
          ) : (
            <ChevronDown size={20} className="text-slate-500" />
          )}
        </button>

        {isGuideOpen && (
          <div className="p-4 grid gap-4 bg-white border-t border-slate-100 animate-slide-down">
            <StepItem
              icon={<FileSpreadsheet className="text-indigo-500" size={28} />}
              title="1. 파일 준비"
              desc="변환할 파일을 준비합니다."
              tips={[
                "CS 번역 시트에서 작업할 내용을 복사합니다.",
                "샘플 파일을 다운로드 한 뒤, 복사한 내용을 붙여넣습니다.",
                <span className="flex items-center gap-2 flex-wrap">
                  비어있는 page_nm, page_id 컬럼에 값을 기입해 넣습니다.
                  <button
                    onClick={() => setIsPageIdModalOpen(true)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-1 py-1 rounded border border-slate-200 transition-colors flex items-center gap-1 font-medium cursor-pointer relative group"
                  >
                    <HelpCircle size={12} />
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      기준 확인하기
                    </span>
                  </button>
                </span>,
                "이미지 아이콘을 클릭하여 예시를 확인해보세요. 파일과 형식이 같다면 변환 준비가 완료되었습니다.",
              ]}
              actions={
                <>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-indigo-500 hover:text-indigo-700 transition-colors p-1 rounded-full hover:bg-indigo-50 relative group cursor-pointer"
                    title="예시 이미지 보기"
                  >
                    <ImageIcon size={18} />
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      예시 보기
                    </span>
                  </button>

                  <button
                    onClick={downloadSampleFile}
                    className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200 transition-colors flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Download size={12} />
                    샘플 다운로드
                  </button>
                </>
              }
            />
            <StepItem
              icon={<Upload className="text-indigo-500" size={28} />}
              title="2. 업로드 및 변환"
              desc="아래 버튼을 눌러 파일을 업로드하면 자동으로 변환 로직이 실행됩니다."
            />
            <StepItem
              icon={<FileDown className="text-indigo-500" size={28} />}
              title="3. 다운로드"
              desc="변환이 완료되면 .xlsx 및 .csv 파일을 다운로드할 수 있습니다."
            />
          </div>
        )}
      </div>

      {/* Page ID Guide Modal */}
      {isPageIdModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsPageIdModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col animate-slide-up z-10 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <HelpCircle size={20} className="text-indigo-500" />
                page_id 작성 기준
              </h4>
              <button
                onClick={() => setIsPageIdModalOpen(false)}
                className="text-slate-500 hover:text-slate-700 p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 border border-slate-200 w-16 text-center">
                      자리
                    </th>
                    <th className="px-4 py-3 border border-slate-200 text-center">
                      항목
                    </th>
                    <th className="px-4 py-3 border border-slate-200">예시</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white border-b border-slate-200">
                    <td className="px-4 py-3 font-medium text-center bg-slate-50">
                      1
                    </td>
                    <td className="px-4 py-3 text-center">채널</td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div>
                          <span className="font-semibold text-slate-800">
                            사용자 화면:
                          </span>{" "}
                          FO
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800">
                            관리자 화면:
                          </span>{" "}
                          BO
                        </div>
                        <div className="text-slate-400 text-xs mt-1">
                          예) FO--
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr className="bg-white border-b border-slate-200">
                    <td className="px-4 py-3 font-medium text-center bg-slate-50">
                      2
                    </td>
                    <td className="px-4 py-3 text-center">서비스</td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div>
                          <span className="font-semibold text-slate-800">
                            구인구직(기업회원):
                          </span>{" "}
                          JOB
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800">
                            행정서비스:
                          </span>{" "}
                          SOS
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800">
                            비자네비:
                          </span>{" "}
                          VISA
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800">
                            공통:
                          </span>{" "}
                          HP
                        </div>
                        <div className="text-slate-400 text-xs mt-1">
                          예) -JOB-
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr className="bg-white border-b border-slate-200">
                    <td className="px-4 py-3 font-medium text-center bg-slate-50">
                      3
                    </td>
                    <td className="px-4 py-3 text-center">화면 ID 숫자</td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div>예) JobSearch_036</div>
                        <div className="text-slate-400 text-xs mt-1">
                          예) --036
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr className="bg-indigo-50 border-t-2 border-indigo-100">
                    <td
                      colSpan={2}
                      className="px-4 py-3 font-bold text-center text-indigo-700"
                    >
                      최종 예시
                    </td>
                    <td className="px-4 py-3 font-bold text-indigo-700">
                      FO-JOB-036
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sample image Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slide-up z-10">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <ImageIcon size={20} className="text-indigo-500" />
                예시 이미지
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-700 p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-auto bg-slate-100 flex justify-center items-start h-full">
              <img
                src={EXAMPLE_IMAGE_URL}
                alt="Example"
                className="max-w-full h-auto rounded-lg shadow-md object-contain border border-slate-200"
              />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border-t-4 border-t-indigo-500 p-8">
        <div className="flex flex-col items-center space-y-6">
          {!isConverting && !resultFiles && (
            <>
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-2 animate-bounce-slow">
                <Upload size={40} className="text-indigo-600" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  엑셀 파일 업로드
                </h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">
                  지원 형식: .xlsx, .xls
                </p>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  ref={fileInputRef}
                  id="excel-upload"
                />
                <label
                  htmlFor="excel-upload"
                  className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-lg shadow-md transition-all cursor-pointer hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <Upload size={18} />
                  <span>파일 선택하기</span>
                </label>
              </div>
            </>
          )}
          {isConverting && (
            <div className="w-full max-w-md text-center space-y-6 py-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={48} className="animate-spin text-indigo-500" />
                </div>
                <div className="w-16 h-16 mx-auto rounded-full border-4 border-indigo-100"></div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  변환 중입니다...
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  잠시만 기다려주세요.
                </p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-indigo-500 animate-progress-indeterminate"></div>
              </div>
            </div>
          )}
          {resultFiles && !isConverting && (
            <div className="w-full max-w-md text-center space-y-8 animate-fade-in py-4">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto border-2 border-green-100">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800">
                  변환 완료!
                </h3>
                <p className="text-slate-500 mt-1 font-mono text-sm bg-slate-50 inline-block px-2 py-1 rounded">
                  {resultFiles.name}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() =>
                    downloadFile(
                      resultFiles.xlsxBlob,
                      `converted_${resultFiles.name}.xlsx`
                    )
                  }
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-green-500 bg-green-50 text-green-700 hover:bg-green-100 transition-colors font-medium"
                >
                  <FileSpreadsheet size={24} />
                  <span>Excel 다운로드</span>
                </button>
                <button
                  onClick={() =>
                    downloadFile(
                      resultFiles.csvBlob,
                      `converted_${resultFiles.name}.csv`
                    )
                  }
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-indigo-500 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors font-medium"
                >
                  <FileDown size={24} />
                  <span>CSV 다운로드</span>
                </button>
              </div>
              <div className="pt-6 border-t border-slate-100">
                <button
                  onClick={() => setResultFiles(null)}
                  className="text-slate-500 hover:text-slate-800 font-medium text-sm flex items-center justify-center gap-1 mx-auto transition-colors"
                >
                  <span>다른 파일 변환하기</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchPage({
  showToast,
}: {
  showToast: (type: "success" | "error", text: string) => void;
}) {
  const [token, setToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<TranslationItem[]>([]); // 검색 결과 상태
  const [hasSearched, setHasSearched] = useState(false); // 검색 수행 여부

  // Search Filters State
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [pageCategoryValue, setPageCategoryValue] = useState(""); // Stores 'value' like FO-HP-COM
  const [directPageId, setDirectPageId] = useState("");
  const [transCode, setTransCode] = useState("");
  const [transContent, setTransContent] = useState("");

  const headersRef = useRef<Headers>(new Headers());

  // 체크: 컴포넌트 마운트 시 세션스토리지 토큰 확인
  useEffect(() => {
    const storedToken = sessionStorage.getItem("authToken");
    if (storedToken) {
      headersRef.current.set("Authorization", `Bearer ${storedToken}`);
      headersRef.current.set("Accept-Language", "ko");
      setToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (inputToken: string) => {
    if (!inputToken) return;

    // 토큰 세션스토리지 저장
    sessionStorage.setItem("authToken", inputToken);

    // API 통신 준비
    headersRef.current.set("Authorization", `Bearer ${inputToken}`);
    headersRef.current.set("Accept-Language", "ko");

    setToken(inputToken);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    if (window.confirm("로그아웃 하겠습니까?")) {
      sessionStorage.removeItem("authToken");
      setToken("");
      setIsAuthenticated(false);
      headersRef.current.delete("Authorization");
      setSearchResults([]); // 결과 초기화
      setHasSearched(false);
    }
  };

  const toggleLang = (value: string) => {
    if (value === "ALL") {
      if (selectedLangs.length === SEARCH.LANG_OPTIONS.length) {
        setSelectedLangs([]);
      } else {
        setSelectedLangs(SEARCH.LANG_OPTIONS.map((opt) => opt.value));
      }
      return;
    }

    if (selectedLangs.includes(value)) {
      setSelectedLangs(selectedLangs.filter((l) => l !== value));
    } else {
      setSelectedLangs([...selectedLangs, value]);
    }
  };

  const handleSearch = async () => {
    if (selectedLangs.length === 0) {
      showToast("error", "언어를 하나 이상 선택해주세요.");
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setSearchResults([]); // 이전 결과 초기화
    const finalPageId = isDirectInput ? directPageId : pageCategoryValue;

    const promises = selectedLangs.map(async (langCode) => {
      const requestBody = {
        langCode: langCode,
        pageId: finalPageId,
        transCode: transCode,
        transContent: transContent,
      };

      try {
        const response = await fetch(API_BASE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "Accept-Language": "ko",
          },
          body: JSON.stringify(requestBody),
          referrerPolicy: "no-referrer",
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API Error (${langCode}):`, response.status, errorText);
          throw new Error(`API Error: ${response.status} ${errorText}`);
        }

        const json = await response.json();
        // API 응답 구조: { data: [...] } 확인
        return { lang: langCode, success: true, data: json.data || [] };
      } catch (error: any) {
        console.error(`Request failed for ${langCode}:`, error);
        return { lang: langCode, success: false, error };
      }
    });

    const results = await Promise.all(promises);

    // 결과 통합
    const aggregatedData: TranslationItem[] = [];
    let hasErrors = false;

    results.forEach((result) => {
      if (result.success && Array.isArray(result.data)) {
        aggregatedData.push(...result.data);
      } else {
        hasErrors = true;
      }
    });

    setSearchResults(aggregatedData);

    if (hasErrors && aggregatedData.length === 0) {
      showToast(
        "error",
        "오류가 발생했습니다. 콘솔 로그에서 상세 내용을 확인해주세요."
      );
    }

    setIsSearching(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("success", "복사되었습니다.");
  };

  const isDirectInput = pageCategoryValue === "DIRECT";
  const isSearchEnabled =
    pageCategoryValue !== "" && (!isDirectInput || directPageId.trim() !== "");

  return (
    <div className="relative min-h-[60vh] pb-10">
      {/* Login Modal */}
      {!isAuthenticated && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-md rounded-xl">
          <div className="bg-white p-8 rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md animate-slide-up">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="text-indigo-500" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">로그인</h2>
              <p className="text-slate-500 mt-2 text-sm">
                서비스 이용을 위해 토큰을 입력해주세요.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = (e.target as any).token.value;
                handleLogin(input);
              }}
              className="space-y-4"
            >
              <div>
                <input
                  name="token"
                  type="password"
                  placeholder="Access Token 입력"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg transform active:scale-[0.98]"
              >
                로그인
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Search UI */}
      <div
        className={`space-y-6 transition-opacity duration-500 ${
          isAuthenticated ? "opacity-100" : "opacity-20 pointer-events-none"
        }`}
      >
        {/* Top Bar with Logout Button */}
        <div className="flex justify-end">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-100"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </div>

        {/* 1. Language Filter */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
            언어 선택
          </h3>
          <div className="flex flex-wrap gap-3">
            {/* 전체 버튼 */}
            <button
              onClick={() => toggleLang("ALL")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border transition-all ${
                selectedLangs.length === SEARCH.LANG_OPTIONS.length
                  ? "bg-slate-800 border-slate-800 text-white font-medium"
                  : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {selectedLangs.length === SEARCH.LANG_OPTIONS.length ? (
                <CheckSquare size={16} />
              ) : (
                <Square size={16} />
              )}
              전체
            </button>

            {SEARCH.LANG_OPTIONS.map((lang) => {
              const isSelected = selectedLangs.includes(lang.value);
              return (
                <button
                  key={lang.value}
                  onClick={() => toggleLang(lang.value)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border transition-all ${
                    isSelected
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-medium"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {isSelected ? (
                    <CheckSquare size={16} />
                  ) : (
                    <Square size={16} />
                  )}
                  {lang.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Search Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
            <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
            검색 조건
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
            {/* Page Category Select */}
            <div className="lg:col-span-3 space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Page Name
              </label>
              <div className="relative">
                <select
                  value={pageCategoryValue}
                  onChange={(e) => setPageCategoryValue(e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none appearance-none bg-white text-sm text-slate-800"
                >
                  <option value="">선택해주세요</option>
                  {SEARCH.PAGE_CATEGORIES()?.map((cat, idx) => (
                    <option key={idx} value={cat.value}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
                  size={16}
                />
              </div>
            </div>

            {/* Page ID Input */}
            <div className="lg:col-span-2 space-y-1.5">
              <label
                className={`text-sm font-medium ${
                  isDirectInput ? "text-slate-700" : "text-slate-400"
                }`}
              >
                Page ID (직접입력)
              </label>
              <input
                type="text"
                value={directPageId}
                onChange={(e) => setDirectPageId(e.target.value)}
                disabled={!isDirectInput}
                placeholder={isDirectInput ? "Page ID 입력" : "-"}
                className={`w-full px-3 py-2.5 rounded-lg border outline-none text-sm transition-colors ${
                  isDirectInput
                    ? "border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white text-slate-800"
                    : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              />
            </div>

            {/* Trans Code Input */}
            <div className="lg:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Trans Code
              </label>
              <input
                type="text"
                value={transCode}
                onChange={(e) => setTransCode(e.target.value)}
                placeholder="코드 입력"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm text-slate-800"
              />
            </div>

            {/* Trans Content Input */}
            <div className="lg:col-span-3 space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Trans Contents
              </label>
              <input
                type="text"
                value={transContent}
                onChange={(e) => setTransContent(e.target.value)}
                placeholder="내용 입력"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm text-slate-800"
              />
            </div>

            {/* Search Button */}
            <div className="lg:col-span-2">
              <button
                onClick={handleSearch}
                disabled={!isSearchEnabled || isSearching}
                className={`w-full font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm ${
                  isSearchEnabled && !isSearching
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white transform active:scale-[0.98]"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                }`}
              >
                {isSearching ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <SearchIcon size={18} />
                )}
                검색
              </button>
            </div>
          </div>
        </div>

        {/* 3. Search Results */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Database size={18} className="text-indigo-500" />
                검색 결과
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Copy size={10} />
                TRANS CODE, TRANS CONTENT 컬럼의 텍스트를 클릭하여 복사해보세요!
              </p>
            </div>
            {hasSearched && (
              <span className="text-sm font-medium bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm text-slate-600">
                Total:{" "}
                <span className="text-indigo-600 font-bold">
                  {searchResults.length}
                </span>
              </span>
            )}
          </div>

          {/* Table or Placeholder */}
          {hasSearched ? (
            searchResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 font-medium w-16 text-center">
                        No
                      </th>
                      <th className="px-6 py-3 font-medium w-32">Lang Name</th>
                      <th className="px-6 py-3 font-medium w-40">Page ID</th>
                      <th className="px-6 py-3 font-medium w-48">Trans Code</th>
                      <th className="px-6 py-3 font-medium">Trans Content</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((item, index) => (
                      <tr
                        key={index}
                        className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-center text-slate-400 font-medium">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">
                          {item.langName}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {item.pageId}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                          <div
                            className="flex items-center gap-2 group cursor-pointer"
                            onClick={() => handleCopy(item.transCode)}
                            title="클릭하여 복사"
                          >
                            <span>{item.transCode}</span>
                            <Copy
                              size={12}
                              className="text-slate-400 group-hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-800">
                          <div
                            className="flex items-center gap-2 group cursor-pointer"
                            onClick={() => handleCopy(item.transContent)}
                            title="클릭하여 복사"
                          >
                            <span>{item.transContent}</span>
                            <Copy
                              size={12}
                              className="text-slate-400 group-hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <SearchIcon size={48} className="text-slate-200" />
                <p>검색 결과가 없습니다.</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <SearchIcon size={48} className="text-slate-200" />
              <p>검색 조건을 입력하고 검색 버튼을 눌러주세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// #endregion

export default function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [toastMsg, setToastMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Pretendard'] text-slate-900 flex flex-col">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in-down ${
            toastMsg.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle2 size={20} />
          ) : (
            <X size={20} />
          )}
          <span className="font-medium">{toastMsg.text}</span>
        </div>
      )}

      {/* Header / Nav */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveIndex(0)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative cursor-pointer ${
                activeIndex === 0
                  ? "text-indigo-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Upload size={18} />
              Upload
              {activeIndex === 0 && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex(1)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative cursor-pointer ${
                activeIndex === 1
                  ? "text-indigo-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <SearchIcon size={18} />
              Search
              {activeIndex === 1 && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto w-full p-6 mt-4 flex-1">
        {activeIndex === 0 ? (
          <UploadPage showToast={showToast} />
        ) : (
          <SearchPage showToast={showToast} />
        )}
      </div>
    </div>
  );
}
