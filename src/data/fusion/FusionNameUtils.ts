export const PET_NAME_ALIASES: Record<string, string> = {
      '杈剧壒鍑浆': '杈炬潐鍑壒',
      '瓒呯骇杈剧壒鍑浆': '瓒呯骇杈炬潐鍑壒',
      '閬旂壒鍑卞浆': '杈炬潐鍑壒',
      '瓒呯礆閬旂壒鍑卞浆': '瓒呯骇杈炬潐鍑壒',
      '閬旀潐鍑辩壒': '杈炬潐鍑壒',
      '瓒呯礆閬旀潐鍑辩壒': '瓒呯骇杈炬潐鍑壒',
      '閬旂壒鍑辩壒': '閬旀潐鍑辩壒',
};

const NAME_PUNCTUATION_RE = /[()（）\[\]【】.。,_-]/g;
const AGGRESSIVE_GARBLED_RE = /瓒呯骇|瓒呯礆|鍙樺紓|璁婄暟|鐙傚寲|绁炵帇|鏆椾箣|瑕洪啋|瑙夐啋|鏀归€爘绌舵サ|绌舵瀬/g;
const AGGRESSIVE_CJK_RE = /超級|超|變異|訓數|狂化|神王|暗之|覺醒|改造|究極/g;

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
            value = value.replace(AGGRESSIVE_GARBLED_RE, '').replace(AGGRESSIVE_CJK_RE, '');
      }
      return value;
}

