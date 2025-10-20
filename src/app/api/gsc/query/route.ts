import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const VIEW_ID = 'https://dennoworks.com'; // 取得対象のGSCプロパティ

export async function GET() {
  try {
    const keyFile = path.join(process.cwd(), 'var', 'credentials.json');
    const key = JSON.parse(await fs.readFile(keyFile, 'utf8'));

    const jwt = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const webmasters = google.searchconsole({ version: 'v1', auth: jwt });

    const res = await webmasters.searchanalytics.query({
      siteUrl: VIEW_ID,
      requestBody: {
        startDate: '2025-09-25',
        endDate: '2025-10-19',
        dimensions: ['date'],
        rowLimit: 100,
      },
    });

    return NextResponse.json(res.data.rows ?? []);
  } catch (err) {
    console.error('GSC API error:', err);
    return NextResponse.json({ error: err.message || 'GSC fetch failed' }, { status: 500 });
  }
}