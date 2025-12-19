import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Loader2,
  Upload,
  FileDown,
  FileSpreadsheet,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  ImageIcon,
  HelpCircle,
  Download,
} from "lucide-react";
import StepItem from "../shared/components/StepItem";
import excelConverter from "../shared/utils/excel-converter";
const EXAMPLE_IMAGE_URL = "./src/assets/set_pageId_example.png";

interface PageProps {
  showToast: (type: "success" | "error", text: string) => void;
}

const LanguageUploader: React.FC<PageProps> = ({ showToast }) => {
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
    <div className="space-y-8 animate-fade-in-up relative min-h-[60vh] pb-10">
      {/* Title */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          Excel Multi-Language Converter
        </h1>
        <p className="text-slate-500">
          엑셀 파일을 업로드하여 다국어 포맷으로 변환합니다.
        </p>
      </div>
      {/* Guide */}
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
      {/* Converter */}
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
      {/* Modal: Page ID Guide  */}
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
      {/* Modal: Sample image */}
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
    </div>
  );
};

export default LanguageUploader;
