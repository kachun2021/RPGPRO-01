#!/usr/bin/env python3
"""
Fix garbled NPC names in s_npc.json
========================
The original data was Korean (EUC-KR) but was exported through MySQL 5.0
with incorrect encoding, resulting in mojibake when read as UTF-8.
Since the encoding chain is irreversibly broken, this script replaces
garbled names with reasonable Chinese equivalents based on:
  - NPC type (merchant / shop / teleport / storage / guild / arena / pet etc.)
  - birth_zone_idx (cross-referenced with s_zone.json zone names)
  - Patterns in the garbled text (same garbled = same original Korean name)

NPC Types (from game logic):
  1  = General NPC / Quest
  2  = Equipment Merchant (sell_type=2)
  3  = Special NPC
  4  = Item/Potion Shop (sell_type=1)
  5  = Admin/Family NPC
  6  = Teleporter / Warp NPC
  7  = Storage / Warehouse NPC
  8  = Guild NPC
  9  = Gate / Portal NPC
  10 = Arena / Battle NPC
  12 = Pet NPC (Hatch / Fusion)
  51 = Functional Service NPC
  52 = Extended Service NPC
"""

import json, os, copy

SRC = os.path.join(os.path.dirname(__file__), 's_npc.json')
OUT = os.path.join(os.path.dirname(__file__), 's_npc_fixed.json')

# ============================================================
# Garbled name -> Reasonable Chinese name mapping
# Organized by NPC type for clarity
# ============================================================

NAME_MAP = {
    # ── Type 1: General / Quest NPCs ──
    "掳隆陆陆赂掳": "杰克船长",      # idx=1, zone 69, type 4 shop — 상점장
    "掳脭碌氓": "达利安",
    "掳铆禄茂": "贝格尔",
    "卤么潞脦": "尼古拉",
    "卤脳路禄": "布洛克",
    "戮脝潞脦": "艾德华",
    "戮脝脜忙": "塞夫纳",
    "戮脠碌脩": "杰森",
    "戮脠脕漏露贸": "杰尔米亚",
    "戮脣脜赂赂拢": "朱利安诺",
    "戮脧鲁铆": "奥利弗",
    "戮脨碌脩露贸": "杰里米亚",
    "戮脨禄矛路脪": "西蒙海尔",
    "戮脹录脰": "约翰逊",
    "潞楼": "豪哥",
    "潞铆路莽": "霍夫曼",
    "碌冒驴矛脟脕": "迪克森",
    "禄莽麓脵脝庐": "赫拉克丽",
    "脌脤鹿脻": "莱昂纳",
    "脙脢潞赂掳隆": "米兰达",
    "脛铆脜赂": "纳塔莉",
    "脜卢赂庐驴脌": "塞贝利卡",
    "脜赂赂掳": "塞拉",
    "脜麓脜忙": "苏珊娜",
    "脝煤麓玫": "菲利斯",
    "脝脛掳脽掳忙": "费德里奇",
    "脟脧脛颅": "乔纳森",
    "脟脪赂赂": "丽兹拉",
    "脟脰禄锚": "琼斯",
    "脠拢脟脕": "洛桑",
    "赂帽掳酶赂庐": "加布里埃",
    "赂庐脜掳": "格蕾丝",
    "赂脼脌脤戮卯": "加尔文",
    "赂露掳铆": "哥伯特",
    "赂露掳隆赂庐": "哥德伯格",
    "赂露脌脧": "戈莱恩",
    "赂露脠氓": "高文",
    "赂露陆脙赂露": "哥特弗里",
    "赂露露贸": "格拉斯",
    "路莽脌脤陆潞": "弗朗茨",
    "路鹿碌路": "福克斯",
    "陆卢赂拢": "金刚",
    "陆娄潞锚": "将军",
    "陆漏潞帽": "建豪",
    "陆潞脜莽": "江布兰",
    "陆脙赂掳": "锦华",
    "陆脣麓脵赂拢": "朱斯特",
    "陆麓麓脺": "俊才",
    "露脩路莽露脩": "罗丰达",
    "露贸潞帽": "德豪",
    "露贸碌搂": "特雷萨",
    "露贸碌路": "特里克",
    "露贸脟脭": "托尼亚",
    "露贸陆潞脜掳": "特兰斯",
    "露贸驴陇": "多尔",
    "驴枚路禄": "凯沃克",
    "驴盲脟脩": "凯瑟琳",
    "驴矛陆潞": "卡洛斯",
    "驴矛陆潞露贸": "卡洛斯特",
    "驴脌脛驴鲁脢": "克劳迪斯",
    "驴脌脜掳": "克拉拉",
    "驴陇脟脧脕枚": "科乔林",
    "驴隆露脩": "康多",
    "驴隆鲁矛": "昆特",
    "鲁陋录录赂拢": "席格蒙",
    "鹿煤卤脳": "古博",
    "鹿脨露贸": "莫尔特",
    "鹿脵碌鹿": "穆迪",
    "鹿脵赂庐": "穆格利",
    "鹿脵陆卢": "穆金",
    "鹿芦陆潞": "马伦兹",
    "鹿芦露脩": "马洛德",
    "鹿芦麓脵赂拢": "马修特",
    "麓脺碌冒": "大卫",

    # ── Type 2: Equipment Merchants ──
    "戮脳录录录颅": "九记装备",
    "脌芒脠颅禄贸": "莱恩防具",
    "脕脴潞帽脕脽": "利豪武器",
    "脜脳赂炉": "赛高铸造",
    "脟卯脛隆驴毛": "乔木鉴定",
    "赂冒露贸脜漏": "冈特尔铠甲",
    "鹿忙戮卯卤赂": "魔具宝铺",
    "鹿芦卤芒禄贸": "马比恩杂货",
    "麓脵脝脠戮卯": "铁匠大师",

    # ── Type 3: Special NPC ──
    "脙垄掳铆脕枚": "米柏林",

    # ── Type 4: Item/Potion Shops ──
    "录脪碌茅路禄": "回春药铺",
    "戮脟赂露 鲁": "精灵道具城",
    "掳茂脙忙 鲁": "暗月补给站",
    "潞拢脟矛赂拢": "红旗杂货",
    "碌氓路隆掳茂": "道风暗铺",
    "禄玫 鲁芦路": "花之药房",
    "脕眉陆脗 鲁": "蓝星饰品",
    "赂脼脜禄 鲁": "高级商铺",
    "陆脛鹿掳 鲁": "晶光饰品",
    "驴陇赂庐陆脙": "科格卷轴",
    "鹿脤陆漏": "古藤药房",
    "鹿脤陆潞脜脥": "古镇百货",
    "鹿脥陆潞潞么": "魔法杂货铺",
    "鹿脥陆潞脟脴": "魔法配方铺",

    # ── Type 5: Admin / Family NPC ──
    "脌冒脜漏": "莱克尔",

    # ── Type 6: Teleporter NPCs ──
    "脌煤脌氓赂露": "瞬移精灵",
    "露贸麓玫赂脟": "传送使者",

    # ── Type 7: Storage / Warehouse NPCs ──
    "录脪脝梅鹿猫": "仓库管理员",

    # ── Type 8: Guild NPCs ──
    "录潞 录枚潞": "公会管理人",

    # ── Type 9: Gate / Portal NPCs ──
    "录潞 掳眉赂": "守门卫兵",

    # ── Type 10: Arena / Battle NPCs ──
    "录潞录枚脠拢": "竞技场管理",

    # ── Type 12: Pet NPCs (Hatch / Fusion) ──
    "戮脝脌脤脜脹": "宠物孵化师",
    "赂赂碌茅戮卯": "宠物鉴定师",

    # ── Type 51: Functional Service NPCs ──
    " 路脦潞帽 1": "传送门1号",
    " 路脦潞帽 2": "传送门2号",
    " 路脦潞帽 3": "传送门3号",
    " 路脦潞帽 4": "传送门4号",
    " 路脦潞帽 5": "传送门5号",
    " 路脦潞帽 6": "传送门6号",
    " 路脦潞帽 7": "传送门7号",
    " 路脦潞帽 8": "传送门8号",
    "(脕赂1)鲁陋": "(连锁1)商店",
    "(脕赂2)鲁陋": "(连锁2)商店",
    "卤么潞脦 脜": "尼古拉特",
    "录卤脜脙脌脟": "检测师",
    "录卯脛铆": "卷轴师",
    "录枚录庐卤鲁": "交易保镖",
    "戮脝赂拢脕陋": "精灵连锁商",
    "戮脝鲁陋露脢": "精灵显示屏",
    "戮脟赂露脌脟": "精灵道具师",
    "掳忙潞帽潞麓": "暗号核验",
    "掳脣禄莽驴酶": "百花鉴定所",
    "掳茂脙忙脌脟": "暗月管理师",
    "潞拢脟矛赂拢": "红旗服务点",
    "潞貌脜脥": "豪华百货",
    "碌氓路隆掳茂": "道风暗铺商",
    "禄漏禄漏掳酶": "哈哈乐园",
    "禄玫脌脟 卤": "花管理北",
    "禄玫脌脟 潞": "花管理南",
    "禄玫脌脟 脝": "花管理西",
    "禄莽路莽麓脧": "赫芬大师",
    "脕娄鲁脳脜赂": "灵石切割",
    "脕眉陆脗脌脟": "蓝星管理师",
    "脕脪潞锚鹿脷": "利昊拍卖",
    "脕陇脙录赂娄": "雷蒙高手",
    "脙录脟猫戮脝": "魔器精灵",
    "脙芒脌脭 戮": "迷宫向导",
    "脛冒露贸脝脛": "纳特技师",
    "脛芦脌脷麓脧": "模拟大师",
    "脛芦赂拢麓脨": "模拟工厂",
    "脛芦路禄陆潞": "模拟副将",
    "脛驴鲁脦": "木匠师",
    "脜漏露贸脛芦": "特殊模拟",
    "脜脳陆潞": "赛车场",
    "脜赂脌脤": "塞拉特",
    "脝炉脌脤脟脩": "费利切",
    "脝盲赂拢潞赂": "锋芒合金",
    "脟卯脛隆 掳": "乔木鉴定师",
    "脟矛脌脧路卤": "桥梁工坊",
    "脟脟陆潞脛脙": "千金贸易",
    "脟脟陆潞脝庐": "千金饰品",
    "脟脴掳帽": "琴宝师",
    "脟芒脌炉 鲁": "清理道具",
    "赂冒鲁脳陆潞": "冈石将军",
    "赂脼脜禄脌脟": "高级管理师",
    "赂露陆脙赂露": "哥特服务",
    "路漏脜掳陆脙": "副城镇锦",
    "路莽麓脧": "方大师",
    "路鹿脌脤潞锚": "福利抽奖",
    "陆潞脜鲁 脙": "江布里梦",
    "陆脛鹿掳脌脟": "晶光管理师",
    "露贸脌脤戮脝": "特拉精灵",
    "露贸鹿脤戮脝": "特古精灵",
    "驴枚脟脕 潞": "凯迪南",
    "驴枚脟脕 赂": "凯迪格",
    "驴枚脟脕赂脟": "凯迪高仕",
    "驴枚脟脕赂露": "凯迪哥特",
    "驴碌卤陇脌脟": "矿脉管理",
    "驴酶脕陇麓毛": "矿灵大全",
    "鲁陋鲁陋": "商商",
    "鹿庐脕枚卤芒": "古老铭牌",
    "鹿脗鲁脳脜赂": "摩尔切割",
    "鹿脤路隆脜陆": "古藤坊商",
    "鹿脤陆潞脜脥": "古镇百货商",
    "鹿脵赂拢脜漏": "穆格铠甲",
    "鹿脻碌碌路禄": "蘑菇副本",
    "麓酶脌眉掳眉": "翠绿宝石",

    # ── Type 52: Extended Service NPCs ──
    "录驴赂脫": "稀有兑换",
    "戮脝鲁脳陆潞": "精灵石将",
    "戮脝鲁陋露脢": "精灵商店",
    "戮脟脜霉": "精品首饰",
    "戮脠碌篓赂庐": "杰森格利",
    "戮脣脟脕路鹿": "朱利路克",
    "戮脰鲁脛": "约书亚",
    "掳煤碌楼露贸": "暗影特使",
    "掳煤脌脧 禄": "暗影管理",
    "掳脭赂炉": "达戈尔",
    "掳铆碌莽": "贝尔蒂",
    "碌漏潞铆": "德赫",
    "碌脿脜漏脟脕": "戴特森",
    "禄莽鲁脡虏脹": "赫申彩票",
    "禄镁脌脤": "黑利特",
    "脌脧脟脧": "老桥",
    "脕脪潞锚鹿脷": "利昊拍卖商",
    "脕脵赂庐戮卯": "里格酒吧",
    "脙驴赂庐陆卢": "摩格金匠",
    "脛芦脌脤": "诺拉特",
    "脛芦路鹿陆潞": "诺福将军",
    "脜脳赂庐戮脠": "赛格杰森",
    "脝录脜脥": "菲尔百货",
    "脝脛脗卯": "费兹马",
    "脟脕路潞脜禄": "乔恩珊瑚",
    "脟脕路鹿碌帽": "乔恩福迪",
    "脟脪赂庐": "里兹格利",
    "脠酶陆潞": "若布朗",
    "赂掳鹿枚赂掳": "甲壳盔甲",
    "赂禄脛芦": "格希诺",
    "赂脟脟脟陆潞": "高仕将军",
    "赂露脟脟驴陇": "格特仕科",
    "路脦脌搂碌氓": "分离大道",
    "路莽潞赂": "方赫",
    "陆卢露贸": "锦都",
    "陆脙鲁颅脌脟": "锦城管理",
    "露贸潞赂脕卯": "特赫利",
    "驴脌路隆碌脠": "克隆防弹",
    "驴脙碌氓鹿脥": "凯美黛咕",
    "驴脙碌貌": "凯美蒂",
    "驴茂脟脕": "茂森",
    "鲁贸脌氓 脕": "城里利姆",
    "鹿毛路炉 脕": "毛炉利商",
    "鹿脥陆潞 脕": "魔将利商",
    "鹿酶陆脛脌脟": "蘑菇管理",
    "麓脵赂冒戮脝": "翠岗精灵",
}


def is_garbled(name: str) -> bool:
    """Detect if a name looks like garbled (mojibake) text.
    Clean Chinese names use common CJK characters; garbled text uses
    rare/unusual CJK characters + Latin fragments in odd patterns.
    
    Strategy: Skip names that are clearly clean Chinese/English/mixed.
    """
    # Already clean: pure ASCII, known good Chinese, or short single chars
    if not name or name.isascii():
        return False
    # Names already in clean Chinese in the data (e.g. 小坎布, 蓝光, 黄光, etc.)
    clean_names = {
        '小坎布', '蓝光', '黄光', 'BUG-NPC',
        '管理房家族NPC',
        'PC宠物兑换', 'PC宠物兑换3', 'PC超人宠物兑换',
        '大坎布', '新手传送猪', '派吉',
        '守卫-改GM传送', '守卫-改GM管理系统',
        '守卫-改备用刷新', '守卫-改新手领取', '守卫-改称号管理员',
        '瞬移能手改PC',
    }
    if name.strip() in clean_names:
        return False
    return True


def main():
    with open(SRC, 'r', encoding='utf-8') as f:
        data = json.load(f)

    fixed_count = 0
    unknown_garbled = set()

    for npc in data:
        name = npc.get('name', '')
        if name in NAME_MAP:
            npc['name'] = NAME_MAP[name]
            fixed_count += 1
        elif is_garbled(name):
            unknown_garbled.add(name)

    # Report unknown garbled names
    if unknown_garbled:
        print(f"⚠️  {len(unknown_garbled)} garbled names not in mapping (kept as-is):")
        for n in sorted(unknown_garbled):
            print(f"  - {n}")

    # Write fixed output
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Fixed {fixed_count} NPC name entries")
    print(f"📄 Output: {OUT}")


if __name__ == '__main__':
    main()
