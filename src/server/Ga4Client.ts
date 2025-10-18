type RunReportRequest = {
  dateRanges: { startDate: string; endDate: string }[];
  metrics: { name: string }[];
  dimensions?: { name: string }[];
};

const isMock = process.env.GA4_MOCK === "1";
const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;

function fmt(d: Date) {
  return d.toISOString().slice(0,10).replace(/-/g, "");
}

/** 7日間のモックデータを返す */
function mockRunReport(_: RunReportRequest) {
  const rows = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const seed = d.getDate() + d.getMonth()*3 + 13;
    const sessions = 120 + (seed % 40);     // 120±40のゆらぎ
    const users = Math.round(sessions * 0.85);
    rows.push({
      dimensionValues: [{ value: fmt(d) }], // date (YYYYMMDD)
      metricValues: [{ value: String(sessions) }, { value: String(users) }],
    });
  }
  return {
    dimensionHeaders: [{ name: "date" }],
    metricHeaders: [{ name: "sessions" }, { name: "activeUsers" }],
    rows,
    rowCount: rows.length,
    kind: "analyticsData#runReport",
  };
}

export async function runReport(accessToken: string | null, body: RunReportRequest) {
  // モック条件：GA4_MOCK=1 もしくは GA4_PROPERTY_ID 未設定
  if (isMock || !GA4_PROPERTY_ID) {
    return mockRunReport(body);
  }

  // 実弾（あとでキー入れたら有効化）
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA4 runReport failed: ${res.status} ${text}`);
  }
  return res.json();
}