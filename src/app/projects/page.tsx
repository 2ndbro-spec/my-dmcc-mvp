// src/app/projects/page.tsx
"use client";
import useSWR from "swr";
const f=(u:string)=>fetch(u).then(r=>r.json());

export default function Projects(){
  const { data: pj={goals:[], milestones:[], tasks:[]} } = useSWR<any>("/api/data?key=projects", f);

  return (
    <div className="p-6 space-y-6">
      <section className="rounded-xl border p-4">
        <h2 className="font-semibold mb-2">Goals</h2>
        <ul className="list-disc ml-5">{(pj.goals??[]).map((g:any,i:number)=><li key={i}>{g}</li>)}</ul>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="font-semibold mb-2">Milestones</h2>
        <ol className="ml-5 list-decimal space-y-1">{(pj.milestones??[]).map((m:any,i:number)=>
          <li key={i}><b>{m.title}</b> — {m.due}</li>)}
        </ol>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="font-semibold mb-2">Backlog / Tasks</h2>
        <ul className="divide-y">
          {(pj.tasks??[]).map((t:any,i:number)=><li key={i} className="py-2 flex justify-between">
            <div>
              <div className="font-medium">{t.title}</div>
              <div className="text-sm text-gray-600">{t.desc}</div>
            </div>
            <span className="text-xs rounded px-2 py-1 border">{t.status}</span>
          </li>)}
        </ul>
      </section>
    </div>
  );
}