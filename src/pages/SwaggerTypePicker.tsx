import React, { useEffect, useMemo, useState } from "react";
import {
  parseSwaggerToTypeBlocks,
  type TypeBlock,
} from "../shared/utils/swagger-to-ts";
import { Search, Copy, Check, Box } from "lucide-react";
import type { PageProps } from "../App";
const SWAGGER_JSON_PATH = "/api/api-docs";

const SwaggerTypePicker: React.FC<PageProps> = ({ showToast, token }) => {
  const isAuthenticated = !!token;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allSchemaBlocks, setAllSchemaBlocks] = useState<TypeBlock[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 검색 로직: 이미 변환된 블록들 중에서 필터링
  const filteredBlocks = useMemo<TypeBlock[]>(() => {
    if (!searchTerm.trim()) return []; // 검색어 없으면 빈 배열 반환

    const lowerQuery = searchTerm.toLowerCase();
    return allSchemaBlocks.filter((block) =>
      block.name.toLowerCase().includes(lowerQuery)
    );
  }, [searchTerm, allSchemaBlocks]);

  const hasResults = filteredBlocks.length > 0;
  const isSearching = searchTerm.trim().length > 0;

  // #region 이벤트 핸들러
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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
      setAllSchemaBlocks(parseSwaggerToTypeBlocks(json));
    } catch (err: any) {
      const msg = err.message || "스키마를 불러오는 중 오류가 발생했습니다.";
      setError(msg);
      showToast("error", msg);
    } finally {
      setIsLoading(false);
    }
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
      <div>
        {/* 타이틀 */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Swagger Type Picker
          </h1>
          <p className="text-slate-500">
            API 스펙을 조회하여 TypeScript Interface로 변환합니다.
          </p>
        </div>

        {/* 검색 영역 */}
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="검색할 타입 이름 입력 (예: User, Response...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            // className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-lg"
            className="w-full pl-10 pr-4 py-4 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-slate-700 font-mono text-sm shadow-sm"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 flex items-center gap-2">
            {isSearching && (
              <span
                className={
                  hasResults ? "text-indigo-600 font-medium" : "text-gray-400"
                }
              >
                {hasResults ? `${filteredBlocks.length}개 찾음` : "결과 없음"}
              </span>
            )}
            {/* 전체 로드된 개수 표시 (디버깅/확인용) */}
            {!isSearching && (
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                Total: {allSchemaBlocks.length}
              </span>
            )}
          </div>
        </div>

        {/* 에러 영역 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2 animate-pulse">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            {error}
          </div>
        )}

        {/* 결과 영역 */}
        {isSearching && hasResults ? (
          <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {filteredBlocks.map((block) => (
              <div
                key={block.name}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow"
              >
                {/* 카드 헤더 */}
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Box size={18} className="text-indigo-500" />
                    <span className="font-bold text-gray-700">
                      {block.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">
                      TypeScript
                    </span>
                  </div>

                  {/* 복사 버튼 */}
                  <button
                    onClick={() => handleCopy(block.code, block.name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 rounded-lg text-gray-500 transition-all text-sm font-medium"
                  >
                    {copiedKey === block.name ? (
                      <>
                        <Check size={16} className="text-green-600" />
                        <span className="text-green-600">복사됨</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>복사</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 코드 블록 본문 */}
                <div className="relative bg-[#1e1e1e] p-5 overflow-x-auto">
                  <pre className="text-sm font-mono leading-relaxed">
                    <code className="language-typescript text-blue-300">
                      {block.code.split("\n").map((line, i) => (
                        <div key={i} className="table-row">
                          <span className="table-cell select-none text-gray-600 w-8 text-right pr-4 text-xs opacity-50">
                            {i + 1}
                          </span>
                          <span className="table-cell whitespace-pre-wrap break-all">
                            {/* 간단한 구문 강조 */}
                            {line
                              .replace(
                                /(export interface)/g,
                                '<span class="text-pink-400">$1</span>'
                              )
                              .replace(
                                /(\w+)(\??:)/g,
                                '<span class="text-blue-200">$1</span>$2'
                              ) // 속성명
                              .replace(
                                /(: )(\w+)(;|\[)/g,
                                '$1<span class="text-green-300">$2</span>$3'
                              ) // 타입명
                              .split(/<span class="([^"]+)">([^<]+)<\/span>/g)
                              .map((part, idx, arr) => {
                                // 정규식 split 결과 처리 (짝수 인덱스는 일반 텍스트, 홀수는 클래스/내용)
                                if (idx % 3 === 0) return part;
                                if (idx % 3 === 1) return null; // 클래스명 부분은 다음 루프에서 처리
                                const className = arr[idx - 1];
                                return (
                                  <span key={idx} className={className}>
                                    {part}
                                  </span>
                                );
                              })}
                          </span>
                        </div>
                      ))}
                    </code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        ) : isSearching && !hasResults ? (
          <div className="text-center py-12 text-gray-400">
            <p>일치하는 타입 정의가 없습니다.</p>
          </div>
        ) : (
          /* 검색 전: 안내 문구 */
          <div className="text-center py-20 text-gray-400 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-500">
                타입 검색을 시작하세요
              </p>
              <p className="text-sm">
                위 입력창에 DTO 이름을 입력하면 즉시 변환된 코드가 나타납니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SwaggerTypePicker;
