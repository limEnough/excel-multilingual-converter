interface StepItemProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  tips?: (string | React.ReactNode)[]; // Updated to accept React Nodes
  actions?: React.ReactNode;
}

const StepItem: React.FC<StepItemProps> = ({
  icon,
  title,
  desc,
  tips,
  actions,
}) => {
  return (
    <>
      <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
        <div className="w-16 h-16 bg-white flex items-center justify-center rounded-md border border-slate-200 shadow-sm shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-slate-800">{title}</h3>
            {actions && actions}
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
          {tips && tips.length > 0 && (
            <ul className="mt-3 space-y-1.5 bg-white p-3 rounded-md border border-slate-200 text-sm text-slate-600 shadow-sm">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default StepItem;
