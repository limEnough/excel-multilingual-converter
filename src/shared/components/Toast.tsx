import { CheckCircle2, CircleAlert } from "lucide-react";

interface ToastProps {
  data: {
    type: "success" | "error";
    text: string;
  } | null;
}

const Toast: React.FC<ToastProps> = ({ data }) => {
  if (!data) return <></>;

  const { type, text } = data;

  return (
    <div
      className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in-down ${
        type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 size={20} />
      ) : (
        <CircleAlert size={20} />
      )}
      <span className="font-medium">{text}</span>
    </div>
  );
};

export default Toast;
export type { ToastProps };
