import React, { useState, useRef, useEffect } from "react";

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
} from "lucide-react";
import excelConverter from "./utils/excel-converter";

// #region Components
function StepItem({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
      <div className="w-16 h-16 bg-white flex items-center justify-center rounded-md border border-slate-200 shadow-sm shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-slate-800 mb-1">{title}</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
// #endregion

// #region Page
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
  const [isGuideOpen, setIsGuideOpen] = useState(false);

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

      {/* Step Guide Toggle */}
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
              desc="변환할 원본 엑셀 파일을 준비합니다. 헤더 형식이 올바른지 확인해주세요."
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

      {/* Upload Section */}
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

function SearchPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 animate-fade-in">
      <div className="bg-indigo-100 p-6 rounded-full">
        <SearchIcon size={64} className="text-indigo-500" />
      </div>
      <h2 className="text-3xl font-bold text-slate-800">Coming Soon</h2>
      <p className="text-slate-500 text-lg">준비중입니다</p>
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

  // [프리뷰 환경용] CDN 스크립트 로드
  // 로컬 환경(npm i xlsx)에서는 이 useEffect를 제거하고 위쪽의 import문을 활성화하세요.
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

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
          <SearchPage />
        )}
      </div>
    </div>
  );
}
