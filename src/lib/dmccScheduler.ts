// src/lib/dmccScheduler.ts
// DMCC Phase3：自動スキャン実行のスケジューラ（改訂版）
// --------------------------------------------------
// 目的：daily / weekly / monthly の定期ジョブを安全に単一プロセスで実行
// 前提：Node.js runtime 常駐環境（Vercelの場合は Scheduled Functionで代替）
// 機能：スケジュール読込・cron管理・履歴追記・メール通知

import cron from "node-cron";
import fs from "node:fs";
import path from "node:path";
import { triggerScan } from "./reportTrigger";
import { notifyScanFinished } from "@/lib/mailer";

// --------------------------------------------------
// 設定ファイル読込
// --------------------------------------------------

const VAR_DIR = path.join(process.cwd(), "var", "config");
const USER_CONF = path.join(VAR_DIR, "user.json");

export type DMCCSchedule = {
  schedule: "daily" | "weekly" | "monthly";
  hour?: number;
  minute?: number;
  dow?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  dom?: number;
};

function readSchedule(): DMCCSchedule {
  try {
    const raw = fs.readFileSync(USER_CONF, "utf-8");
    const json = JSON.parse(raw);
    const s: DMCCSchedule = json?.schedule || json;
    return {
      schedule: s.schedule ?? "daily",
      hour: s.hour ?? 3,
      minute: s.minute ?? 0,
      dow: s.dow ?? 1,
      dom: s.dom ?? 1,
    };
  } catch {
    return { schedule: "daily", hour: 3, minute: 0, dow: 1, dom: 1 };
  }
}

// --------------------------------------------------
// Cron式生成
// --------------------------------------------------

function toCronExpr(conf: DMCCSchedule): string {
  const m = conf.minute ?? 0;
  const h = conf.hour ?? 3;
  switch (conf.schedule) {
    case "daily":
      return `${m} ${h} * * *`;
    case "weekly":
      return `${m} ${h} * * ${conf.dow ?? 1}`;
    case "monthly":
      return `${m} ${h} ${conf.dom ?? 1} * *`;
    default:
      return `${m} ${h} * * *`;
  }
}

// --------------------------------------------------
// JSONL ロガー
// --------------------------------------------------

const DATA_DIR = path.join(process.cwd(), "var", "data");
const HIST_PATH = path.join(DATA_DIR, "scan-history.jsonl");

function appendHistory(line: Record<string, unknown>) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.appendFileSync(HIST_PATH, JSON.stringify(line) + "\n", "utf-8");
  } catch (e) {
    console.error("appendHistory failed", e);
  }
}

// --------------------------------------------------
// スケジューラ（シングルトン制御）
// --------------------------------------------------

const g = globalThis as unknown as { __dmccScheduler?: { stop: () => void } };

export function ensureScheduler() {
  if (g.__dmccScheduler) return g.__dmccScheduler;

  const conf = readSchedule();
  const expr = toCronExpr(conf);

  appendHistory({ t: Date.now(), type: "scheduler:init", expr, conf });

  const task = cron.schedule(
    expr,
    async () => {
      const start = Date.now();
      appendHistory({ t: start, type: "scan:start", reason: "cron" });

      try {
        const res = await triggerScan("daily");
        appendHistory({ t: Date.now(), type: "scan:ok", ms: Date.now() - start, meta: res });

        // ✅ 成功通知メール送信
        await notifyScanFinished({
          period: "daily",
          meta: res,
        });
      } catch (e) {
        appendHistory({ t: Date.now(), type: "scan:err", ms: Date.now() - start, err: String(e) });

        // ✅ 失敗通知メール送信
        await notifyScanFinished({
          period: "daily",
          meta: { error: String(e) },
        });
      }
    },
    { scheduled: true, timezone: "Asia/Tokyo" }
  );

  const stop = () => task.stop();
  g.__dmccScheduler = { stop };
  return g.__dmccScheduler;
}

// --------------------------------------------------
// 公開API
// --------------------------------------------------

export function getCurrentSchedule(): DMCCSchedule {
  return readSchedule();
}

export function getCronExpr(): string {
  return toCronExpr(readSchedule());
}