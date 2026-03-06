import opsRaw from './ops.json';

export interface RuntimeServerMessage {
      index: number;
      type: string;
      message: string;
      state: string;
}

export interface RuntimeEventConfig {
      idx: number;
      eventStart: string;
      eventEnd: string;
      coreRate: number;
      expRate: number;
      itemRate: number;
      gpRate: number;
}

export interface RuntimeEventDropMap {
      idx: number;
      mapName: string;
      configuredDropSlots: number;
}

interface OpsPayload {
      zoneServerMessages?: Array<{
            MsgIndex?: number;
            MsgType?: string;
            Message?: string;
            State?: string;
      }>;
      event?: Array<{
            idx?: number;
            EventStart?: string;
            EventEnd?: string;
            CoreRate?: number;
            ExpRate?: number;
            ItemRate?: number;
            GpRate?: number;
      }>;
      eventDrops?: Array<{
            idx?: number;
            book_name?: string;
            [key: string]: unknown;
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

export function getRuntimeEventConfigs(): RuntimeEventConfig[] {
      const rows = Array.isArray(OPS.event) ? OPS.event : [];
      return rows
            .map((row) => ({
                  idx: toInt(row.idx, 0),
                  eventStart: String(row.EventStart ?? '').trim(),
                  eventEnd: String(row.EventEnd ?? '').trim(),
                  coreRate: Math.max(0, toInt(row.CoreRate, 0)),
                  expRate: Math.max(0, toInt(row.ExpRate, 0)),
                  itemRate: Math.max(0, toInt(row.ItemRate, 0)),
                  gpRate: Math.max(0, toInt(row.GpRate, 0)),
            }))
            .filter((row) => row.idx >= 0);
}

export function getRuntimeEventDropMaps(): RuntimeEventDropMap[] {
      const rows = Array.isArray(OPS.eventDrops) ? OPS.eventDrops : [];
      return rows
            .map((row) => {
                  let configuredDropSlots = 0;
                  for (let i = 1; i <= 10; i++) {
                        const value = toInt(row[`item_0${i}`], 0);
                        if (value > 0) configuredDropSlots += 1;
                  }
                  return {
                        idx: toInt(row.idx, 0),
                        mapName: String(row.book_name ?? '').trim() || '未命名地圖',
                        configuredDropSlots,
                  };
            })
            .filter((row) => row.idx > 0)
            .sort((a, b) => b.configuredDropSlots - a.configuredDropSlots || a.mapName.localeCompare(b.mapName, 'zh-Hant'));
}
