export const PET_NAME_ALIASES: Record<string, string> = {
      // Canonicalize historical naming variants to the in-game display name.
      '达特凯彬': '达杉凯特',
      '达特凯特': '达杉凯特',
      '超级达特凯彬': '超级达杉凯特',
      '超级达特凯特': '超级达杉凯特',
      '達特凱彬': '达杉凯特',
      '達特凱特': '达杉凯特',
      '超級達特凱彬': '超级达杉凯特',
      '超級達特凱特': '超级达杉凯特',
      '達杉凱特': '达杉凯特',
};

const NAME_PUNCTUATION_RE = /[()（）\[\]【】.。,_-]/g;
const AGGRESSIVE_VARIANT_RE = /超級|超级|超|變異|变异|訓數|狂化|神王|暗之|覺醒|觉醒|改造|究極|究极/g;

export interface NormalizeNameOptions {
      aggressive?: boolean;
}

export function canonicalPetName(raw: string): string {
      const clean = String(raw ?? '').trim();
      if (!clean) return '';
      return PET_NAME_ALIASES[clean] ?? clean;
}

export function normalizeFusionNameKey(raw: string, options?: NormalizeNameOptions): string {
      let value = canonicalPetName(raw)
            .replace(/\s+/g, '')
            .replace(NAME_PUNCTUATION_RE, '')
            .toLowerCase();

      if (options?.aggressive) {
            value = value.replace(AGGRESSIVE_VARIANT_RE, '');
      }
      return value;
}
