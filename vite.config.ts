import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 현재 작업 디렉토리(process.cwd())에서 .env 파일 로드
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: env.VITE_API_TARGET,
          changeOrigin: true,
          secure: false, // https 인증서 문제 무시 (개발용)

          // 403 에러 방지를 위한 헤더 오버라이딩 (동적 할당)
          configure: (proxy, _options) => {
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              proxyReq.setHeader("Origin", env.VITE_API_TARGET);
              proxyReq.setHeader("Referer", env.VITE_API_TARGET + "/");
            });
          },
        },
      },
    },
  };
});
