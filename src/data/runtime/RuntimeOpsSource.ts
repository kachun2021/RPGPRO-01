import opsRaw from './ops.json';

export interface RuntimeServerMessage {
      index: number;
      type: string;
      message: string;
      state: string;
}

interface OpsPayload {
      zoneServerMessages?: Array<{
            MsgIndex?: number;
            MsgType?: string;
            Message?: string;
            State?: string;
      }>;
}

const OPS = opsRaw as OpsPayload;

function toInt(value: unknown, fallback = 0): number {
      if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return fallback;
      return Math.floor(parsed);
}

export function getRuntimeServerMessages(): RuntimeServerMessage[] {
      const rows = Array.isArray(OPS.zoneServerMessages) ? OPS.zoneServerMessages : [];
      return rows
            .map((row) => ({
                  index: toInt(row.MsgIndex, 0),
                  type: String(row.MsgType ?? '').trim(),
                  message: String(row.Message ?? '').trim(),
                  state: String(row.State ?? '').trim(),
            }))
            .filter((row) => row.index > 0 && row.message.length > 0)
            .sort((a, b) => a.index - b.index);
}

