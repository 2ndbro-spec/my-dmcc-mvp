import ActionForm from "@/components/factory/ActionForm";

export default function FactoryPage() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto grid gap-6">
      <h1 className="text-xl font-semibold">施策ファクトリー</h1>
      <ActionForm onSubmit={(p)=>alert(JSON.stringify(p, null, 2))} />
    </div>
  );
}