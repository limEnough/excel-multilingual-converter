import React, { useEffect, useRef, useState } from "react";
import { parseSwaggerToTypes } from "../shared/utils/swagger-to-ts";
import {
  Lock,
  LogOut,
  Search,
  Copy,
  Check,
  Code2,
  FileJson,
  Loader2,
} from "lucide-react";

interface SwaggerTypePickerProps {
  showToast: (type: "success" | "error", text: string) => void;
}

const SwaggerTypePicker: React.FC<SwaggerTypePickerProps> = ({ showToast }) => {
  const SWAGGER_JSON_PATH = "/api/api-docs";

  // #region Token Management
  const headersRef = useRef<Headers>(new Headers());
  const [token, setToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedToken = sessionStorage.getItem("authToken");
    if (storedToken) {
      headersRef.current.set("Authorization", `Bearer ${storedToken}`);
      headersRef.current.set("Accept-Language", "ko");
      setToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);
  // #endregion

  const [url, setUrl] = useState("");
  const [code, setCode] = useState("");
  const [schemaData, setSchemaData] = useState(""); // 전체 스키마 데이터 원본
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // #region Handlers
  const handleLogin = (inputToken: string) => {
    if (!inputToken) return;
    sessionStorage.setItem("authToken", inputToken);
    headersRef.current.set("Authorization", `Bearer ${inputToken}`);
    headersRef.current.set("Accept-Language", "ko");
    setToken(inputToken);
    setIsAuthenticated(true);
    showToast("success", "인증되었습니다.");
  };

  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      sessionStorage.removeItem("authToken");
      setToken("");
      setIsAuthenticated(false);
      headersRef.current.delete("Authorization");
      setUrl("");
      setCode("");
      setSchemaData("");
      showToast("success", "로그아웃 되었습니다.");
    }
  };

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopySuccess(true);
    showToast("success", "코드가 클립보드에 복사되었습니다.");
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // 전체 스키마 가져오기 (초기 로딩)
  const handleFetch = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(SWAGGER_JSON_PATH, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Accept-Language": "ko",
        },
        referrerPolicy: "no-referrer",
      });

      if (!response.ok) {
        throw new Error(`[${response.status}] 문서 로드 실패`);
      }

      const json = await response.json();

      // 전체 변환 (일단 전체를 변환해서 저장)
      const tsCode = parseSwaggerToTypes(json);
      setSchemaData(tsCode);
      setCode(tsCode); // 기본적으로 전체 노출 (검색 전)
    } catch (err: any) {
      const msg = err.message || "스키마를 불러오는 중 오류가 발생했습니다.";
      setError(msg);
      showToast("error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  // 검색 필터링 핸들러
  const handleSearch = () => {
    if (!schemaData) {
      handleFetch(); // 데이터가 없으면 다시 불러오기
      return;
    }

    if (!url) {
      // 검색어 없으면 전체 보여주기
      setCode(schemaData);
      return;
    }

    // TODO: 여기에 실제 필터링 로직 구현 (현재는 Toast만 띄움)
    // 예: const filtered = parseAndFilter(json, url); setCode(filtered);
    showToast("success", "검색 로직을 수행합니다 (필터링 구현 필요)");
  };

  // 인증되면 자동으로 Fetch 실행
  useEffect(() => {
    if (isAuthenticated) {
      handleFetch();
    }
  }, [isAuthenticated]);

  // #endregion

  return (
    <div className="space-y-8 animate-fade-in-up relative min-h-[60vh] pb-10">
      {/* Login Overlay (Modal) */}
      {!isAuthenticated && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                접근 권한 확인
              </h2>
              <p className="text-slate-500 mt-2 text-sm">
                API 문서 접근을 위해 보안 토큰을 입력해주세요.
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
              <div className="relative">
                <input
                  name="token"
                  type="password"
                  placeholder="Access Token"
                  className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-slate-800 placeholder:text-slate-400 font-mono text-sm"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>인증하기</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      {isAuthenticated && (
        <div>
          {/* Logout */}
          <div className="flex justify-end">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              <LogOut size={16} />
              로그아웃
            </button>
          </div>

          {/* Title */}
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              Swagger Type Picker
            </h1>
            <p className="text-slate-500">
              API 스펙을 조회하여 TypeScript Interface로 변환합니다.
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="/api/biz/job (API 경로를 입력하여 필터링)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-slate-700 font-mono text-sm shadow-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl transition-colors shadow-md shadow-indigo-100 flex items-center gap-2 min-w-[120px] justify-center"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                "조회하기"
              )}
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2 animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              {error}
            </div>
          )}

          {/* Code Editor Area */}
          <div className="flex-1 flex flex-col min-h-[400px] border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-mono">
                <Code2 size={14} />
                <span>TypeScript Interface</span>
              </div>

              {!isLoading && code && (
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    copySuccess
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  {copySuccess ? <Check size={14} /> : <Copy size={14} />}
                  {copySuccess ? "복사 완료!" : "코드 복사"}
                </button>
              )}
            </div>

            {/* Editor Content */}
            <div className="relative flex-1 bg-[#1e293b] overflow-hidden group">
              {isLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-[2px] text-white">
                  <Loader2 className="h-8 w-8 animate-spin mb-3 text-indigo-400" />
                  <p className="text-sm font-medium text-slate-300">
                    스키마 불러오는 중...
                  </p>
                </div>
              )}

              <pre className="h-[400px] overflow-auto p-4 text-sm font-mono leading-relaxed text-slate-300 custom-scrollbar">
                <code>
                  {code ||
                    (!isLoading &&
                      "// 상단 조회 버튼을 눌러 스키마를 불러오세요.")}
                </code>
              </pre>

              {/* Empty State Hint */}
              {!code && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center opacity-20">
                    <FileJson size={64} className="mx-auto mb-2 text-white" />
                    <span className="text-white font-bold text-lg">
                      No Schema Loaded
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwaggerTypePicker;
