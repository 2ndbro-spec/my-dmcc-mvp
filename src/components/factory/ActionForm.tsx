import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export default function ActionForm({ onSubmit }: { onSubmit: (p: any)=>void }) {
  const [goal, setGoal] = useState("");
  const [constraints, setConstraints] = useState("");
  const [seedUrl, setSeedUrl] = useState("");
  const disabled = !goal.trim();

  return (
    <form className="grid gap-3" onSubmit={(e)=>{e.preventDefault(); onSubmit({ goal, constraints, seedUrl });}}>
      <Input placeholder="対象URL（任意）" value={seedUrl} onChange={(e)=>setSeedUrl(e.target.value)} />
      <Textarea rows={4} placeholder="達成したいゴール（例：3ヶ月でCVR+20%）" value={goal} onChange={(e)=>setGoal(e.target.value)} />
      <Textarea rows={3} placeholder="制約条件（例：広告費は月30万円以内）" value={constraints} onChange={(e)=>setConstraints(e.target.value)} />
      <Button type="submit" className="rounded-2xl" disabled={disabled}>施策案を生成</Button>
    </form>
  );
}