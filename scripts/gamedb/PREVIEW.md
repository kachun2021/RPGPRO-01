
============================================================
s_monster (1418 rows)
============================================================
  [0] type=1 | name=텟텟질 | race=0 | start_base_level=1 | price=100 | core_rate=1200000 | stat_rate=1 | hp_rate=1.1 | exp_rate=1 | attack_range=2 | speed_move=3 | speed_attack=1700 | mix_restrict=0
  [1] type=2 | name=붚헷헷 | race=1 | start_base_level=1 | price=100 | core_rate=1200000 | stat_rate=1 | hp_rate=1.1 | exp_rate=1 | attack_range=2 | speed_move=3 | speed_attack=1700 | mix_restrict=0
  [2] type=3 | name=챔棺헷 | race=2 | start_base_level=1 | price=100 | core_rate=1200000 | stat_rate=1 | hp_rate=1.1 | exp_rate=1 | attack_range=2 | speed_move=3 | speed_attack=1700 | mix_restrict=0
  [3] type=4 | name=莖賈헷 | race=3 | start_base_level=1 | price=100 | core_rate=1200000 | stat_rate=1 | hp_rate=1.1 | exp_rate=1 | attack_range=2 | speed_move=3 | speed_attack=1700 | mix_restrict=0
  [4] type=5 | name=旿伍헷 | race=4 | start_base_level=1 | price=100 | core_rate=1200000 | stat_rate=1 | hp_rate=1.1 | exp_rate=1 | attack_range=2 | speed_move=3 | speed_attack=1700 | mix_restrict=0

============================================================
s_mix (720 rows)
============================================================
  [0] mode=2 | mainnum=25 | maingrade=0 | subnum=121 | subgrade=0 | result=29
  [1] mode=2 | mainnum=194 | maingrade=0 | subnum=213 | subgrade=0 | result=29
  [2] mode=2 | mainnum=194 | maingrade=0 | subnum=257 | subgrade=0 | result=29
  [3] mode=2 | mainnum=194 | maingrade=0 | subnum=226 | subgrade=0 | result=29
  [4] mode=2 | mainnum=194 | maingrade=0 | subnum=216 | subgrade=0 | result=29
  [5] mode=2 | mainnum=213 | maingrade=0 | subnum=129 | subgrade=0 | result=29
  [6] mode=2 | mainnum=213 | maingrade=0 | subnum=248 | subgrade=0 | result=29
  [7] mode=2 | mainnum=29 | maingrade=0 | subnum=208 | subgrade=0 | result=33

============================================================
s_zone (201 rows)
============================================================
  [0] idx=1 | name=娴佹皳鍏旂殑鍦扮洏 | min_level=1 | max_level=60 | min_mob=80 | max_mob=140 | mob_peruser=2 | restriction=4 | PkZoneFlag=0
  [1] idx=2 | name=黑尔斯波入口 | min_level=1 | max_level=1000 | min_mob=400 | max_mob=600 | mob_peruser=2 | restriction=0 | PkZoneFlag=0
  [2] idx=3 | name=马吉利塔北部 | min_level=1 | max_level=1000 | min_mob=400 | max_mob=600 | mob_peruser=2 | restriction=0 | PkZoneFlag=0
  [3] idx=4 | name=娴佹皳鍏旂殑鍦扮洏 | min_level=1 | max_level=80 | min_mob=80 | max_mob=140 | mob_peruser=2 | restriction=4 | PkZoneFlag=0
  [4] idx=5 | name=娴佹皳鍏旂殑鍦扮洏 | min_level=1 | max_level=100 | min_mob=80 | max_mob=140 | mob_peruser=2 | restriction=4 | PkZoneFlag=0

============================================================
s_mob (889 rows)
============================================================
  [0] idx=147 | name=加뎌둑景 | agressive=1 | zone_idx0=1 | zone_idx1=0 | appear_rate0=30 | wait_time0=0 | interval_time0=10 | monster_type=1142 | sight_range=5
  [1] idx=148 | name=加뎌숌 | agressive=1 | zone_idx0=1 | zone_idx1=0 | appear_rate0=30 | wait_time0=0 | interval_time0=10 | monster_type=1143 | sight_range=5
  [2] idx=149 | name=加뎌롬적 | agressive=1 | zone_idx0=1 | zone_idx1=0 | appear_rate0=30 | wait_time0=0 | interval_time0=10 | monster_type=1144 | sight_range=5
  [3] idx=157 | name=加뎌꺼弩 | agressive=1 | zone_idx0=1 | zone_idx1=0 | appear_rate0=30 | wait_time0=0 | interval_time0=10 | monster_type=1145 | sight_range=5
  [4] idx=83 | name=븐癩융쑬 | agressive=0 | zone_idx0=2 | zone_idx1=0 | appear_rate0=45 | wait_time0=0 | interval_time0=10 | monster_type=214 | sight_range=5

============================================================
s_hero (4 rows)
============================================================
  [0] type=0 | name=迪特 | sex=0 | base_str=4 | base_dex=4 | base_aim=4 | base_luck=4 | base_hp=100 | base_mp=120 | base_ap=3 | base_dp=3
  [1] type=1 | name=简 | sex=0 | base_str=4 | base_dex=4 | base_aim=4 | base_luck=4 | base_hp=100 | base_mp=120 | base_ap=3 | base_dp=3
  [2] type=2 | name=芬利 | sex=1 | base_str=4 | base_dex=4 | base_aim=4 | base_luck=4 | base_hp=100 | base_mp=120 | base_ap=3 | base_dp=3
  [3] type=3 | name=波伊 | sex=1 | base_str=4 | base_dex=4 | base_aim=4 | base_luck=4 | base_hp=100 | base_mp=120 | base_ap=3 | base_dp=3

============================================================
s_gate (140 rows)
============================================================
  [0] from_zone_idx=2 | from_zone_attr=101 | dest_zone_idx=63 | dest_zone_layer=104
  [1] from_zone_idx=2 | from_zone_attr=102 | dest_zone_idx=52 | dest_zone_layer=103
  [2] from_zone_idx=2 | from_zone_attr=103 | dest_zone_idx=6 | dest_zone_layer=102
  [3] from_zone_idx=3 | from_zone_attr=101 | dest_zone_idx=17 | dest_zone_layer=102
  [4] from_zone_idx=3 | from_zone_attr=102 | dest_zone_idx=6 | dest_zone_layer=103

============================================================
s_LvUserInfo (200 rows)
============================================================
  [0] Lv=1 | LvUpExp=14
  [1] Lv=2 | LvUpExp=54
  [2] Lv=3 | LvUpExp=139
  [3] Lv=4 | LvUpExp=290
  [4] Lv=5 | LvUpExp=530
  [5] Lv=6 | LvUpExp=889
  [6] Lv=7 | LvUpExp=1400
  [7] Lv=8 | LvUpExp=2100
  [8] Lv=9 | LvUpExp=3028
  [9] Lv=10 | LvUpExp=4402

============================================================
s_LvMonInfo (210 rows)
============================================================
  [0] Lv=1 | HP=15 | MP=10 | STR=2 | DEX=1 | AIM=3 | Luck=2 | ATT=3 | AP=1 | DP=1 | HitCnt=1 | HitDice=1 | GiveExp=26 | MixRate=10000
  [1] Lv=2 | HP=16 | MP=11 | STR=3 | DEX=1 | AIM=5 | Luck=3 | ATT=3 | AP=1 | DP=1 | HitCnt=1 | HitDice=1 | GiveExp=32 | MixRate=9800
  [2] Lv=3 | HP=16 | MP=12 | STR=4 | DEX=2 | AIM=6 | Luck=4 | ATT=3 | AP=1 | DP=1 | HitCnt=2 | HitDice=2 | GiveExp=40 | MixRate=9600
  [3] Lv=4 | HP=17 | MP=13 | STR=5 | DEX=2 | AIM=8 | Luck=5 | ATT=3 | AP=1 | DP=1 | HitCnt=2 | HitDice=2 | GiveExp=50 | MixRate=9200
  [4] Lv=5 | HP=18 | MP=14 | STR=6 | DEX=3 | AIM=7 | Luck=6 | ATT=3 | AP=1 | DP=1 | HitCnt=2 | HitDice=2 | GiveExp=62 | MixRate=8900

============================================================
s_SkillProperty (31 rows)
============================================================
  [0] skillIndex=1 | name=回避术 | targetClass=t1110000 | pkTargetClass=t1110000 | targetRangeClass=0 | positiveEffect=1 | effectIndex=1 | effectingStat=0 | maxLevel=7 | upgradeType=2 | rquireUpdateType=0 | learningGold=3000 | learningSP=0
  [1] skillIndex=2 | name=强击术 | targetClass=t1110000 | pkTargetClass=t1110000 | targetRangeClass=0 | positiveEffect=1 | effectIndex=2 | effectingStat=0 | maxLevel=7 | upgradeType=2 | rquireUpdateType=0 | learningGold=5000 | learningSP=0
  [2] skillIndex=3 | name=反击术 | targetClass=t1110000 | pkTargetClass=t1111110 | targetRangeClass=0 | positiveEffect=1 | effectIndex=3 | effectingStat=0 | maxLevel=5 | upgradeType=2 | rquireUpdateType=0 | learningGold=4000 | learningSP=0
  [3] skillIndex=4 | name=昏迷术 | targetClass=t0000001 | pkTargetClass=t0001111 | targetRangeClass=0 | positiveEffect=0 | effectIndex=4 | effectingStat=0 | maxLevel=6 | upgradeType=4 | rquireUpdateType=0 | learningGold=30000 | learningSP=0
  [4] skillIndex=5 | name=抢夺术 | targetClass=t0000001 | pkTargetClass=t0001111 | targetRangeClass=0 | positiveEffect=0 | effectIndex=0 | effectingStat=10 | maxLevel=7 | upgradeType=2 | rquireUpdateType=0 | learningGold=10000 | learningSP=0
  [5] skillIndex=6 | name=治愈术 | targetClass=t1111110 | pkTargetClass=t1111110 | targetRangeClass=0 | positiveEffect=1 | effectIndex=0 | effectingStat=10 | maxLevel=5 | upgradeType=6 | rquireUpdateType=0 | learningGold=6000 | learningSP=0
  [6] skillIndex=7 | name=遮蔽术 | targetClass=t1111110 | pkTargetClass=t1111110 | targetRangeClass=0 | positiveEffect=1 | effectIndex=5 | effectingStat=0 | maxLevel=5 | upgradeType=2 | rquireUpdateType=0 | learningGold=4000 | learningSP=0
  [7] skillIndex=8 | name=火球术 | targetClass=t0000001 | pkTargetClass=t0001111 | targetRangeClass=0 | positiveEffect=0 | effectIndex=0 | effectingStat=10 | maxLevel=5 | upgradeType=8 | rquireUpdateType=0 | learningGold=6000 | learningSP=0
  [8] skillIndex=9 | name=虚弱术 | targetClass=t0000001 | pkTargetClass=t0001111 | targetRangeClass=0 | positiveEffect=0 | effectIndex=6 | effectingStat=10 | maxLevel=5 | upgradeType=3 | rquireUpdateType=2 | learningGold=70000 | learningSP=0
  [9] skillIndex=10 | name=束缚术 | targetClass=t0000001 | pkTargetClass=t0001111 | targetRangeClass=0 | positiveEffect=0 | effectIndex=7 | effectingStat=10 | maxLevel=5 | upgradeType=3 | rquireUpdateType=2 | learningGold=70000 | learningSP=0

============================================================
s_MixSkill (10 rows)
============================================================
  [0] MixSkillLevel=1 | StartHenchLevel=1 | EndHenchLevel=20 | MixSkillBasis=50 | MixSkillStart=20 | MixSkillMaster=30 | MixSkillBonus=0 | MixSkillMaxRate=90
  [1] MixSkillLevel=2 | StartHenchLevel=21 | EndHenchLevel=40 | MixSkillBasis=100 | MixSkillStart=30 | MixSkillMaster=55 | MixSkillBonus=25 | MixSkillMaxRate=80
  [2] MixSkillLevel=3 | StartHenchLevel=41 | EndHenchLevel=60 | MixSkillBasis=200 | MixSkillStart=48 | MixSkillMaster=60 | MixSkillBonus=50 | MixSkillMaxRate=70
  [3] MixSkillLevel=4 | StartHenchLevel=61 | EndHenchLevel=80 | MixSkillBasis=300 | MixSkillStart=45 | MixSkillMaster=75 | MixSkillBonus=80 | MixSkillMaxRate=60
  [4] MixSkillLevel=5 | StartHenchLevel=81 | EndHenchLevel=100 | MixSkillBasis=800 | MixSkillStart=80 | MixSkillMaster=88 | MixSkillBonus=200 | MixSkillMaxRate=45
  [5] MixSkillLevel=6 | StartHenchLevel=101 | EndHenchLevel=120 | MixSkillBasis=1000 | MixSkillStart=70 | MixSkillMaster=105 | MixSkillBonus=250 | MixSkillMaxRate=30
  [6] MixSkillLevel=7 | StartHenchLevel=121 | EndHenchLevel=140 | MixSkillBasis=1200 | MixSkillStart=36 | MixSkillMaster=78 | MixSkillBonus=300 | MixSkillMaxRate=17
  [7] MixSkillLevel=8 | StartHenchLevel=141 | EndHenchLevel=160 | MixSkillBasis=1400 | MixSkillStart=34 | MixSkillMaster=82 | MixSkillBonus=330 | MixSkillMaxRate=11
  [8] MixSkillLevel=9 | StartHenchLevel=161 | EndHenchLevel=180 | MixSkillBasis=1600 | MixSkillStart=26 | MixSkillMaster=86 | MixSkillBonus=360 | MixSkillMaxRate=10
  [9] MixSkillLevel=10 | StartHenchLevel=181 | EndHenchLevel=200 | MixSkillBasis=1800 | MixSkillStart=30 | MixSkillMaster=82 | MixSkillBonus=380 | MixSkillMaxRate=9

============================================================
s_item (4608 rows)
============================================================
  [0] idx=1 | name=B | price=0 | rarity=0 | type=0 | require_level=0 | equip_type=0 | kind=0 | rank=0
  [1] idx=2 | name=C | price=0 | rarity=0 | type=0 | require_level=0 | equip_type=0 | kind=0 | rank=0
  [2] idx=3 | name=F | price=0 | rarity=0 | type=0 | require_level=0 | equip_type=0 | kind=0 | rank=0
  [3] idx=4 | name=G | price=0 | rarity=0 | type=0 | require_level=0 | equip_type=0 | kind=0 | rank=0
  [4] idx=5 | name=H | price=0 | rarity=0 | type=0 | require_level=0 | equip_type=0 | kind=0 | rank=0

============================================================
s_mobitem (634 rows)
============================================================
  [0] idx=1 | base_money=0 | bonus_money=0 | item_idx0=9999 | item_drop_percent0=45000 | item_idx1=9999 | item_drop_percent1=5000
  [1] idx=2 | base_money=0 | bonus_money=0 | item_idx0=9999 | item_drop_percent0=45000 | item_idx1=9999 | item_drop_percent1=3000
  [2] idx=3 | base_money=0 | bonus_money=0 | item_idx0=9999 | item_drop_percent0=45000 | item_idx1=0 | item_drop_percent1=0
  [3] idx=4 | base_money=0 | bonus_money=0 | item_idx0=9999 | item_drop_percent0=45000 | item_idx1=0 | item_drop_percent1=0
  [4] idx=5 | base_money=0 | bonus_money=0 | item_idx0=9999 | item_drop_percent0=45000 | item_idx1=9999 | item_drop_percent1=3000

============================================================
u_hench_1 (6 rows)
============================================================
  [0] id_idx=1 | hero_order=0 | monster_type=278 | name=汨튄헷 | sex=0 | baselevel=35 | exp=1184451 | str=51 | dex=24 | aim=82 | luck=55 | ap=0 | dp=0 | hp=480 | mp=65 | maxhp=0 | maxmp=0 | growthtype=5 | mixnum=0
  [1] id_idx=1 | hero_order=0 | monster_type=327 | name=薑롬옹鋼 | sex=0 | baselevel=38 | exp=1772989 | str=61 | dex=31 | aim=93 | luck=101 | ap=0 | dp=0 | hp=650 | mp=111 | maxhp=0 | maxmp=0 | growthtype=4 | mixnum=0
  [2] id_idx=1 | hero_order=0 | monster_type=341 | name=긴嫩댕癩 | sex=0 | baselevel=38 | exp=1772989 | str=62 | dex=33 | aim=91 | luck=62 | ap=0 | dp=0 | hp=599 | mp=72 | maxhp=0 | maxmp=0 | growthtype=5 | mixnum=0
  [3] id_idx=1 | hero_order=0 | monster_type=208 | name=긴嫩곡둑 | sex=0 | baselevel=16 | exp=23569 | str=39 | dex=12 | aim=36 | luck=25 | ap=0 | dp=0 | hp=145 | mp=35 | maxhp=0 | maxmp=0 | growthtype=1 | mixnum=0
  [4] id_idx=1 | hero_order=0 | monster_type=208 | name=긴嫩곡둑 | sex=0 | baselevel=16 | exp=23569 | str=28 | dex=13 | aim=58 | luck=26 | ap=0 | dp=0 | hp=160 | mp=36 | maxhp=0 | maxmp=0 | growthtype=3 | mixnum=0
  [5] id_idx=1 | hero_order=0 | monster_type=208 | name=긴嫩곡둑 | sex=1 | baselevel=16 | exp=23569 | str=23 | dex=27 | aim=37 | luck=25 | ap=0 | dp=0 | hp=127 | mp=35 | maxhp=0 | maxmp=0 | growthtype=2 | mixnum=0

============================================================
s_Production (167 rows)
============================================================
  [0] idx=1 | doc_name=[妯℃澘]閾佸墤 | result_name=閾佸墤 | result_count=1 | money=780 | default_pro=40000 | stuff_name1=红宝石 | stuff_count1=1
  [1] idx=2 | doc_name=[模板]金属剑 | result_name=金属剑 | result_count=1 | money=1120 | default_pro=35000 | stuff_name1=重金属 | stuff_count1=4
  [2] idx=3 | doc_name=[模板]铁拳套 | result_name=铁拳套 | result_count=1 | money=780 | default_pro=40000 | stuff_name1=红宝石 | stuff_count1=1
  [3] idx=4 | doc_name=[模板]帕荅拳套 | result_name=帕荅拳套 | result_count=1 | money=1120 | default_pro=35000 | stuff_name1=甯曡崊鐨勭毊 | stuff_count1=10
  [4] idx=5 | doc_name=[妯℃澘]閾佸紦 | result_name=閾佸紦 | result_count=1 | money=780 | default_pro=40000 | stuff_name1=铁矿石 | stuff_count1=18