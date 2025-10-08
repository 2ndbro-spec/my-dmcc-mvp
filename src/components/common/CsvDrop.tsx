import { useState, DragEvent } from "react";

export default function CsvDrop({ onFiles }: { onFiles: (f: File[])=>void }) {
  const [active, setActive] = useState(false);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setActive(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith(".csv"));
    if (files.length) onFiles(files);
  };

  return (
    <div
      onDragOver={(e)=>{e.preventDefault(); setActive(true);}}
      onDragLeave={()=>setActive(false)}
      onDrop={onDrop}
      className={`rounded-2xl border-2 border-dashed p-6 grid place-items-center transition 
        ${active ? "border-black bg-gray-50 scale-[1.01]" : "border-gray-300"}`}>
      <p className="text-sm">ここにCSVをドラッグ＆ドロップ</p>
    </div>
  );
}