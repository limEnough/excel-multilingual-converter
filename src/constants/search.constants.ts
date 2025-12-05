// Search Page Constants
const SEARCH = {
  LANG_OPTIONS: [
    { label: "[ko] 한국어", value: "ko" },
    { label: "[en] 영어", value: "en" },
    { label: "[km] 캄보디아어", value: "km" },
    { label: "[ne] 네팔어", value: "ne" },
    { label: "[tl] 필리핀어", value: "tl" },
    { label: "[id] 인도네시아어", value: "id" },
    { label: "[vi] 베트남어", value: "vi" },
    { label: "[bn] 방글라데시어", value: "bn" },
    { label: "[zh] 중국어", value: "zh" },
    { label: "[uz] 우즈베키스탄어", value: "uz" },
    { label: "[si] 스리랑카어", value: "si" },
    { label: "[th] 태국어", value: "th" },
    { label: "[my] 미얀마어", value: "my" },
    { label: "[ru] 러시아어", value: "ru" },
    { label: "[ur] 파키스탄어", value: "ur" },
    { label: "[mn] 몽골어", value: "mn" },
    { label: "[ja] 일본어", value: "ja" },
    { label: "[lo] 라오스어", value: "lo" },
  ],
  PAGE_CATEGORIES_RAW: [
    "FO-HP-COM : 한패스플러스 공통 주소",
    "FO-CM-1.1.1 : 커뮤니티 > 전체",
    "FO-CM-1.1.1.1B : 커뮤니티 > 카테고리 설정 (공통) > 중고거래 분류",
    "FO-CM-1.1.1.1 : 커뮤니티 > 게시글 상세",
    "FO-CM-1.1.1.3 : 커뮤니티 > 게시글 작성 > 일상",
    "FO-CM-1.1.1.4 : 커뮤니티 > 게시글 작성 > 중고거래",
    "FO-CM-1.1.1.6 : 커뮤니티 > 게시글 작성 > 행사",
    "FO-JN-COM : 구인구직 > 목록 (공통)",
    "FO-JN-1.1.3 : 구인구직 > 일자리 정보 > 목록",
    "FO-JN-1.1.4 : 구인구직 > 일자리 정보 > 지도",
    "FO-JN-1.1.1.1.1 : 구인구직 > 일자리 정보 > 구인구직 상세",
    "FO-JN-TAB : 구인구직 > 맞춤 일자리",
    "FO-JN-1.1.1.2 : 구인구직 > 맞춤 일자리",
    "FO-JN-1.1.1.1 : 구인구직 > 맞춤 일자리 > 일자리 Pick 리스트",
    "FO-JN-1.2.1 : 구인구직 > 일자리 방송",
    "FO-JN-1.3.1 : 구인구직 > 지원내역 관리 > 목록",
    "FO-JN-1.4.1 : 구인구직 > 이력서 관리",
    "FO-JN-1.4.2 : 구인구직 > 이력서 관리 > 이력서 작성",
    "FO-SO-COM : SOS 한패스 > 공통",
    "FO-SO-1.1.1.1 : SOS 한패스 > 게시글 상세 > 프로필 설정",
    "FO-SO-1.1.1.2 : SOS 한패스 > 게시글 작성",
    "FO-SO-1.2.1B : SOS 한패스 > 카테고리 설정",
    "FO-VNS-VI : 비자네비 > 비자정보",
    "FO-VNS-COMM : 비자네비 > 서비스",
    "FO-VNS-VC : 비자네비 > 비자점수계산기",
    "FO-VNS-VA : 비자네비 > 비자상담",
    "FO-VNS-VI : 서버에러메시지",
    "FO-JOB-036 : 구인구직 > .지원내역관리",
    "FO-JOB-POP : 구인구직 > 팝업",
    "직접입력",
  ],
  PAGE_CATEGORIES: () => {
    return SEARCH.PAGE_CATEGORIES_RAW.map((item) => {
      if (item === "직접입력") return { name: item, value: "DIRECT" };
      const parts = item.split(" : ");
      // 구분자가 없는 경우 대비
      if (parts.length < 2) return { name: item, value: item };
      return { name: item, value: parts[0] };
    });
  },
};

export { SEARCH };
