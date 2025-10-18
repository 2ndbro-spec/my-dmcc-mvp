"use client";

type Props = {
  title: string;
  provider: "analytics" | "searchconsole";
  connected?: boolean;
  accountEmail?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
};

export function GoogleConnectCard({
  title,
  provider,
  connected,
  accountEmail,
  onConnect,
  onDisconnect,
}: Props) {
  return (
    <div className="border rounded-lg p-4 flex items-center justify-between">
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-gray-500">
          {connected ? `Connected: ${accountEmail ?? "-"}` : "Not connected"}
        </div>
      </div>
      <div className="flex gap-2">
        {!connected ? (
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={onConnect}>
            Connect
          </button>
        ) : (
          <button className="px-3 py-1 bg-gray-200 rounded" onClick={onDisconnect}>
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
}