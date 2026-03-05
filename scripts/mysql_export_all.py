"""
MySQL Full Re-Export with Encoding Fix + Complete Game Analysis
1. Re-export with SET NAMES to fix encoding
2. Generate comprehensive analysis MD
"""
import socket, struct, hashlib, json, os, re, time

# ─── MySQL 5.0 Raw Client ───
def scramble_old_password(pw, msg):
    if not pw: return b''
    RND = 0x3FFFFFFF
    def hp(p):
        nr,add,nr2 = 1345345333,7,0x12345671
        for c in p:
            if c in(' ','\t'): continue
            t=ord(c); nr^=((((nr&63)+add)*t)+((nr<<8)&0xFFFFFFFF)); nr&=0xFFFFFFFF
            nr2=(nr2+(((nr2<<8)&0xFFFFFFFF)^nr))&0xFFFFFFFF; add=(add+t)&0xFFFFFFFF
        return(nr&0x7FFFFFFF,nr2&0x7FFFFFFF)
    ms=msg.decode('latin1') if isinstance(msg,bytes) else msg
    h1,h2=hp(pw),hp(ms)
    s1,(s2)=(h1[0]^h2[0])%RND,(h1[1]^h2[1])%RND
    out=[]
    for _ in range(len(ms)):
        s1=(s1*3+s2)%RND; s2=(s1+s2+33)%RND; out.append(int(s1*31/RND+64))
    s1=(s1*3+s2)%RND; s2=(s1+s2+33)%RND; m=int(s1*31/RND)
    return bytes([x^m for x in out])

class MySQL50:
    def __init__(s,h,p,u,pw):
        s.host,s.port,s.user,s.pw=h,p,u,pw; s.sock=None; s.seq=0
    def connect(s):
        s.sock=socket.socket(); s.sock.settimeout(15)
        s.sock.connect((s.host,s.port)); pkt=s._rp(); s._hs(pkt)
    def _hs(s,d):
        p=1; e=d.index(0,p); p=e+1+4; sc1=d[p:p+8]; p+=9
        cl=struct.unpack('<H',d[p:p+2])[0]; p+=2; cs=d[p]; p+=3
        ch=struct.unpack('<H',d[p:p+2])[0] if p+2<=len(d) else 0; p+=2
        caps=cl|(ch<<16); sc2=b''
        if caps&0x8000 and p<len(d):
            p+=11; r=d[p:]; np=r.find(0); sc2=r[:np] if np>0 else r[:12]
        fs=sc1+sc2
        cf=0x0001|0x0004|0x0200|0x8000
        s1=hashlib.sha1(s.pw.encode()).digest()
        s2=hashlib.sha1(s1).digest()
        s3=hashlib.sha1(fs+s2).digest()
        auth=bytes([a^b for a,b in zip(s1,s3)])
        body=struct.pack('<I',cf)+struct.pack('<I',16*1024*1024)+bytes([cs])+b'\x00'*23
        body+=s.user.encode('latin1')+b'\x00'+bytes([len(auth)])+auth
        s._wp(body); r=s._rp()
        if r[0]==0xFE:
            ns=r[1:].rstrip(b'\x00') or sc1
            s._wp(scramble_old_password(s.pw,ns)+b'\x00')
            r2=s._rp()
            if r2[0]!=0: raise Exception('Auth failed')
        elif r[0]==0xFF: raise Exception(s._pe(r))
    def _pe(s,d):
        if d[0]!=0xFF or len(d)<3: return d.hex()
        c=struct.unpack('<H',d[1:3])[0]; m=d[3:].decode('latin1',errors='replace')
        if m.startswith('#') and len(m)>6: m=m[6:]
        return f'#{c}: {m}'
    def _rp(s):
        h=s._rv(4); l=h[0]|(h[1]<<8)|(h[2]<<16); s.seq=h[3]
        return s._rv(l) if l else b''
    def _wp(s,d):
        s.seq+=1; s.sock.sendall(struct.pack('<I',len(d))[:3]+bytes([s.seq])+d)
    def _rv(s,n):
        b=bytearray()
        while len(b)<n:
            c=s.sock.recv(n-len(b))
            if not c: raise ConnectionError('Lost')
            b.extend(c)
        return bytes(b)
    def query_raw(s,sql):
        """Execute query, return raw bytes for each cell"""
        s.seq=-1
        s._wp(b'\x03'+sql.encode('latin1',errors='replace'))
        first=s._rp()
        if not first: return [],[]
        if first[0]==0xFF: raise Exception(s._pe(first))
        if first[0]==0: return [],[]
        fc=first[0] if first[0]<0xFB else 0
        if fc==0: return [],[]
        # Read columns
        cols=[]
        for _ in range(fc):
            cp=s._rp(); p=0; parts=[]
            for _ in range(7):
                if p>=len(cp): break
                bl=cp[p]; p+=1
                if bl<0xFB: parts.append(cp[p:p+bl]); p+=bl
                elif bl==0xFC: ll=struct.unpack('<H',cp[p:p+2])[0]; p+=2; parts.append(cp[p:p+ll]); p+=ll
                else: parts.append(b'')
            cols.append(parts[4].decode('latin1') if len(parts)>4 else f'col{len(cols)}')
        s._rp()  # EOF
        rows=[]
        while True:
            rp=s._rp()
            if rp[0]==0xFE and len(rp)<9: break
            if rp[0]==0xFF: break
            row=[]; p=0
            for _ in range(fc):
                if p>=len(rp): row.append(None); continue
                if rp[p]==0xFB: row.append(None); p+=1
                else:
                    bl=rp[p]; p+=1
                    if bl<0xFB: row.append(rp[p:p+bl]); p+=bl
                    elif bl==0xFC: ll=struct.unpack('<H',rp[p:p+2])[0]; p+=2; row.append(rp[p:p+ll]); p+=ll
                    elif bl==0xFD:
                        ll=rp[p]|(rp[p+1]<<8)|(rp[p+2]<<16); p+=3; row.append(rp[p:p+ll]); p+=ll
                    else: row.append(None)
            rows.append(row)
        return cols, rows
    def close(s):
        try: s.seq=-1; s._wp(b'\x01')
        except: pass
        try: s.sock.close()
        except: pass


def smart_decode(raw_bytes):
    """Intelligently decode bytes trying multiple encoding chains"""
    if raw_bytes is None:
        return None
    if not isinstance(raw_bytes, bytes):
        return str(raw_bytes)
    
    # Check if all ASCII
    if all(b < 128 for b in raw_bytes):
        return raw_bytes.decode('ascii')
    
    # Try direct UTF-8 first
    try:
        result = raw_bytes.decode('utf-8')
        if is_readable(result):
            return result
    except: pass
    
    # Try GBK (Chinese private server)
    try:
        result = raw_bytes.decode('gbk')
        if is_readable(result) and has_cjk(result):
            return result
    except: pass
    
    # Try EUC-KR (original Korean)
    try:
        result = raw_bytes.decode('euc-kr')
        if is_readable(result):
            return result
    except: pass
    
    # Try GBK bytes re-interpreted as UTF-8 (double encoding)
    try:
        result = raw_bytes.decode('gbk')
        re_bytes = result.encode('latin1')
        result2 = re_bytes.decode('utf-8')
        if is_readable(result2):
            return result2
    except: pass
    
    # Fallback: try latin1
    return raw_bytes.decode('latin1', errors='replace')


def is_readable(s):
    """Check if a string looks readable (not mojibake)"""
    if not s:
        return True
    # Count problematic characters
    bad = sum(1 for c in s if 0xFFFD == ord(c) or (0x80 <= ord(c) < 0xA0))
    return bad < len(s) * 0.3


def has_cjk(s):
    """Check if string contains CJK characters"""
    for c in s:
        cp = ord(c)
        if 0x4E00 <= cp <= 0x9FFF: return True  # CJK Unified
        if 0x3400 <= cp <= 0x4DBF: return True  # CJK Ext A
        if 0xAC00 <= cp <= 0xD7AF: return True  # Korean Hangul
    return False


def auto_type(val):
    """Convert string to int/float if possible"""
    if val is None: return None
    if isinstance(val, (int, float)): return val
    s = str(val).strip()
    try: return int(s)
    except: pass
    try:
        f = float(s)
        return int(f) if f == int(f) and '.' not in s else f
    except: pass
    return val


# ─── Export & Analysis ───

TABLES = {
    'S_Data': [
        's_monster','s_mix','s_mob','s_mobitem','s_item','s_ItemEffectiveData',
        's_zone','s_gate','s_npc','s_npc_sale','s_SkillData','s_SkillProperty',
        's_LvMonInfo','s_LvUserInfo','s_hero','s_MixSkill','s_Production',
        's_event_drop','s_ItemRankInfo','s_Itempoweradd','s_ItemBox',
        's_ItemTypeInfo','s_LootRankInfo','s_LootTypeInfo','s_OptInfo',
        's_OptLvInfo','s_PartyExpRate','s_PartyPenaltyRate','s_event',
        's_CastleWarInfo','ZoneServerMessage','s_hero_skill','s_QuestScheduler',
    ],
    'gamedata': ['u_hero','u_hench_1','u_item','u_MixSkill'],
    'Member': ['Player'],
}

def export_all():
    out_dir = os.path.join('scripts', 'gamedb')
    os.makedirs(out_dir, exist_ok=True)
    
    print('Connecting to MySQL 5.0.95...')
    db = MySQL50('192.168.1.80', 3306, 'lrmm', '123456')
    db.connect()
    print('Connected!\n')
    
    all_data = {}
    
    for db_name, tables in TABLES.items():
        print(f'\n--- {db_name} ---')
        try:
            db.query_raw(f'USE `{db_name}`')
        except:
            continue
        
        for tbl in tables:
            try:
                cols, rows = db.query_raw(f'SELECT * FROM `{tbl}`')
                if not cols: continue
                
                records = []
                for row in rows:
                    rec = {}
                    for i, col in enumerate(cols):
                        if i < len(row):
                            val = row[i]
                            if isinstance(val, bytes):
                                decoded = smart_decode(val)
                                rec[col] = auto_type(decoded)
                            else:
                                rec[col] = val
                        else:
                            rec[col] = None
                    records.append(rec)
                
                fpath = os.path.join(out_dir, f'{tbl}.json')
                with open(fpath, 'w', encoding='utf-8') as f:
                    json.dump(records, f, indent=2, ensure_ascii=False, default=str)
                
                all_data[tbl] = records
                sz = os.path.getsize(fpath)
                print(f'  {tbl}: {len(records)} rows ({sz/1024:.1f}KB)')
                
            except Exception as e:
                print(f'  {tbl}: ERROR - {e}')
    
    db.close()
    
    # Update index
    idx = {
        'exported_at': time.strftime('%Y-%m-%d %H:%M:%S'),
        'total_tables': len(all_data),
        'total_rows': sum(len(v) for v in all_data.values()),
        'tables': {k: len(v) for k, v in all_data.items()},
    }
    with open(os.path.join(out_dir, '_index.json'), 'w', encoding='utf-8') as f:
        json.dump(idx, f, indent=2, ensure_ascii=False)
    
    print(f'\nExported {len(all_data)} tables, {idx["total_rows"]} rows total')
    return all_data


def generate_analysis(all_data):
    """Generate comprehensive game data analysis in Markdown"""
    
    lines = []
    L = lines.append
    
    L('# 🎮 猎人MM (Monster Master) — 完整遊戲資料分析')
    L('')
    L(f'> 資料來源: MySQL 5.0.95 @ 192.168.1.80')
    L(f'> 分析時間: {time.strftime("%Y-%m-%d %H:%M:%S")}')
    L(f'> 總計: {sum(len(v) for v in all_data.values())} 筆資料')
    L('')
    L('---')
    L('')
    L('## 📋 目錄')
    L('')
    L('1. [角色職業 (Hero)](#1-角色職業-hero)')
    L('2. [寵物/怪物 (Monster)](#2-寵物怪物-monster)')
    L('3. [融合配方 (Mix)](#3-融合配方-mix)')
    L('4. [融合技能等級 (MixSkill)](#4-融合技能等級-mixskill)')
    L('5. [區域地圖 (Zone)](#5-區域地圖-zone)')
    L('6. [傳送門 (Gate)](#6-傳送門-gate)')
    L('7. [怪物刷新 (Mob Spawn)](#7-怪物刷新-mob-spawn)')
    L('8. [怪物掉落 (Mob Item)](#8-怪物掉落-mob-item)')
    L('9. [道具裝備 (Item)](#9-道具裝備-item)')
    L('10. [道具效果 (Item Effect)](#10-道具效果-item-effect)')
    L('11. [套裝效果 (Set Bonus)](#11-套裝效果-set-bonus)')
    L('12. [技能系統 (Skill)](#12-技能系統-skill)')
    L('13. [NPC](#13-npc)')
    L('14. [製造系統 (Production)](#14-製造系統-production)')
    L('15. [等級成長 (Level Curve)](#15-等級成長-level-curve)')
    L('16. [掉落系統 (Loot)](#16-掉落系統-loot)')
    L('17. [組隊系統 (Party)](#17-組隊系統-party)')
    L('18. [活動系統 (Event)](#18-活動系統-event)')
    L('19. [玩家存檔數據 (Player Save)](#19-玩家存檔數據-player-save)')
    L('')
    L('---')
    
    # 1. Hero Classes
    L('')
    L('## 1. 角色職業 (Hero)')
    L('')
    heroes = all_data.get('s_hero', [])
    if heroes:
        L('| Type | 名稱 | 性別 | 基礎HP | 基礎MP | STR | DEX | AIM | LUCK | AP | DP | 火抗 | 水抗 | 土抗 | 風抗 | 暗抗 |')
        L('|------|------|------|--------|--------|-----|-----|-----|------|----|----|------|------|------|------|------|')
        for h in heroes:
            sex = '♂男' if str(h.get('sex','')) == '0' else '♀女'
            L(f"| {h.get('type','')} | **{h.get('name','')}** | {sex} | {h.get('base_hp','')} | {h.get('base_mp','')} | {h.get('base_str','')} | {h.get('base_dex','')} | {h.get('base_aim','')} | {h.get('base_luck','')} | {h.get('base_ap','')} | {h.get('base_dp','')} | {h.get('res_fire','')} | {h.get('res_water','')} | {h.get('res_earth','')} | {h.get('res_wind','')} | {h.get('res_devil','')} |")
    
    # 2. Monsters/Pets
    L('')
    L('## 2. 寵物/怪物 (Monster)')
    L('')
    monsters = all_data.get('s_monster', [])
    if monsters:
        # Group by race
        races = {}
        for m in monsters:
            r = m.get('race', 0)
            if r not in races:
                races[r] = []
            races[r].append(m)
        
        L(f'**總計: {len(monsters)} 種怪物/寵物, {len(races)} 個種族**')
        L('')
        L('### 種族分佈')
        L('')
        L('| Race ID | 數量 | 等級範圍 |')
        L('|---------|------|----------|')
        for r in sorted(races.keys()):
            ms = races[r]
            levels = [int(m.get('start_base_level', 0) or 0) for m in ms]
            min_lv = min(levels) if levels else 0
            max_lv = max(levels) if levels else 0
            L(f'| {r} | {len(ms)} | Lv{min_lv}-{max_lv} |')
        
        L('')
        L('### 怪物完整列表 (前100)')
        L('')
        L('| Type | 名稱 | Race | 起始Lv | 價格 | Core率 | Stat率 | HP率 | EXP率 | 攻擊距離 | 移速 | 攻速 | 融合限制 |')
        L('|------|------|------|--------|------|--------|--------|------|-------|----------|------|------|----------|')
        for m in monsters[:100]:
            L(f"| {m.get('type','')} | {m.get('name','')} | {m.get('race','')} | {m.get('start_base_level','')} | {m.get('price','')} | {m.get('core_rate','')} | {m.get('stat_rate','')} | {m.get('hp_rate','')} | {m.get('exp_rate','')} | {m.get('attack_range','')} | {m.get('speed_move','')} | {m.get('speed_attack','')} | {m.get('mix_restrict','')} |")
        if len(monsters) > 100:
            L(f'')
            L(f'*... 還有 {len(monsters)-100} 種 (完整資料見 s_monster.json)*')
    
    # 3. Mix/Fusion Recipes
    L('')
    L('## 3. 融合配方 (Mix)')
    L('')
    mixes = all_data.get('s_mix', [])
    if mixes:
        # Group by result
        by_result = {}
        for mx in mixes:
            r = mx.get('result', 0)
            if r not in by_result:
                by_result[r] = []
            by_result[r].append(mx)
        
        L(f'**總計: {len(mixes)} 條配方, 可融合出 {len(by_result)} 種怪物**')
        L('')
        L('| Mode | Main# | Main階 | Sub# | Sub階 | → 結果# |')
        L('|------|-------|--------|------|-------|---------|')
        for mx in mixes[:80]:
            L(f"| {mx.get('mode','')} | {mx.get('mainnum','')} | {mx.get('maingrade','')} | {mx.get('subnum','')} | {mx.get('subgrade','')} | **{mx.get('result','')}** |")
        if len(mixes) > 80:
            L(f'')
            L(f'*... 還有 {len(mixes)-80} 條配方 (完整資料見 s_mix.json)*')
    
    # 4. Mix Skill Levels
    L('')
    L('## 4. 融合技能等級 (MixSkill)')
    L('')
    ms = all_data.get('s_MixSkill', [])
    if ms:
        L('| 等級 | 寵物Lv範圍 | 基礎值 | 起始值 | 大師值 | 獎勵值 | 最大成功率 |')
        L('|------|-----------|--------|--------|--------|--------|-----------|')
        for m in ms:
            L(f"| Lv{m.get('MixSkillLevel','')} | {m.get('StartHenchLevel','')}-{m.get('EndHenchLevel','')} | {m.get('MixSkillBasis','')} | {m.get('MixSkillStart','')} | {m.get('MixSkillMaster','')} | {m.get('MixSkillBonus','')} | {m.get('MixSkillMaxRate','')}% |")
    
    # 5. Zones
    L('')
    L('## 5. 區域地圖 (Zone)')
    L('')
    zones = all_data.get('s_zone', [])
    if zones:
        L(f'**總計: {len(zones)} 個區域**')
        L('')
        L('| IDX | 名稱 | 怪物等級 | 怪物數量 | 每人怪 | 限制 | PK |')
        L('|-----|------|----------|----------|--------|------|-------|')
        for z in zones[:50]:
            pk = '⚔️' if str(z.get('PkZoneFlag','0'))!='0' else '🏠'
            L(f"| {z.get('idx','')} | {z.get('name','')} | Lv{z.get('min_level','')}-{z.get('max_level','')} | {z.get('min_mob','')}-{z.get('max_mob','')} | {z.get('mob_peruser','')} | {z.get('restriction','')} | {pk} |")
        if len(zones) > 50:
            L(f'')
            L(f'*... 還有 {len(zones)-50} 個區域 (完整資料見 s_zone.json)*')
    
    # 6. Gates
    L('')
    L('## 6. 傳送門 (Gate)')
    L('')
    gates = all_data.get('s_gate', [])
    if gates:
        L(f'**總計: {len(gates)} 個傳送門連接**')
        L('')
        L('| 起始區域 | 起始Layer | → 目標區域 | 目標Layer |')
        L('|----------|----------|------------|----------|')
        for g in gates[:40]:
            L(f"| Zone {g.get('from_zone_idx','')} | {g.get('from_zone_attr','')} | → Zone {g.get('dest_zone_idx','')} | {g.get('dest_zone_layer','')} |")
        if len(gates) > 40:
            L(f'')
            L(f'*... 還有 {len(gates)-40} 個 (完整見 s_gate.json)*')
    
    # 7. Mob Spawns
    L('')
    L('## 7. 怪物刷新 (Mob Spawn)')
    L('')
    mobs = all_data.get('s_mob', [])
    if mobs:
        L(f'**總計: {len(mobs)} 條刷新規則**')
        L('')
        L('| IDX | 名稱 | 主動 | Zone0 | Zone1 | 出現率 | 等待 | 間隔 | 怪物Type | 視野 |')
        L('|-----|------|------|-------|-------|--------|------|------|----------|------|')
        for m in mobs[:50]:
            ag = '⚔️主動' if str(m.get('agressive',''))=='1' else '🐑被動'
            L(f"| {m.get('idx','')} | {m.get('name','')} | {ag} | {m.get('zone_idx0','')} | {m.get('zone_idx1','')} | {m.get('appear_rate0','')} | {m.get('wait_time0','')} | {m.get('interval_time0','')} | {m.get('monster_type','')} | {m.get('sight_range','')} |")
        if len(mobs) > 50:
            L(f'')
            L(f'*... 還有 {len(mobs)-50} 條 (完整見 s_mob.json)*')
    
    # 8. Mob Items/Drops
    L('')
    L('## 8. 怪物掉落 (Mob Item)')
    L('')
    mi = all_data.get('s_mobitem', [])
    if mi:
        L(f'**總計: {len(mi)} 條掉落表**')
        L('')
        L('| IDX | 基礎金 | 獎勵金 | 物品0 | 掉率0 | 物品1 | 掉率1 | 物品2 | 掉率2 |')
        L('|-----|--------|--------|-------|-------|-------|-------|-------|-------|')
        for m in mi[:30]:
            L(f"| {m.get('idx','')} | {m.get('base_money','')} | {m.get('bonus_money','')} | {m.get('item_idx0','')} | {m.get('item_drop_percent0','')} | {m.get('item_idx1','')} | {m.get('item_drop_percent1','')} | {m.get('item_idx2','')} | {m.get('item_drop_percent2','')} |")
        if len(mi) > 30:
            L(f'')
            L(f'*... 還有 {len(mi)-30} 條 (完整見 s_mobitem.json)*')
    
    # 9. Items
    L('')
    L('## 9. 道具裝備 (Item)')
    L('')
    items = all_data.get('s_item', [])
    if items:
        # Categorize by type
        by_type = {}
        for it in items:
            t = it.get('type', 0)
            if t not in by_type:
                by_type[t] = []
            by_type[t].append(it)
        
        L(f'**總計: {len(items)} 件道具, {len(by_type)} 種類型**')
        L('')
        L('### 道具類型分佈')
        L('')
        
        # Get type names from s_ItemTypeInfo
        type_info = all_data.get('s_ItemTypeInfo', [])
        type_names = {str(t.get('item_type','')): t.get('type_name','') for t in type_info}
        
        L('| Type | 名稱 | 數量 |')
        L('|------|------|------|')
        for t in sorted(by_type.keys(), key=lambda x: int(x) if str(x).isdigit() else 0):
            name = type_names.get(str(t), f'Type {t}')
            L(f'| {t} | {name} | {len(by_type[t])} |')
        
        L('')
        L('### 道具列表 (前50)')
        L('')
        # Show items that have names and aren't just single letters
        named_items = [it for it in items if it.get('name','') and len(str(it.get('name',''))) > 1]
        L('| IDX | 名稱 | 價格 | 稀有度 | Type | 需求Lv | 裝備Type | Kind | Rank |')
        L('|-----|------|------|--------|------|--------|----------|------|------|')
        for it in named_items[:50]:
            L(f"| {it.get('idx','')} | {it.get('name','')} | {it.get('price','')} | {it.get('rarity','')} | {it.get('type','')} | {it.get('require_level','')} | {it.get('equip_type','')} | {it.get('kind','')} | {it.get('rank','')} |")
        if len(named_items) > 50:
            L(f'')
            L(f'*... 還有 {len(named_items)-50} 件有名稱道具 (完整見 s_item.json)*')
    
    # 10. Item Effects
    L('')
    L('## 10. 道具效果 (Item Effect)')
    L('')
    ie = all_data.get('s_ItemEffectiveData', [])
    if ie:
        # Count effect types
        eff_types = {}
        for e in ie:
            et = e.get('effective_type', '')
            eff_types[et] = eff_types.get(et, 0) + 1
        
        L(f'**總計: {len(ie)} 條效果數據**')
        L('')
        L('### 效果類型分佈')
        L('')
        L('| 效果Type | 數量 |')
        L('|----------|------|')
        for et in sorted(eff_types.keys(), key=lambda x: int(x) if str(x).isdigit() else 0):
            L(f'| {et} | {eff_types[et]} |')
        
        L('')
        L('### 效果數據樣本 (前20)')
        L('')
        L('| 道具IDX | 名稱 | 效果Type | Sub Type | Value |')
        L('|---------|------|----------|----------|-------|')
        for e in ie[:20]:
            L(f"| {e.get('item_idx','')} | {e.get('name','')} | {e.get('effective_type','')} | {e.get('effective_sub_type','')} | {e.get('effective_value','')} |")
    
    # 11. Set Bonuses
    L('')
    L('## 11. 套裝效果 (Set Bonus)')
    L('')
    sb = all_data.get('s_Itempoweradd', [])
    if sb:
        L(f'**總計: {len(sb)} 套套裝**')
        L('')
        L('| IDX | 套裝名 | 頭盔 | 盔甲 | 手套 | 靴子 | 武器1 | 武器2 | 戒指1 | 戒指2 | 項鍊 | 效果 |')
        L('|-----|--------|------|------|------|------|-------|-------|-------|-------|------|------|')
        for s in sb:
            L(f"| {s.get('idx','')} | {s.get('set_name','')} | {s.get('helmet','')} | {s.get('armor','')} | {s.get('glove','')} | {s.get('boots','')} | {s.get('arm1','')} | {s.get('arm2','')} | {s.get('ring1','')} | {s.get('ring2','')} | {s.get('neck','')} | {s.get('effect','')} |")
    
    # 12. Skills
    L('')
    L('## 12. 技能系統 (Skill)')
    L('')
    sp = all_data.get('s_SkillProperty', [])
    if sp:
        L('### 技能屬性')
        L('')
        L('| IDX | 名稱 | 目標 | PK目標 | 範圍類 | 正面 | 效果IDX | 影響Stat | 最高等級 | 升級Type | 學費 |')
        L('|-----|------|------|--------|--------|------|---------|----------|----------|----------|------|')
        for s in sp:
            pos = '✅' if str(s.get('positiveEffect',''))=='1' else '❌'
            L(f"| {s.get('skillIndex','')} | **{s.get('name','')}** | {s.get('targetClass','')} | {s.get('pkTargetClass','')} | {s.get('targetRangeClass','')} | {pos} | {s.get('effectIndex','')} | {s.get('effectingStat','')} | {s.get('maxLevel','')} | {s.get('upgradeType','')} | {s.get('learningGold','')} |")
    
    sd = all_data.get('s_SkillData', [])
    if sd:
        L('')
        L('### 技能數據 (等級詳情)')
        L('')
        L('| 技能IDX | Lv | 消耗MP | 最大距離 | 目標範圍 | 需求SP | 持續時間 | CD |')
        L('|---------|------|--------|----------|----------|--------|----------|------|')
        for s in sd[:30]:
            L(f"| {s.get('skill_index','')} | {s.get('level','')} | {s.get('consumedMp','')} | {s.get('maxTargetDistance','')} | {s.get('targetRange','')} | {s.get('requireSP','')} | {s.get('continuityTime','')} | {s.get('coolTime','')} |")
        if len(sd) > 30:
            L(f'*... 還有 {len(sd)-30} 條 (完整見 s_SkillData.json)*')
    
    # 13. NPC
    L('')
    L('## 13. NPC')
    L('')
    npcs = all_data.get('s_npc', [])
    if npcs:
        # Group by type
        npc_types = {}
        for n in npcs:
            t = n.get('type', 0)
            if t not in npc_types:
                npc_types[t] = []
            npc_types[t].append(n)
        
        L(f'**總計: {len(npcs)} 個NPC, {len(npc_types)} 種類型**')
        L('')
        L('### NPC類型分佈')
        L('')
        L('| Type | 數量 |')
        L('|------|------|')
        for t in sorted(npc_types.keys(), key=lambda x: int(x) if str(x).isdigit() else 0):
            L(f'| {t} | {len(npc_types[t])} |')
        
        L('')
        L('### NPC列表 (前30)')
        L('')
        L('| IDX | 名稱 | Type | 所在區域 | 座標X | 座標Y | 販賣Type | 販賣比率 |')
        L('|-----|------|------|----------|-------|-------|----------|----------|')
        for n in npcs[:30]:
            L(f"| {n.get('idx','')} | {n.get('name','')} | {n.get('type','')} | Zone {n.get('birth_zone_idx','')} | {n.get('birth_zone_x','')} | {n.get('birth_zone_y','')} | {n.get('sell_type','')} | {n.get('sell_ratio','')} |")
    
    # 14. Production/Crafting
    L('')
    L('## 14. 製造系統 (Production)')
    L('')
    prod = all_data.get('s_Production', [])
    if prod:
        L(f'**總計: {len(prod)} 個配方**')
        L('')
        L('| IDX | 圖紙名 | → 產物 | 數量 | 費用 | 成功率 | 材料1 | 數量 | 材料2 | 數量 |')
        L('|-----|--------|--------|------|------|--------|-------|------|-------|------|')
        for p in prod[:40]:
            L(f"| {p.get('idx','')} | {p.get('doc_name','')} | **{p.get('result_name','')}** | {p.get('result_count','')} | {p.get('money','')} | {p.get('default_pro','')} | {p.get('stuff_name1','')} | {p.get('stuff_count1','')} | {p.get('stuff_name2','')} | {p.get('stuff_count2','')} |")
        if len(prod) > 40:
            L(f'')
            L(f'*... 還有 {len(prod)-40} 條 (完整見 s_Production.json)*')
    
    # 15. Level Curves
    L('')
    L('## 15. 等級成長 (Level Curve)')
    L('')
    lvu = all_data.get('s_LvUserInfo', [])
    if lvu:
        L('### 玩家升級經驗表')
        L('')
        L('| Lv | 升級經驗 | | Lv | 升級經驗 | | Lv | 升級經驗 |')
        L('|----|---------|-|----|---------|-|----|---------| ')
        # Display in 3 columns
        third = (len(lvu) + 2) // 3
        for i in range(third):
            parts = []
            for col in range(3):
                idx = i + col * third
                if idx < len(lvu):
                    lv = lvu[idx]
                    parts.append(f"| {lv.get('Lv','')} | {lv.get('LvUpExp','')} ")
                else:
                    parts.append('| | ')
            L('|'.join(parts) + '|')
    
    L('')
    lvm = all_data.get('s_LvMonInfo', [])
    if lvm:
        L('### 怪物等級成長曲線')
        L('')
        L('| Lv | HP | MP | STR | DEX | AIM | Luck | ATT | AP | DP | HitCnt | HitDice | GiveExp | MixRate |')
        L('|----|----|----|-----|-----|-----|------|-----|----|----|--------|---------|---------|---------|')
        for m in lvm[:30]:
            L(f"| {m.get('Lv','')} | {m.get('HP','')} | {m.get('MP','')} | {m.get('STR','')} | {m.get('DEX','')} | {m.get('AIM','')} | {m.get('Luck','')} | {m.get('ATT','')} | {m.get('AP','')} | {m.get('DP','')} | {m.get('HitCnt','')} | {m.get('HitDice','')} | {m.get('GiveExp','')} | {m.get('MixRate','')} |")
        if len(lvm) > 30:
            L(f'*... 到 Lv{lvm[-1].get("Lv","")} (完整見 s_LvMonInfo.json)*')
    
    # 16. Loot System
    L('')
    L('## 16. 掉落系統 (Loot)')
    L('')
    lt = all_data.get('s_LootTypeInfo', [])
    if lt:
        L('### 掉落類型')
        L('')
        L('| Loot Type | 特殊掉率 | 普通掉率 | 選項率1 | 選項率2 |')
        L('|-----------|----------|----------|---------|---------|')
        for l in lt:
            L(f"| {l.get('loot_type','')} | {l.get('sp_loot_rate','')} | {l.get('loot_rate','')} | {l.get('opt_rate1','')} | {l.get('opt_rate2','')} |")
    
    ir = all_data.get('s_ItemRankInfo', [])
    if ir:
        L('')
        L('### 道具強化等級')
        L('')
        L('| Rank | 損壞率 | 升級率 | 升降率 | 升壞率 | G Rank率 | G Opt率 |')
        L('|------|--------|--------|--------|--------|----------|---------|')
        for r in ir:
            L(f"| {r.get('rank','')} | {r.get('ect_broken_rate','')} | {r.get('ect_up_rate','')} | {r.get('ect_up_down_rate','')} | {r.get('ect_up_broken_rate','')} | {r.get('g_rank_rate','')} | {r.get('g_opt_rate','')} |")
    
    # 17. Party
    L('')
    L('## 17. 組隊系統 (Party)')
    L('')
    pe = all_data.get('s_PartyExpRate', [])
    if pe:
        L('### 組隊經驗加成')
        L('')
        L('| 人數 | 經驗加成 |')
        L('|------|----------|')
        for p in pe:
            L(f"| {p.get('member_count','')} | +{p.get('exp_add_rate','')}% |")
    
    pp = all_data.get('s_PartyPenaltyRate', [])
    if pp:
        L('')
        L('### 組隊等級懲罰')
        L('')
        L('| 等級差 | 懲罰率 |')
        L('|--------|--------|')
        for p in pp:
            L(f"| {p.get('level_diff','')} | {p.get('penalty_rate','')}% |")
    
    # 18. Events
    L('')
    L('## 18. 活動系統 (Event)')
    L('')
    ev = all_data.get('s_event', [])
    if ev:
        for e in ev:
            L(f"- **Core率倍率**: {e.get('CoreRate','')}")
            L(f"- **經驗倍率**: {e.get('ExpRate','')}")
            L(f"- **掉落倍率**: {e.get('ItemRate','')}")
            L(f"- **GP倍率**: {e.get('GpRate','')}")
    
    ed = all_data.get('s_event_drop', [])
    if ed:
        L('')
        L(f'### 活動掉落 ({len(ed)} 條)')
        L('')
        L('| IDX | 書名 | 物品1 | 機率1 | 物品2 | 機率2 | 物品3 | 機率3 |')
        L('|-----|------|-------|-------|-------|-------|-------|-------|')
        for e in ed[:20]:
            L(f"| {e.get('idx','')} | {e.get('book_name','')} | {e.get('item_01','')} | {e.get('item_01_per','')} | {e.get('item_02','')} | {e.get('item_02_per','')} | {e.get('item_03','')} | {e.get('item_03_per','')} |")
    
    # 19. Player Save Data
    L('')
    L('## 19. 玩家存檔數據 (Player Save)')
    L('')
    uh = all_data.get('u_hench_1', [])
    if uh:
        L('### 已存寵物 (u_hench_1)')
        L('')
        L('| Monster Type | 名稱 | 性別 | Lv | EXP | STR | DEX | AIM | LUCK | HP | MP | 成長型 | 融合次數 |')
        L('|-------------|------|------|------|-----|-----|-----|-----|------|----|----|--------|----------|')
        for h in uh:
            sex = '♂' if str(h.get('sex',''))=='0' else '♀'
            L(f"| {h.get('monster_type','')} | {h.get('name','')} | {sex} | {h.get('baselevel','')} | {h.get('exp','')} | {h.get('str','')} | {h.get('dex','')} | {h.get('aim','')} | {h.get('luck','')} | {h.get('hp','')} | {h.get('mp','')} | {h.get('growthtype','')} | {h.get('mixnum','')} |")
    
    ui = all_data.get('u_item', [])
    if ui:
        L('')
        L(f'### 已存道具 ({len(ui)} 件)')
        L('')
        L('| Item IDX | 槽位 | 數量 | Opt | Opt Lv | 耐久 |')
        L('|----------|------|------|-----|--------|------|')
        for it in ui:
            L(f"| {it.get('item_idx','')} | {it.get('socket_num','')} | {it.get('count','')} | {it.get('opt','')} | {it.get('opt_level','')} | {it.get('duration','')} |")
    
    L('')
    L('---')
    L('')
    L('> 📁 完整 JSON 數據位於 `scripts/gamedb/` 目錄')
    L('> 🔄 此報告由 `scripts/mysql_export_all.py` 自動生成')
    
    # Write
    report_path = os.path.join('scripts', 'GAME_DATA_ANALYSIS.md')
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    print(f'\nAnalysis report: {report_path} ({len(lines)} lines)')
    return report_path


def main():
    # Step 1: Re-export with proper encoding
    all_data = export_all()
    
    # Step 2: Generate analysis
    generate_analysis(all_data)
    
    print('\nAll done!')


if __name__ == '__main__':
    main()
