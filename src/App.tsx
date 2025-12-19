import React, { useState } from "react";
import Tab from "./shared/components/Tab";
import Toast from "./shared/components/Toast";
import SwaggerTypePicker from "./pages/SwaggerTypePicker";
import LanguageSearcher from "./pages/LanguageSearcher";
import LanguageUploader from "./pages/LanguageUploader";

export default function App() {
  // #region Header Tab
  const [activeIndex, setActiveIndex] = useState(0);
  // #endregion

  // #region Toast Notification
  // TODO: useHook 으로 만들기
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };
  // #endregion

  return (
    <div className="min-h-screen bg-slate-50 font-['Pretendard'] text-slate-900 flex flex-col">
      {/* Toast Notification */}
      {toast && <Toast data={toast} />}

      {/* Header Tab */}
      <Tab activeIndex={activeIndex} setActiveIndex={setActiveIndex} />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto w-full p-6 mt-4 flex-1">
        {activeIndex === 0 ? (
          <LanguageUploader showToast={showToast} />
        ) : activeIndex === 1 ? (
          <LanguageSearcher showToast={showToast} />
        ) : (
          <SwaggerTypePicker showToast={showToast} />
        )}
      </div>
    </div>
  );
}
