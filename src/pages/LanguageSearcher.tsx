import React, { useState, useRef, useEffect } from "react";
import { SEARCH } from "../core/constants/search.constants";
import {
  Loader2,
  Search as SearchIcon,
  ChevronDown,
  CheckSquare,
  Square,
  Lock,
  LogOut,
  Database,
  Copy,
} from "lucide-react";
const API_BASE_URL = "/api/v1/trans/list"; // CORS 해결을 위한 Proxy 경로 설정

interface PageProps {
  showToast: (type: "success" | "error", text: string) => void;
}

interface TranslationItem {
  transCode: string;
  langCode: string;
  langName: string;
  transContent: string;
  pageId: string;
}

const LanguageSearcher: React.FC<PageProps> = ({ showToast }) => {
  // 인증 관련
  const headersRef = useRef<Headers>(new Headers());
  const [token, setToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 검색 관련
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<TranslationItem[]>([]); // 검색 결과 상태
  const [hasSearched, setHasSearched] = useState(false); // 검색 수행 여부

  // 검색 필터 관련
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [pageCategoryValue, setPageCategoryValue] = useState(""); // Stores 'value' like FO-HP-COM
  const [directPageId, setDirectPageId] = useState("");
  const [transCode, setTransCode] = useState("");
  const [transContent, setTransContent] = useState("");

  // #region 쿠키 관리
  function setCookie(name: string, value: string, hours: number) {
    let expires = "";
    if (hours) {
      const date = new Date();
      date.setTime(date.getTime() + hours * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  }

  function getCookie(name: string) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  function eraseCookie(name: string) {
    document.cookie =
      name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  }
  // #endregion

  // #region 세션 관리
  // 세션 관리용 Refs 및 상수
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SESSION_DURATION = 60 * 60 * 1000; // 1시간 (ms)
  const WARNING_TIME = 10 * 60 * 1000; // 10분 (ms) - 만료 전 경고 시간

  // 세션 타이머 시작 로직
  const startSessionTimers = (expiryTime: number) => {
    clearTimers();
    const now = Date.now();
    const timeLeft = expiryTime - now;

    // 이미 만료된 경우
    if (timeLeft <= 0) {
      handleLogout(true); // 묻지 않고 로그아웃
      alert("세션이 만료되어 로그아웃되었습니다.");
      return;
    }

    // 로그아웃 타이머 설정 (만료 시점)
    logoutTimerRef.current = setTimeout(() => {
      handleLogout(true);
      alert("세션 유효시간(1시간)이 만료되어 자동 로그아웃되었습니다.");
    }, timeLeft);

    // 연장 확인 타이머 설정 (만료 10분 전)
    const warningDelay = timeLeft - WARNING_TIME;
    if (warningDelay > 0) {
      warningTimerRef.current = setTimeout(() => {
        if (
          window.confirm(
            "로그인 세션 만료 10분 전입니다.\n세션을 1시간 연장하시겠습니까?"
          )
        ) {
          extendSession();
        }
      }, warningDelay);
    }
  };

  // 세션 연장 로직
  const extendSession = () => {
    const currentToken = getCookie("authToken");
    if (currentToken) {
      setCookie("authToken", currentToken, 1); // 쿠키 1시간 갱신
      const newExpiry = Date.now() + SESSION_DURATION;
      localStorage.setItem("tokenExpiry", newExpiry.toString());
      startSessionTimers(newExpiry); // 타이머 재설정
      showToast("success", "세션이 1시간 연장되었습니다.");
    } else {
      handleLogout(true);
    }
  };

  // 초기 로드 시 세션 확인
  useEffect(() => {
    const storedToken = getCookie("authToken");
    const storedExpiry = localStorage.getItem("tokenExpiry");

    if (storedToken && storedExpiry) {
      const expiryTime = parseInt(storedExpiry, 10);
      if (Date.now() < expiryTime) {
        // 유효한 세션
        headersRef.current.set("Authorization", `Bearer ${storedToken}`);
        headersRef.current.set("Accept-Language", "ko");
        setToken(storedToken);
        setIsAuthenticated(true);
        startSessionTimers(expiryTime);
      } else {
        // 만료된 세션
        eraseCookie("authToken");
        localStorage.removeItem("tokenExpiry");
      }
    }

    return () => clearTimers(); // 컴포넌트 언마운트 시 타이머 정리
  }, []);

  // 타이머 정리 함수
  const clearTimers = () => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
  };
  // #endregion

  // #region 이벤트 핸들러
  const handleLogin = (inputToken: string) => {
    if (!inputToken) return;

    // 쿠키에 토큰 저장 (1시간)
    setCookie("authToken", inputToken, 1);

    // 만료 시간 계산 및 로컬스토리지 저장 (타이머 복구용)
    const expiryTime = Date.now() + SESSION_DURATION;
    localStorage.setItem("tokenExpiry", expiryTime.toString());

    headersRef.current.set("Authorization", `Bearer ${inputToken}`);
    headersRef.current.set("Accept-Language", "ko");
    setToken(inputToken);
    setIsAuthenticated(true);

    // 타이머 시작
    startSessionTimers(expiryTime);
  };

  const handleLogout = (silent = false) => {
    if (!silent && !window.confirm("로그아웃 하겠습니까?")) {
      return;
    }

    clearTimers();
    eraseCookie("authToken");
    localStorage.removeItem("tokenExpiry");
    setToken("");
    setIsAuthenticated(false);
    setSearchResults([]);
    setHasSearched(false);
    headersRef.current.delete("Authorization");
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
  // #endregion

  const isDirectInput = pageCategoryValue === "DIRECT";
  const isSearchEnabled =
    pageCategoryValue !== "" && (!isDirectInput || directPageId.trim() !== "");

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
              onClick={() => handleLogout()}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              <LogOut size={16} />
              로그아웃
            </button>
          </div>

          {/* Title */}
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              Search Multi-Language
            </h1>
            <p className="text-slate-500">
              서버에 업로드된 다국어를 검색합니다.
            </p>
          </div>

          {/* Main */}
          <main
            className={`space-y-6 transition-opacity duration-500 opacity-100`}
          >
            {/* Language Filter */}
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

            {/* Search Form */}
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

                {/* TODO: 검색 기능 구현 */}
                {/* Trans Code Input */}
                {/* <div className="lg:col-span-2 space-y-1.5">
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
            </div> */}

                {/* TODO: 검색 기능 구현 */}
                {/* Trans Content Input */}
                {/* <div className="lg:col-span-3 space-y-1.5">
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
            </div> */}

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

            {/* Search Results */}
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
                    TRANS CODE, TRANS CONTENT 컬럼의 텍스트를 클릭하여
                    복사해보세요!
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
                          <th className="px-6 py-3 font-medium w-32">
                            Lang Name
                          </th>
                          <th className="px-6 py-3 font-medium w-40">
                            Page ID
                          </th>
                          <th className="px-6 py-3 font-medium w-48">
                            Trans Code
                          </th>
                          <th className="px-6 py-3 font-medium">
                            Trans Content
                          </th>
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
          </main>
        </div>
      )}
    </div>
  );
};

export default LanguageSearcher;
