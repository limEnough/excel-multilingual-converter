import React, { useEffect, useRef, useState } from "react";
import Tab from "./shared/components/Tab";
import Toast from "./shared/components/Toast";
import SwaggerTypePicker from "./pages/SwaggerTypePicker";
import LanguageSearcher from "./pages/LanguageSearcher";
import LanguageUploader from "./pages/LanguageUploader";
import { Lock, LogOut } from "lucide-react";

interface PageProps {
  showToast: (type: "success" | "error", text: string) => void;
  token?: string;
}

const App: React.FC = () => {
  // #region 헤더 탭
  const [activeIndex, setActiveIndex] = useState(0);
  // #endregion

  // #region 토스트 메시지
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };
  // #endregion

  // #region 인증 관련
  const headersRef = useRef<Headers>(new Headers());
  const [token, setToken] = useState("");
  // #endregion

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
        startSessionTimers(expiryTime);
      } else {
        // 만료된 세션
        eraseCookie("authToken");
        localStorage.removeItem("tokenExpiry");
        setIsLoginModalOpen(true);
      }
    } else {
      setIsLoginModalOpen(true);
    }

    return () => clearTimers(); // 컴포넌트 언마운트 시 타이머 정리
  }, []);

  // 타이머 정리 함수
  const clearTimers = () => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
  };
  // #endregion

  // #region 로그인/로그아웃
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

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
    setIsLoginModalOpen(false);

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
    headersRef.current.delete("Authorization");
    setToken("");
    setIsLoginModalOpen(true);
  };

  useEffect(() => {
    if (isLoginModalOpen) document.body.classList.add("scroll--lock");
  }, [isLoginModalOpen]);
  // #endregion

  return (
    <div
      className={`min-h-screen bg-slate-50 font-['Pretendard'] text-slate-900 flex flex-col`}
    >
      {/* 토스트 메시지 */}
      {toast && <Toast data={toast} />}

      {/* 헤더 */}
      <header className="flex justify-between bg-white shadow-sm sticky top-0 z-50 px-10">
        <Tab activeIndex={activeIndex} setActiveIndex={setActiveIndex} />

        <button
          onClick={() => handleLogout()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium px-3 py-2 rounded-lg cursor-pointer"
        >
          <LogOut size={16} />
          로그아웃
        </button>
      </header>

      {/* 페이지 콘텐츠 */}
      <div className="max-w-4xl mx-auto w-full p-6 mt-4 flex-1">
        {activeIndex === 0 ? (
          <LanguageUploader showToast={showToast} token={token} />
        ) : activeIndex === 1 ? (
          <LanguageSearcher showToast={showToast} token={token} />
        ) : (
          <SwaggerTypePicker showToast={showToast} token={token} />
        )}
      </div>

      {/* 로그인 모달 */}
      {isLoginModalOpen && (
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
    </div>
  );
};

export default App;
export type { PageProps };
