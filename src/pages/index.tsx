import CsvDrop from "@/components/common/CsvDrop";

export default function Home() {
  return (
    <div className="p-4 md:p-8 grid gap-6">
      <CsvDrop onFiles={(f)=>alert(`CSV ${f.length}件 受領`)} />
    </div>
  );
}