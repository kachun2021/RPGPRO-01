# MySQL Database Schema Analysis
**Total Databases: 5**

**Total Tables: 91 | Total Rows: 20535**


## Database: `LogDB` (0 tables)

*(empty database)*

## Database: `Member` (5 tables)

### `ChangePassword` (1 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | AdminID | varchar(12) | NO | PRI |
| 2 | id_idx | int(11) | YES |  |
| 3 | PlayerID | varchar(12) | NO | PRI |
| 4 | Passwd | varchar(30) | NO |  |
| 5 | RegDate | datetime | NO |  |

### `Distraint` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | Num | int(10) unsigned | NO | PRI |
| 2 | id_idx | int(10) unsigned | NO | MUL |
| 3 | PlayerID | varchar(12) | NO | MUL |
| 4 | CPPlayerID | varchar(20) | NO |  |
| 5 | CPCode | tinyint(3) unsigned | NO |  |
| 6 | AdminID | varchar(20) | NO |  |
| 7 | BlockType | enum('WEB','GAME','SUM') | NO |  |
| 8 | Access | enum('ALLOW','DENY') | NO |  |
| 9 | CharName | varchar(20) | YES |  |
| 10 | ServerName | varchar(50) | YES |  |
| 11 | Subject | varchar(255) | NO |  |
| 12 | Content | text | NO |  |
| 13 | StartDate | datetime | NO |  |
| 14 | EndDate | datetime | NO |  |
| 15 | RegDate | datetime | NO |  |
| 16 | B_Flag | enum('Y','N') | NO |  |
| 17 | BlockTypeNum | int(11) | YES |  |

### `Management` (1 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | Num | int(10) unsigned | NO | PRI |
| 2 | AdminID | varchar(20) | NO |  |
| 3 | Passwd | varchar(30) | NO |  |
| 4 | Name | varchar(30) | NO |  |
| 5 | Team | varchar(30) | NO |  |
| 6 | Jigham | varchar(30) | NO |  |
| 7 | Email | varchar(30) | NO |  |
| 8 | ZipCode | varchar(7) | NO |  |
| 9 | Address | varchar(255) | NO |  |
| 10 | Tphone | varchar(20) | NO |  |
| 11 | Cphone | varchar(20) | NO |  |
| 12 | StartDate | date | NO |  |
| 13 | EndDate | date | NO |  |
| 14 | Access | tinyint(4) | NO |  |
| 15 | Flag | enum('Y','N') | NO |  |
| 16 | nCount | int(10) unsigned | NO |  |
| 17 | LoginIP | varchar(15) | YES |  |
| 18 | LastLoginDate | datetime | YES |  |
| 19 | RegDate | datetime | NO |  |

### `Player` (3 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | PRI |
| 2 | PlayerID | varchar(20) | NO | UNI |
| 3 | Passwd | varchar(30) | NO |  |
| 4 | Passwd_Q | char(2) | YES |  |
| 5 | Passwd_A | varchar(64) | YES |  |
| 6 | Name | varchar(20) | NO | MUL |
| 7 | JuminNo | varchar(20) | NO | MUL |
| 8 | nYear | varchar(4) | NO |  |
| 9 | nMonth | char(2) | NO |  |
| 10 | nDay | char(2) | YES |  |
| 11 | Sex | enum('1','2') | NO |  |
| 12 | TelePhone1 | varchar(13) | YES |  |
| 13 | TelePhone2 | varchar(4) | NO |  |
| 14 | TelePhone3 | varchar(4) | NO |  |
| 15 | CPhone1 | varchar(13) | YES |  |
| 16 | CPhone2 | varchar(4) | NO |  |
| 17 | CPhone3 | varchar(4) | NO |  |
| 18 | ZipCode | varchar(10) | NO |  |
| 19 | AddressDo | varchar(20) | YES |  |
| 20 | AddressSi | varchar(30) | YES |  |
| 21 | AddressDong | varchar(50) | YES |  |
| 22 | AddressEtc | varchar(100) | YES |  |
| 23 | Address | varchar(255) | YES |  |
| 24 | Email | varchar(30) | YES |  |
| 25 | JobType | char(2) | YES |  |
| 26 | SchoolName | varchar(100) | YES | MUL |
| 27 | Access | tinyint(4) unsigned | NO |  |
| 28 | Block | enum('ALLOW','GAME','WEB','SUM','SECEDER','WAIT') | YES |  |
| 29 | LoginIP | varchar(15) | YES |  |
| 30 | NewsLetter | enum('0','1') | YES |  |
| 31 | ParentName | varchar(20) | YES |  |
| 32 | ParentJuminNo | varchar(20) | YES |  |
| 33 | ParentPhone1 | varchar(13) | YES |  |
| 34 | ParentPhone2 | varchar(4) | NO |  |
| 35 | ParentPhone3 | varchar(4) | NO |  |
| 36 | LastLoginDate | datetime | YES |  |
| 37 | SecederDate | datetime | YES |  |
| 38 | PayPlayDate | datetime | YES |  |
| 39 | PayPlayHours | int(11) unsigned | YES |  |
| 40 | RegDate | datetime | NO | PRI |
| 41 | OldBlock | enum('ALLOW','GAME','WEB','SUM','SECEDER','WAIT') | NO |  |
| 42 | ssoChk | char(1) | YES |  |
| 43 | AuthCheck | enum('AUTH_OK','AUTH_WAIT','AUTH_CHECK') | NO |  |
| 44 | AuthTimeLimit | datetime | NO |  |
| 45 | LoginState | tinyint(1) unsigned | NO |  |
| 46 | personal_auth | char(1) | YES |  |
| 47 | Accesschecktype | int(11) | YES |  |
| 48 | PlayerNickName | varchar(30) | YES |  |
| 49 | PlayerGameServer | varchar(15) | YES |  |

### `player_wait` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | PlayerID | varchar(12) | NO | PRI |
| 2 | id_idx | int(10) | NO |  |
| 3 | Block | enum('ALLOW','GAME','WEB','SUM','SECEDER','WAIT') | NO |  |
| 4 | SecederDate | datetime | NO |  |
| 5 | HandlingDate | datetime | NO |  |
| 6 | OldBlock | enum('ALLOW','GAME','WEB','SUM','SECEDER','WAIT') | NO |  |


## Database: `S_Data` (34 tables)

### `ZoneServerMessage` (2 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | MsgIndex | int(10) unsigned | NO | PRI |
| 2 | MsgType | enum('MESSAGE','WORLD OFF') | NO |  |
| 3 | GmsNumber | smallint(5) unsigned | NO |  |
| 4 | Message | varchar(255) | NO |  |
| 5 | State | enum('READY','END') | NO |  |

### `s_CastleWarInfo` (2 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | zone_idx | smallint(5) unsigned | NO |  |
| 2 | open_wday | tinyint(3) unsigned | NO |  |
| 3 | open_hour | tinyint(2) unsigned | NO |  |
| 4 | open_min | tinyint(2) unsigned | NO |  |
| 5 | close_hour | tinyint(2) unsigned | NO |  |
| 6 | close_min | tinyint(2) unsigned | NO |  |
| 7 | npc_idx | smallint(5) unsigned | NO |  |
| 8 | attacker_arrival_layer | smallint(5) unsigned | NO |  |
| 9 | defenser_arrival_layer | smallint(5) unsigned | NO |  |
| 10 | symbol_hench_idx | smallint(5) unsigned | NO |  |
| 11 | symbol_item_idx | smallint(5) unsigned | NO |  |

### `s_ItemBox` (22 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | idx | varchar(255) | YES |  |
| 2 | add_idx | varchar(255) | YES |  |
| 3 | rate | varchar(255) | YES |  |
| 4 | count | varchar(255) | YES |  |
| 5 | shuoming | varchar(255) | YES |  |

### `s_ItemEffectiveData` (7980 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | item_idx | varchar(255) | YES |  |
| 2 | name | varchar(255) | YES |  |
| 3 | effective_type | varchar(255) | YES |  |
| 4 | effective_sub_type | varchar(255) | YES |  |
| 5 | effective_value | varchar(255) | YES |  |
| 6 | shuoming | varchar(255) | YES |  |

### `s_ItemRankInfo` (10 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | rank | tinyint(3) unsigned | NO |  |
| 2 | ect_broken_rate | tinyint(3) unsigned | NO |  |
| 3 | ect_up_rate | tinyint(3) unsigned | NO |  |
| 4 | ect_up_down_rate | tinyint(3) unsigned | NO |  |
| 5 | ect_up_broken_rate | tinyint(3) unsigned | NO |  |
| 6 | g_rank_rate | int(10) unsigned | NO |  |
| 7 | g_opt_rate | tinyint(3) unsigned | NO |  |

### `s_ItemTypeInfo` (14 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | item_type | tinyint(3) unsigned | NO |  |
| 2 | type_name | varchar(20) | NO |  |
| 3 | gamble_money | int(10) unsigned | NO |  |
| 4 | loot_rate | tinyint(3) unsigned | NO |  |

### `s_Itempoweradd` (13 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | idx | varchar(255) | YES |  |
| 2 | set_name | varchar(255) | YES |  |
| 3 | helmet | varchar(255) | YES |  |
| 4 | armor | varchar(255) | YES |  |
| 5 | glove | varchar(255) | YES |  |
| 6 | boots | varchar(255) | YES |  |
| 7 | arm1 | varchar(255) | YES |  |
| 8 | arm2 | varchar(255) | YES |  |
| 9 | ring1 | varchar(255) | YES |  |
| 10 | ring2 | varchar(255) | YES |  |
| 11 | neck | varchar(255) | YES |  |
| 12 | effect | varchar(255) | YES |  |
| 13 | abi1 | varchar(255) | YES |  |
| 14 | abi1_set | varchar(255) | YES |  |
| 15 | abi2 | varchar(255) | YES |  |
| 16 | abi2_set | varchar(255) | YES |  |

### `s_LootRankInfo` (20 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | loot_type | tinyint(3) unsigned | NO | PRI |
| 2 | item_type | smallint(5) unsigned | NO | PRI |
| 3 | item_rank | tinyint(3) unsigned | NO | PRI |
| 4 | rank_rate | int(10) unsigned | NO |  |
| 5 | opt1 | tinyint(3) unsigned | NO |  |
| 6 | opt1_rate1 | int(10) unsigned | NO |  |
| 7 | opt1_rate2 | int(10) unsigned | NO |  |
| 8 | opt1_rate3 | int(10) unsigned | NO |  |
| 9 | opt1_rate4 | int(10) unsigned | NO |  |
| 10 | opt1_rate5 | int(10) unsigned | NO |  |
| 11 | opt2 | tinyint(3) unsigned | NO |  |
| 12 | opt2_rate1 | int(10) unsigned | NO |  |
| 13 | opt2_rate2 | int(10) unsigned | NO |  |
| 14 | opt2_rate3 | int(10) unsigned | NO |  |
| 15 | opt2_rate4 | int(10) unsigned | NO |  |
| 16 | opt2_rate5 | int(10) unsigned | NO |  |
| 17 | opt3 | tinyint(3) unsigned | NO |  |
| 18 | opt3_rate1 | int(10) unsigned | NO |  |
| 19 | opt3_rate2 | int(10) unsigned | NO |  |
| 20 | opt3_rate3 | int(10) unsigned | NO |  |
| 21 | opt3_rate4 | int(10) unsigned | NO |  |
| 22 | opt3_rate5 | int(10) unsigned | NO |  |
| 23 | opt4 | tinyint(3) unsigned | NO |  |
| 24 | opt4_rate1 | int(10) unsigned | NO |  |
| 25 | opt4_rate2 | int(10) unsigned | NO |  |
| 26 | opt4_rate3 | int(10) unsigned | NO |  |
| 27 | opt4_rate4 | int(10) unsigned | NO |  |
| 28 | opt4_rate5 | int(10) unsigned | NO |  |
| 29 | opt5 | tinyint(3) unsigned | NO |  |
| 30 | opt5_rate1 | int(10) unsigned | NO |  |
| 31 | opt5_rate2 | int(10) unsigned | NO |  |
| 32 | opt5_rate3 | int(10) unsigned | NO |  |
| 33 | opt5_rate4 | int(10) unsigned | NO |  |
| 34 | opt5_rate5 | int(10) unsigned | NO |  |
| 35 | opt6 | tinyint(3) unsigned | NO |  |
| 36 | opt6_rate1 | int(10) unsigned | NO |  |
| 37 | opt6_rate2 | int(10) unsigned | NO |  |
| 38 | opt6_rate3 | int(10) unsigned | NO |  |
| 39 | opt6_rate4 | int(10) unsigned | NO |  |
| 40 | opt6_rate5 | int(10) unsigned | NO |  |
| 41 | opt7 | tinyint(3) unsigned | NO |  |
| 42 | opt7_rate1 | int(10) unsigned | NO |  |
| 43 | opt7_rate2 | int(10) unsigned | NO |  |
| 44 | opt7_rate3 | int(10) unsigned | NO |  |
| 45 | opt7_rate4 | int(10) unsigned | NO |  |
| 46 | opt7_rate5 | int(10) unsigned | NO |  |
| 47 | opt8 | tinyint(3) unsigned | NO |  |
| 48 | opt8_rate1 | int(10) unsigned | NO |  |
| 49 | opt8_rate2 | int(10) unsigned | NO |  |
| 50 | opt8_rate3 | int(10) unsigned | NO |  |
| 51 | opt8_rate4 | int(10) unsigned | NO |  |
| 52 | opt8_rate5 | int(10) unsigned | NO |  |

### `s_LootTypeInfo` (11 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | loot_type | tinyint(3) unsigned | NO | PRI |
| 2 | sp_loot_rate | smallint(5) unsigned | NO |  |
| 3 | loot_rate | smallint(5) unsigned | NO |  |
| 4 | opt_rate1 | int(10) unsigned | NO |  |
| 5 | opt_rate2 | int(10) unsigned | NO |  |

### `s_LvMonInfo` (210 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | Lv | varchar(255) | YES |  |
| 2 | HP | varchar(255) | YES |  |
| 3 | MP | varchar(255) | YES |  |
| 4 | STR | varchar(255) | YES |  |
| 5 | DEX | varchar(255) | YES |  |
| 6 | AIM | varchar(255) | YES |  |
| 7 | Luck | varchar(255) | YES |  |
| 8 | ATT | varchar(255) | YES |  |
| 9 | AP | varchar(255) | YES |  |
| 10 | DP | varchar(255) | YES |  |
| 11 | HitCnt | varchar(255) | YES |  |
| 12 | HitDice | varchar(255) | YES |  |
| 13 | GiveExp | varchar(255) | YES |  |
| 14 | MixRate | varchar(255) | YES |  |

### `s_LvUserInfo` (200 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | Lv | smallint(5) unsigned | NO | PRI |
| 2 | LvUpExp | bigint(20) unsigned | NO |  |

### `s_MixSkill` (10 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | MixSkillLevel | tinyint(3) unsigned | NO |  |
| 2 | StartHenchLevel | smallint(5) unsigned | NO |  |
| 3 | EndHenchLevel | smallint(5) unsigned | NO |  |
| 4 | MixSkillBasis | smallint(5) unsigned | NO |  |
| 5 | MixSkillStart | smallint(5) unsigned | NO |  |
| 6 | MixSkillMaster | smallint(5) unsigned | NO |  |
| 7 | MixSkillBonus | smallint(5) unsigned | NO |  |
| 8 | MixSkillMaxRate | tinyint(3) unsigned | NO |  |

### `s_OptInfo` (8 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | type | tinyint(3) unsigned | NO |  |
| 2 | loot_rate | tinyint(3) unsigned | NO |  |

### `s_OptLvInfo` (10 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | opt_lv | tinyint(3) unsigned | NO |  |
| 2 | enchant_rate | tinyint(3) unsigned | NO |  |
| 3 | gamble_rate | int(10) unsigned | NO |  |

### `s_PartyExpRate` (4 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | member_count | int(10) unsigned | NO |  |
| 2 | exp_add_rate | int(10) unsigned | NO |  |

### `s_PartyPenaltyRate` (8 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | level_diff | int(10) unsigned | NO |  |
| 2 | penalty_rate | int(10) unsigned | NO |  |

### `s_Production` (167 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | idx | int(4) | NO |  |
| 2 | doc_idx | int(4) | NO |  |
| 3 | doc_name | varchar(32) | NO |  |
| 4 | result_idx | int(4) | NO |  |
| 5 | result_name | varchar(32) | NO |  |
| 6 | result_count | int(4) | NO |  |
| 7 | money | int(32) | NO |  |
| 8 | default_pro | int(4) | NO |  |
| 9 | add_pro | int(4) | NO |  |
| 10 | opt_slot_cnt | int(4) | NO |  |
| 11 | stuff_idx1 | int(4) | NO |  |
| 12 | stuff_name1 | varchar(32) | NO |  |
| 13 | stuff_count1 | int(4) | NO |  |
| 14 | stuff_idx2 | int(4) | NO |  |
| 15 | stuff_name2 | varchar(32) | NO |  |
| 16 | stuff_count2 | int(4) | NO |  |
| 17 | stuff_idx3 | int(4) | NO |  |
| 18 | stuff_name3 | varchar(32) | NO |  |
| 19 | stuff_count3 | int(4) | NO |  |
| 20 | stuff_idx4 | int(4) | NO |  |
| 21 | stuff_name4 | varchar(32) | NO |  |
| 22 | stuff_count4 | int(4) | NO |  |
| 23 | stuff_idx5 | int(4) | NO |  |
| 24 | stuff_name5 | varchar(32) | NO |  |
| 25 | stuff_count5 | int(4) | NO |  |

### `s_QuestScheduler` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | npc_idx | smallint(5) unsigned | NO |  |
| 2 | open_yr | smallint(5) unsigned | NO |  |
| 3 | open_month | tinyint(3) unsigned | NO |  |
| 4 | open_day | tinyint(3) unsigned | NO |  |
| 5 | open_hour | tinyint(3) unsigned | NO |  |
| 6 | open_min | tinyint(3) unsigned | NO |  |
| 7 | close_yr | smallint(5) unsigned | NO |  |
| 8 | close_month | tinyint(3) unsigned | NO |  |
| 9 | close_day | tinyint(3) unsigned | NO |  |
| 10 | close_hour | tinyint(3) unsigned | NO |  |
| 11 | close_min | tinyint(3) unsigned | NO |  |

### `s_SkillData` (140 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | skill_index | tinyint(3) unsigned | NO |  |
| 2 | level | tinyint(3) unsigned | NO |  |
| 3 | consumedMp | tinyint(3) unsigned | NO |  |
| 4 | maxTargetDistance | tinyint(3) unsigned | NO |  |
| 5 | targetRange | tinyint(3) unsigned | NO |  |
| 6 | requireSP | smallint(5) unsigned | NO |  |
| 7 | continuityTime | int(10) unsigned | NO |  |
| 8 | coolTime | int(10) unsigned | NO |  |

### `s_SkillProperty` (31 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | skillIndex | tinyint(3) unsigned | NO |  |
| 2 | name | varchar(20) | NO |  |
| 3 | targetClass | varchar(8) | NO |  |
| 4 | pkTargetClass | varchar(8) | NO |  |
| 5 | targetRangeClass | tinyint(3) unsigned | NO |  |
| 6 | positiveEffect | tinyint(1) unsigned | NO |  |
| 7 | effectIndex | tinyint(3) unsigned | NO |  |
| 8 | effectingStat | tinyint(3) unsigned | NO |  |
| 9 | maxLevel | tinyint(3) unsigned | NO |  |
| 10 | upgradeType | tinyint(3) unsigned | NO |  |
| 11 | rquireUpdateType | tinyint(3) unsigned | NO |  |
| 12 | learningGold | int(10) unsigned | NO |  |
| 13 | learningSP | smallint(5) unsigned | NO |  |

### `s_event` (1 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | idx | tinyint(4) | NO | PRI |
| 2 | EventStart | datetime | NO |  |
| 3 | EventEnd | datetime | NO |  |
| 4 | CoreRate | float | YES |  |
| 5 | ExpRate | float | YES |  |
| 6 | ItemRate | float | YES |  |
| 7 | GpRate | float | YES |  |
| 8 | EventStartNotice1 | varchar(52) | YES |  |
| 9 | EventStartNotice2 | varchar(52) | YES |  |
| 10 | EventStartNotice3 | varchar(52) | YES |  |
| 11 | EventEndNotice1 | varchar(52) | YES |  |
| 12 | EventEndNotice2 | varchar(52) | YES |  |
| 13 | EventEndNotice3 | varchar(52) | YES |  |
| 14 | EventTime | datetime | YES |  |

### `s_event_drop` (169 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | idx | int(4) | NO |  |
| 2 | book_name | char(33) | NO |  |
| 3 | item_01 | int(4) | NO |  |
| 4 | item_01_per | int(4) | NO |  |
| 5 | item_02 | int(4) | NO |  |
| 6 | item_02_per | int(4) | NO |  |
| 7 | item_03 | int(4) | NO |  |
| 8 | item_03_per | int(4) | NO |  |
| 9 | item_04 | int(4) | NO |  |
| 10 | item_04_per | int(4) | NO |  |
| 11 | item_05 | int(4) | NO |  |
| 12 | item_05_per | int(4) | NO |  |
| 13 | item_06 | int(4) | NO |  |
| 14 | item_06_per | int(4) | NO |  |
| 15 | item_07 | int(4) | NO |  |
| 16 | item_07_per | int(4) | NO |  |
| 17 | item_08 | int(4) | NO |  |
| 18 | item_08_per | int(4) | NO |  |
| 19 | item_09 | int(4) | NO |  |
| 20 | item_09_per | int(4) | NO |  |
| 21 | item_010 | int(4) | NO |  |
| 22 | item_010_per | int(4) | NO |  |

### `s_gate` (140 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | from_zone_idx | smallint(5) unsigned | NO |  |
| 2 | from_zone_attr | smallint(5) unsigned | NO |  |
| 3 | dest_zone_idx | smallint(5) unsigned | NO |  |
| 4 | dest_zone_layer | smallint(5) unsigned | NO |  |

### `s_hero` (4 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | type | varchar(255) | YES |  |
| 2 | name | varchar(255) | YES |  |
| 3 | sex | varchar(255) | YES |  |
| 4 | birth_zone_idx | varchar(255) | YES |  |
| 5 | birth_zone_layernum | varchar(255) | YES |  |
| 6 | speed_move | varchar(255) | YES |  |
| 7 | speed_attack | varchar(255) | YES |  |
| 8 | speed_skill | varchar(255) | YES |  |
| 9 | base_str | varchar(255) | YES |  |
| 10 | base_dex | varchar(255) | YES |  |
| 11 | base_aim | varchar(255) | YES |  |
| 12 | base_luck | varchar(255) | YES |  |
| 13 | base_ap | varchar(255) | YES |  |
| 14 | base_dp | varchar(255) | YES |  |
| 15 | base_hc | varchar(255) | YES |  |
| 16 | base_hd | varchar(255) | YES |  |
| 17 | base_hp | varchar(255) | YES |  |
| 18 | base_mp | varchar(255) | YES |  |
| 19 | res_fire | varchar(255) | YES |  |
| 20 | res_water | varchar(255) | YES |  |
| 21 | res_earth | varchar(255) | YES |  |
| 22 | res_wind | varchar(255) | YES |  |
| 23 | res_devil | varchar(255) | YES |  |
| 24 | attr | varchar(255) | YES |  |
| 25 | make_freepoint | varchar(255) | YES |  |
| 26 | make_bonus_item0 | varchar(255) | YES |  |
| 27 | make_bonus_item1 | varchar(255) | YES |  |
| 28 | make_bonus_item2 | varchar(255) | YES |  |
| 29 | skill_able | varchar(255) | YES |  |
| 30 | equip_able | varchar(255) | YES |  |

### `s_hero_skill` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | idx | tinyint(3) unsigned | NO |  |
| 2 | name | varchar(20) | NO |  |
| 3 | require_level | smallint(6) unsigned | NO |  |
| 4 | skill_level | tinyint(3) unsigned | NO |  |
| 5 | consume_mp | smallint(5) unsigned | NO |  |
| 6 | range | smallint(5) unsigned | NO |  |
| 7 | Type | tinyint(3) unsigned | NO |  |

### `s_item` (4608 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | idx | varchar(255) | YES |  |
| 2 | name | varchar(255) | YES |  |
| 3 | price | varchar(255) | YES |  |
| 4 | barter_price | varchar(255) | YES |  |
| 5 | rarity | varchar(255) | YES |  |
| 6 | type | varchar(255) | YES |  |
| 7 | maxCnt | varchar(255) | YES |  |
| 8 | require_level | varchar(255) | YES |  |
| 9 | require_type | varchar(255) | YES |  |
| 10 | require_value | varchar(255) | YES |  |
| 11 | equip_type | varchar(255) | YES |  |
| 12 | equip_part0 | varchar(255) | YES |  |
| 13 | equip_part1 | varchar(255) | YES |  |
| 14 | equip_part2 | varchar(255) | YES |  |
| 15 | block_part0 | varchar(255) | YES |  |
| 16 | block_part1 | varchar(255) | YES |  |
| 17 | roll_spell_idx | varchar(255) | YES |  |
| 18 | roll_spell_level | varchar(255) | YES |  |
| 19 | ech_type0 | varchar(255) | YES |  |
| 20 | ech_type1 | varchar(255) | YES |  |
| 21 | ech_type2 | varchar(255) | YES |  |
| 22 | ech_type3 | varchar(255) | YES |  |
| 23 | ech_type4 | varchar(255) | YES |  |
| 24 | ech_type5 | varchar(255) | YES |  |
| 25 | ech_type6 | varchar(255) | YES |  |
| 26 | ech_typenum0 | varchar(255) | YES |  |
| 27 | ech_typenum1 | varchar(255) | YES |  |
| 28 | ech_typenum2 | varchar(255) | YES |  |
| 29 | ech_typenum3 | varchar(255) | YES |  |
| 30 | ech_typenum4 | varchar(255) | YES |  |
| 31 | ech_typenum5 | varchar(255) | YES |  |
| 32 | ech_typenum6 | varchar(255) | YES |  |
| 33 | ech_x0 | varchar(255) | YES |  |
| 34 | ech_x1 | varchar(255) | YES |  |
| 35 | ech_x2 | varchar(255) | YES |  |
| 36 | ech_x3 | varchar(255) | YES |  |
| 37 | ech_x4 | varchar(255) | YES |  |
| 38 | ech_x5 | varchar(255) | YES |  |
| 39 | ech_x6 | varchar(255) | YES |  |
| 40 | ech_speed_move | varchar(255) | YES |  |
| 41 | ech_speed_attack | varchar(255) | YES |  |
| 42 | ech_speed_skill | varchar(255) | YES |  |
| 43 | range | varchar(255) | YES |  |
| 44 | duration | varchar(255) | YES |  |
| 45 | kind | varchar(255) | YES |  |
| 46 | rank | varchar(255) | YES |  |
| 47 | duration_type | varchar(255) | YES |  |
| 48 | restrict_type | varchar(255) | YES |  |
| 49 | make_synergy_type | varchar(255) | YES |  |
| 50 | make_synergy_level | varchar(255) | YES |  |

### `s_mix` (720 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | mode | varchar(255) | YES |  |
| 2 | mainnum | varchar(255) | YES |  |
| 3 | maingrade | varchar(255) | YES |  |
| 4 | subnum | varchar(255) | YES |  |
| 5 | subgrade | varchar(255) | YES |  |
| 6 | result | varchar(255) | YES |  |

### `s_mob` (889 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | idx | varchar(255) | YES |  |
| 2 | zone_idx0 | varchar(255) | YES |  |
| 3 | zone_idx1 | varchar(255) | YES |  |
| 4 | zone_idx2 | varchar(255) | YES |  |
| 5 | zone_idx3 | varchar(255) | YES |  |
| 6 | zone_idx4 | varchar(255) | YES |  |
| 7 | zone_idx5 | varchar(255) | YES |  |
| 8 | birth_zone_layernum0 | varchar(255) | YES |  |
| 9 | birth_zone_layernum1 | varchar(255) | YES |  |
| 10 | birth_zone_layernum2 | varchar(255) | YES |  |
| 11 | birth_zone_layernum3 | varchar(255) | YES |  |
| 12 | birth_zone_layernum4 | varchar(255) | YES |  |
| 13 | birth_zone_layernum5 | varchar(255) | YES |  |
| 14 | move_type | varchar(255) | YES |  |
| 15 | monster_type | varchar(255) | YES |  |
| 16 | name | varchar(255) | YES |  |
| 17 | agressive | varchar(255) | YES |  |
| 18 | sight_range | varchar(255) | YES |  |
| 19 | mobitem_idx | varchar(255) | YES |  |
| 20 | appear_rate0 | varchar(255) | YES |  |
| 21 | appear_rate1 | varchar(255) | YES |  |
| 22 | appear_rate2 | varchar(255) | YES |  |
| 23 | appear_rate3 | varchar(255) | YES |  |
| 24 | appear_rate4 | varchar(255) | YES |  |
| 25 | appear_rate5 | varchar(255) | YES |  |
| 26 | wait_time0 | varchar(255) | YES |  |
| 27 | wait_time1 | varchar(255) | YES |  |
| 28 | wait_time2 | varchar(255) | YES |  |
| 29 | wait_time3 | varchar(255) | YES |  |
| 30 | wait_time4 | varchar(255) | YES |  |
| 31 | wait_time5 | varchar(255) | YES |  |
| 32 | interval_time0 | varchar(255) | YES |  |
| 33 | interval_time1 | varchar(255) | YES |  |
| 34 | interval_time2 | varchar(255) | YES |  |
| 35 | interval_time3 | varchar(255) | YES |  |
| 36 | interval_time4 | varchar(255) | YES |  |
| 37 | interval_time5 | varchar(255) | YES |  |
| 38 | life_time0 | varchar(255) | YES |  |
| 39 | life_time1 | varchar(255) | YES |  |
| 40 | life_time2 | varchar(255) | YES |  |
| 41 | life_time3 | varchar(255) | YES |  |
| 42 | life_time4 | varchar(255) | YES |  |
| 43 | life_time5 | varchar(255) | YES |  |
| 44 | unable_attack_layer0 | varchar(255) | YES |  |
| 45 | unable_attack_layer1 | varchar(255) | YES |  |
| 46 | unable_attack_layer2 | varchar(255) | YES |  |
| 47 | unable_attack_layer3 | varchar(255) | YES |  |
| 48 | unable_attack_layer4 | varchar(255) | YES |  |
| 49 | unable_attack_layer5 | varchar(255) | YES |  |
| 50 | blocking_layer0 | varchar(255) | YES |  |
| 51 | blocking_layer1 | varchar(255) | YES |  |
| 52 | blocking_layer2 | varchar(255) | YES |  |
| 53 | blocking_layer3 | varchar(255) | YES |  |
| 54 | blocking_layer4 | varchar(255) | YES |  |
| 55 | blocking_layer5 | varchar(255) | YES |  |
| 56 | blocking_value0 | varchar(255) | YES |  |
| 57 | blocking_value1 | varchar(255) | YES |  |
| 58 | blocking_value2 | varchar(255) | YES |  |
| 59 | blocking_value3 | varchar(255) | YES |  |
| 60 | blocking_value4 | varchar(255) | YES |  |
| 61 | blocking_value5 | varchar(255) | YES |  |

### `s_mobitem` (634 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | idx | varchar(255) | YES |  |
| 2 | base_money | varchar(255) | YES |  |
| 3 | bonus_money | varchar(255) | YES |  |
| 4 | item_idx0 | varchar(255) | YES |  |
| 5 | item_idx1 | varchar(255) | YES |  |
| 6 | item_idx2 | varchar(255) | YES |  |
| 7 | item_idx3 | varchar(255) | YES |  |
| 8 | item_idx4 | varchar(255) | YES |  |
| 9 | item_idx5 | varchar(255) | YES |  |
| 10 | item_idx6 | varchar(255) | YES |  |
| 11 | item_idx7 | varchar(255) | YES |  |
| 12 | item_idx8 | varchar(255) | YES |  |
| 13 | item_idx9 | varchar(255) | YES |  |
| 14 | item_drop_percent0 | varchar(255) | YES |  |
| 15 | item_drop_percent1 | varchar(255) | YES |  |
| 16 | item_drop_percent2 | varchar(255) | YES |  |
| 17 | item_drop_percent3 | varchar(255) | YES |  |
| 18 | item_drop_percent4 | varchar(255) | YES |  |
| 19 | item_drop_percent5 | varchar(255) | YES |  |
| 20 | item_drop_percent6 | varchar(255) | YES |  |
| 21 | item_drop_percent7 | varchar(255) | YES |  |
| 22 | item_drop_percent8 | varchar(255) | YES |  |
| 23 | item_drop_percent9 | varchar(255) | YES |  |
| 24 | item_drop_count0 | varchar(255) | YES |  |
| 25 | item_drop_count1 | varchar(255) | YES |  |
| 26 | item_drop_count2 | varchar(255) | YES |  |
| 27 | item_drop_count3 | varchar(255) | YES |  |
| 28 | item_drop_count4 | varchar(255) | YES |  |
| 29 | item_drop_count5 | varchar(255) | YES |  |
| 30 | item_drop_count6 | varchar(255) | YES |  |
| 31 | item_drop_count7 | varchar(255) | YES |  |
| 32 | item_drop_count8 | varchar(255) | YES |  |
| 33 | item_drop_count9 | varchar(255) | YES |  |

### `s_monster` (1418 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | type | varchar(255) | YES |  |
| 2 | name | varchar(255) | YES |  |
| 3 | race | varchar(255) | YES |  |
| 4 | start_base_level | varchar(255) | YES |  |
| 5 | price | varchar(255) | YES |  |
| 6 | sexratio | varchar(255) | YES |  |
| 7 | speed_move | varchar(255) | YES |  |
| 8 | speed_attack | varchar(255) | YES |  |
| 9 | hench_speed_attack | varchar(255) | YES |  |
| 10 | speed_skill | varchar(255) | YES |  |
| 11 | hench_speed_skill | varchar(255) | YES |  |
| 12 | core_rate | varchar(255) | YES |  |
| 13 | stat_rate | varchar(255) | YES |  |
| 14 | HenchStatRate | varchar(255) | YES |  |
| 15 | loot_type | varchar(255) | YES |  |
| 16 | hp_rate | varchar(255) | YES |  |
| 17 | hench_hp_rate | varchar(255) | YES |  |
| 18 | exp_rate | varchar(255) | YES |  |
| 19 | attack_range | varchar(255) | YES |  |
| 20 | hench_attack_range | varchar(255) | YES |  |
| 21 | restrict_type | varchar(255) | YES |  |
| 22 | sp | varchar(255) | YES |  |
| 23 | skill | varchar(255) | YES |  |
| 24 | attack_range_x1 | varchar(255) | YES |  |
| 25 | attack_range_x2 | varchar(255) | YES |  |
| 26 | attack_range_y1 | varchar(255) | YES |  |
| 27 | attack_range_y2 | varchar(255) | YES |  |
| 28 | use_item_type | varchar(255) | YES |  |
| 29 | mix_restrict | varchar(255) | YES |  |
| 30 | duration | varchar(255) | YES |  |
| 31 | duration_type | varchar(255) | YES |  |

### `s_npc` (1052 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | idx | varchar(255) | YES |  |
| 2 | name | varchar(255) | YES |  |
| 3 | type | varchar(255) | YES |  |
| 4 | birth_zone_idx | varchar(255) | YES |  |
| 5 | birth_zone_x | varchar(255) | YES |  |
| 6 | birth_zone_y | varchar(255) | YES |  |
| 7 | move_zone_layernum | varchar(255) | YES |  |
| 8 | sell_type | varchar(255) | YES |  |
| 9 | sell_ratio | varchar(255) | YES |  |
| 10 | barter_item_idx | varchar(255) | YES |  |

### `s_npc_sale` (1792 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | npc_idx | smallint(5) unsigned | NO |  |
| 2 | sale_type | tinyint(3) unsigned | NO |  |
| 3 | sale_idx | int(10) unsigned | NO |  |
| 4 | buy_ratio | smallint(5) unsigned | NO |  |

### `s_zone` (201 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | idx | varchar(255) | YES |  |
| 2 | name | varchar(255) | YES |  |
| 3 | mob_able | varchar(255) | YES |  |
| 4 | revive_zone_layernum | varchar(255) | YES |  |
| 5 | nonPkZoneLayernum | varchar(255) | YES |  |
| 6 | dual_zone_layernum | varchar(255) | YES |  |
| 7 | min_mob | varchar(255) | YES |  |
| 8 | max_mob | varchar(255) | YES |  |
| 9 | mob_peruser | varchar(255) | YES |  |
| 10 | min_level | varchar(255) | YES |  |
| 11 | max_level | varchar(255) | YES |  |
| 12 | restriction | varchar(255) | YES |  |
| 13 | item_idx | varchar(255) | YES |  |
| 14 | CollisionLayer | varchar(255) | YES |  |
| 15 | RootZone | varchar(255) | YES |  |
| 16 | Ability | varchar(255) | YES |  |
| 17 | mob_damage_rate | varchar(255) | YES |  |
| 18 | PkZoneFlag | varchar(255) | YES |  |
| 19 | dropitemidx | varchar(255) | YES |  |
| 20 | dropItemCond | varchar(255) | YES |  |

### `temp` (14 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | item_type | tinyint(3) unsigned | NO |  |
| 2 | type_name | varchar(20) | NO |  |
| 3 | gamble_money | int(10) unsigned | NO |  |
| 4 | loot_rate | tinyint(3) unsigned | NO |  |


## Database: `Web_Account` (3 tables)

### `GameTail` (5 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | SubType | enum('TNULL','HENCH','ITEM') | NO |  |
| 2 | GiftPlayerID | varchar(20) | NO |  |
| 3 | GiftIdIdx | int(11) unsigned | NO |  |
| 4 | IdIdx | int(11) unsigned | NO | MUL |
| 5 | nKey | int(11) | NO | PRI |
| 6 | ItemIdx | smallint(5) unsigned | NO |  |
| 7 | Opt | tinyint(3) unsigned | NO |  |
| 8 | OptLevel | tinyint(3) unsigned | NO |  |
| 9 | Qty | smallint(5) unsigned | NO |  |
| 10 | ServerID | tinyint(3) unsigned | NO |  |
| 11 | Flag | enum('NEW','LOCK','SPEND','BACK') | NO |  |
| 12 | RegDate | datetime | NO |  |
| 13 | ReceiptDate | datetime | NO |  |
| 14 | CartID | varchar(25) | NO | MUL |
| 15 | uKey | tinyint(3) unsigned | NO |  |

### `GameTail_Event` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | num | int(11) | NO |  |
| 2 | SubType | enum('TNULL','HENCH','ITEM') | NO |  |
| 3 | PlayerID | varchar(16) | NO | MUL |
| 4 | IdIdx | int(11) unsigned | NO | MUL |
| 5 | nKey | int(11) | NO | PRI |
| 6 | ObjectIdx | smallint(5) unsigned | NO |  |
| 7 | Qty | smallint(5) unsigned | NO |  |
| 8 | ServerFlag | enum('define','undefine') | NO |  |
| 9 | ServerID | tinyint(3) unsigned | NO |  |
| 10 | Flag | enum('NEW','LOCK','SPEND','TIME_OVER') | NO |  |
| 11 | RegDate | datetime | NO |  |
| 12 | ReceiptDate | datetime | NO |  |
| 13 | Info | varchar(255) | NO |  |
| 14 | GroupTxt | varchar(20) | NO | MUL |
| 15 | StartDate | datetime | NO |  |
| 16 | EndDate | datetime | NO |  |

### `User_Count` (1 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | SEQ | int(30) unsigned | NO | PRI |
| 2 | LGS | int(10) | YES |  |
| 3 | GMS | int(10) | YES |  |
| 4 | zone1 | int(10) | YES |  |
| 5 | zone2 | int(10) | YES |  |
| 6 | Server_total | int(10) | YES |  |
| 7 | checkTime | datetime | YES | MUL |


## Database: `gamedata` (49 tables)

### `rank_target_idx` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | idx | int(32) unsigned | YES | UNI |

### `u_BillItem_0` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | SubType | enum('TNULL','HENCH','ITEM') | NO |  |
| 2 | GiftPlayerID | varchar(20) | NO |  |
| 3 | GiftIdIdx | int(11) | NO |  |
| 4 | IdIdx | int(11) | NO |  |
| 5 | nKey | int(11) | NO |  |
| 6 | ItemIdx | smallint(5) unsigned | NO |  |
| 7 | Opt | tinyint(3) | NO |  |
| 8 | OptLevel | tinyint(3) | NO |  |
| 9 | Qty | tinyint(3) | NO |  |
| 10 | ServerID | tinyint(3) | NO |  |
| 11 | Flag | enum('NEW','LOCK','SPEND','RESPEND') | NO |  |
| 12 | RegDate | datetime | NO |  |
| 13 | TakeType | tinyint(3) unsigned | NO |  |

### `u_BillItem_1` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | SubType | enum('TNULL','HENCH','ITEM') | NO |  |
| 2 | GiftPlayerID | varchar(20) | NO |  |
| 3 | GiftIdIdx | int(11) | NO |  |
| 4 | IdIdx | int(11) | NO |  |
| 5 | nKey | int(11) unsigned | NO |  |
| 6 | ItemIdx | smallint(5) unsigned | NO |  |
| 7 | Opt | tinyint(3) | NO |  |
| 8 | OptLevel | tinyint(3) | NO |  |
| 9 | Qty | tinyint(3) | NO |  |
| 10 | ServerID | tinyint(3) | NO |  |
| 11 | Flag | enum('NEW','LOCK','SPEND','RESPEND') | NO |  |
| 12 | RegDate | datetime | NO |  |
| 13 | TakeType | tinyint(3) unsigned | YES |  |

### `u_BillItem_2` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | SubType | enum('TNULL','HENCH','ITEM') | NO |  |
| 2 | GiftPlayerID | varchar(20) | NO |  |
| 3 | GiftIdIdx | int(11) | NO |  |
| 4 | IdIdx | int(11) | NO |  |
| 5 | nKey | int(11) unsigned | NO |  |
| 6 | ItemIdx | smallint(5) unsigned | NO |  |
| 7 | Opt | tinyint(3) | NO |  |
| 8 | OptLevel | tinyint(3) | NO |  |
| 9 | Qty | tinyint(3) | NO |  |
| 10 | ServerID | tinyint(3) | NO |  |
| 11 | Flag | enum('NEW','LOCK','SPEND','RESPEND') | NO |  |
| 12 | RegDate | datetime | NO |  |
| 13 | TakeType | tinyint(3) unsigned | YES |  |

### `u_BillItem_3` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | SubType | enum('TNULL','HENCH','ITEM') | NO |  |
| 2 | GiftPlayerID | varchar(20) | NO |  |
| 3 | GiftIdIdx | int(11) | NO |  |
| 4 | IdIdx | int(11) | NO |  |
| 5 | nKey | int(11) unsigned | NO |  |
| 6 | ItemIdx | smallint(5) unsigned | NO |  |
| 7 | Opt | tinyint(3) | NO |  |
| 8 | OptLevel | tinyint(3) | NO |  |
| 9 | Qty | tinyint(3) | NO |  |
| 10 | ServerID | tinyint(3) | NO |  |
| 11 | Flag | enum('NEW','LOCK','SPEND','RESPEND') | NO |  |
| 12 | RegDate | datetime | NO |  |
| 13 | TakeType | tinyint(3) unsigned | YES |  |

### `u_BillItem_4` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | SubType | enum('TNULL','HENCH','ITEM') | NO |  |
| 2 | GiftPlayerID | varchar(20) | NO |  |
| 3 | GiftIdIdx | int(11) | NO |  |
| 4 | IdIdx | int(11) | NO |  |
| 5 | nKey | int(11) unsigned | NO |  |
| 6 | ItemIdx | smallint(5) unsigned | NO |  |
| 7 | Opt | tinyint(3) | NO |  |
| 8 | OptLevel | tinyint(3) | NO |  |
| 9 | Qty | tinyint(3) | NO |  |
| 10 | ServerID | tinyint(3) | NO |  |
| 11 | Flag | enum('NEW','LOCK','SPEND','RESPEND') | NO |  |
| 12 | RegDate | datetime | NO |  |
| 13 | TakeType | tinyint(3) unsigned | YES |  |

### `u_BillItem_5` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | SubType | enum('TNULL','HENCH','ITEM') | NO |  |
| 2 | GiftPlayerID | varchar(20) | NO |  |
| 3 | GiftIdIdx | int(11) | NO |  |
| 4 | IdIdx | int(11) | NO |  |
| 5 | nKey | int(11) unsigned | NO |  |
| 6 | ItemIdx | smallint(5) unsigned | NO |  |
| 7 | Opt | tinyint(3) | NO |  |
| 8 | OptLevel | tinyint(3) | NO |  |
| 9 | Qty | tinyint(3) | NO |  |
| 10 | ServerID | tinyint(3) | NO |  |
| 11 | Flag | enum('NEW','LOCK','SPEND','RESPEND') | NO |  |
| 12 | RegDate | datetime | NO |  |
| 13 | TakeType | tinyint(3) unsigned | YES |  |

### `u_BillItem_6` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | SubType | enum('TNULL','HENCH','ITEM') | NO |  |
| 2 | GiftPlayerID | varchar(20) | NO |  |
| 3 | GiftIdIdx | int(11) | NO |  |
| 4 | IdIdx | int(11) | NO |  |
| 5 | nKey | int(11) unsigned | NO |  |
| 6 | ItemIdx | smallint(5) unsigned | NO |  |
| 7 | Opt | tinyint(3) | NO |  |
| 8 | OptLevel | tinyint(3) | NO |  |
| 9 | Qty | tinyint(3) | NO |  |
| 10 | ServerID | tinyint(3) | NO |  |
| 11 | Flag | enum('NEW','LOCK','SPEND','RESPEND') | NO |  |
| 12 | RegDate | datetime | NO |  |
| 13 | TakeType | tinyint(3) unsigned | YES |  |

### `u_BillItem_7` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | SubType | enum('TNULL','HENCH','ITEM') | NO |  |
| 2 | GiftPlayerID | varchar(20) | NO |  |
| 3 | GiftIdIdx | int(11) | NO |  |
| 4 | IdIdx | int(11) | NO |  |
| 5 | nKey | int(11) unsigned | NO |  |
| 6 | ItemIdx | smallint(5) unsigned | NO |  |
| 7 | Opt | tinyint(3) | NO |  |
| 8 | OptLevel | tinyint(3) | NO |  |
| 9 | Qty | tinyint(3) | NO |  |
| 10 | ServerID | tinyint(3) | NO |  |
| 11 | Flag | enum('NEW','LOCK','SPEND','RESPEND') | NO |  |
| 12 | RegDate | datetime | NO |  |
| 13 | TakeType | tinyint(3) unsigned | YES |  |

### `u_BillItem_8` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | SubType | enum('TNULL','HENCH','ITEM') | NO |  |
| 2 | GiftPlayerID | varchar(20) | NO |  |
| 3 | GiftIdIdx | int(11) | NO |  |
| 4 | IdIdx | int(11) | NO |  |
| 5 | nKey | int(11) unsigned | NO |  |
| 6 | ItemIdx | smallint(5) unsigned | NO |  |
| 7 | Opt | tinyint(3) | NO |  |
| 8 | OptLevel | tinyint(3) | NO |  |
| 9 | Qty | tinyint(3) | NO |  |
| 10 | ServerID | tinyint(3) | NO |  |
| 11 | Flag | enum('NEW','LOCK','SPEND','RESPEND') | NO |  |
| 12 | RegDate | datetime | NO |  |
| 13 | TakeType | tinyint(3) unsigned | YES |  |

### `u_BillItem_9` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | SubType | enum('TNULL','HENCH','ITEM') | NO |  |
| 2 | GiftPlayerID | varchar(20) | NO |  |
| 3 | GiftIdIdx | int(11) | NO |  |
| 4 | IdIdx | int(11) | NO |  |
| 5 | nKey | int(11) unsigned | NO |  |
| 6 | ItemIdx | smallint(5) unsigned | NO |  |
| 7 | Opt | tinyint(3) | NO |  |
| 8 | OptLevel | tinyint(3) | NO |  |
| 9 | Qty | tinyint(3) | NO |  |
| 10 | ServerID | tinyint(3) | NO |  |
| 11 | Flag | enum('NEW','LOCK','SPEND','RESPEND') | NO |  |
| 12 | RegDate | datetime | NO |  |
| 13 | TakeType | tinyint(3) unsigned | YES |  |

### `u_CastleWarInfo` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | zone_idx | smallint(5) unsigned | NO | PRI |
| 2 | entry_type | tinyint(3) unsigned | NO | PRI |
| 3 | guild_idx | smallint(5) unsigned | NO | PRI |
| 4 | guild_name | varchar(12) | YES |  |

### `u_GuildZone` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | zone_idx | smallint(5) unsigned | NO | PRI |
| 2 | guild_idx | smallint(5) unsigned | NO |  |
| 3 | tax_rate | tinyint(3) unsigned | NO |  |
| 4 | tax_change_count | tinyint(3) unsigned | NO |  |
| 5 | tax_check_time | datetime | YES |  |

### `u_HeroSkill` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | heroIndex | int(10) unsigned | NO |  |
| 2 | heroSocketNum | tinyint(3) unsigned | NO |  |
| 3 | skillIndex | tinyint(3) unsigned | NO |  |
| 4 | skillLevel | tinyint(3) unsigned | NO |  |
| 5 | skillPoint | smallint(5) unsigned | NO |  |
| 6 | learningDate | datetime | NO |  |

### `u_MixLog` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | HeroIdx | int(10) unsigned | NO |  |
| 2 | HeroOrder | tinyint(3) unsigned | NO |  |
| 3 | type | smallint(5) unsigned | YES |  |
| 4 | SuccessCount | smallint(5) unsigned | YES |  |
| 5 | FirstSuccessTime | datetime | YES |  |

### `u_MixSkill` (1 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | HeroIdx | int(10) unsigned | NO |  |
| 2 | HeroOrder | tinyint(3) unsigned | NO |  |
| 3 | MixSkill1 | smallint(5) unsigned | NO |  |
| 4 | MixSkill2 | smallint(5) unsigned | NO |  |
| 5 | MixSkill3 | smallint(5) unsigned | NO |  |
| 6 | MixSkill4 | smallint(5) unsigned | NO |  |
| 7 | MixSkill5 | smallint(5) unsigned | NO |  |
| 8 | MixSkill6 | smallint(5) unsigned | NO |  |
| 9 | MixSkill7 | smallint(5) unsigned | NO |  |
| 10 | MixSkill8 | smallint(5) unsigned | NO |  |
| 11 | MixSkill9 | smallint(5) unsigned | NO |  |
| 12 | MixSkill10 | smallint(5) unsigned | NO |  |

### `u_QuestLog` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | hero_order | tinyint(3) unsigned | NO |  |
| 3 | quest_index | smallint(5) unsigned | NO |  |
| 4 | quest_state | tinyint(3) unsigned | NO |  |
| 5 | start_time | datetime | NO |  |
| 6 | end_time | datetime | NO |  |
| 7 | end_count | smallint(5) unsigned | NO |  |

### `u_guild` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | GuildIdx | smallint(2) unsigned | NO | PRI |
| 2 | Name | varchar(12) | YES |  |
| 3 | Info | varchar(200) | YES |  |
| 4 | Cert | varchar(100) | YES |  |
| 5 | EstablishDate | datetime | YES |  |
| 6 | LimitCount | smallint(5) unsigned | YES |  |
| 7 | Status | tinyint(3) unsigned | NO |  |
| 8 | MarkRegDate | datetime | YES |  |
| 9 | MarkRegCnt | tinyint(3) unsigned | YES |  |
| 10 | Dissolution | datetime | YES |  |
| 11 | gold | int(10) unsigned | YES |  |
| 12 | HiringIdx | smallint(5) unsigned | YES |  |
| 13 | CertDate | datetime | NO |  |
| 14 | InfoDate | datetime | NO |  |

### `u_guild_hench` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | guild_idx | int(10) unsigned | NO | MUL |
| 2 | serial | bigint(20) unsigned | NO |  |
| 3 | hench_order | tinyint(3) unsigned | NO |  |
| 4 | monster_type | smallint(5) unsigned | NO |  |
| 5 | name | char(12) | NO |  |
| 6 | sex | tinyint(3) unsigned | NO |  |
| 7 | state | tinyint(3) unsigned | NO |  |
| 8 | mixnum | smallint(5) unsigned | NO |  |
| 9 | baselevel | smallint(5) unsigned | NO |  |
| 10 | max_baselevel | tinyint(3) unsigned | NO |  |
| 11 | exp | bigint(20) unsigned | NO |  |
| 12 | speed_move | tinyint(3) unsigned | NO |  |
| 13 | speed_attack | smallint(5) unsigned | NO |  |
| 14 | speed_spell | smallint(5) unsigned | NO |  |
| 15 | str | smallint(5) unsigned | NO |  |
| 16 | dex | smallint(5) unsigned | NO |  |
| 17 | aim | smallint(5) unsigned | NO |  |
| 18 | luck | smallint(5) unsigned | NO |  |
| 19 | ap | smallint(5) unsigned | NO |  |
| 20 | dp | smallint(5) unsigned | NO |  |
| 21 | hc | smallint(5) unsigned | NO |  |
| 22 | hd | smallint(5) unsigned | NO |  |
| 23 | hp | smallint(5) unsigned | NO |  |
| 24 | mp | smallint(5) unsigned | NO |  |
| 25 | maxhp | smallint(5) unsigned | NO |  |
| 26 | maxmp | smallint(5) unsigned | NO |  |
| 27 | item0 | int(10) unsigned | NO |  |
| 28 | item1 | int(10) unsigned | NO |  |
| 29 | item2 | int(10) unsigned | NO |  |
| 30 | growthtype | tinyint(3) unsigned | NO |  |
| 31 | race_val | int(5) unsigned | NO |  |
| 32 | ign_att_cnt | tinyint(3) unsigned | NO |  |
| 33 | add_defense_cnt | tinyint(3) unsigned | NO |  |
| 34 | enchant_grade | tinyint(3) | YES |  |
| 35 | item_slot_total | tinyint(3) unsigned | NO |  |
| 36 | item_idx_0 | smallint(5) unsigned | NO |  |
| 37 | item_serial_0 | bigint(20) unsigned | NO |  |
| 38 | item_duration_0 | int(10) unsigned | NO |  |
| 39 | item_idx_1 | smallint(5) unsigned | NO |  |
| 40 | item_serial_1 | bigint(20) unsigned | NO |  |
| 41 | item_duration_1 | int(10) unsigned | NO |  |
| 42 | item_idx_2 | smallint(5) unsigned | NO |  |
| 43 | item_serial_2 | bigint(20) unsigned | NO |  |
| 44 | item_duration_2 | int(10) unsigned | NO |  |

### `u_guild_item` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | guild_idx | int(10) unsigned | NO | MUL |
| 2 | serial | bigint(20) unsigned | NO |  |
| 3 | item_idx | int(10) unsigned | NO |  |
| 4 | socket_num | tinyint(3) unsigned | NO |  |
| 5 | count | smallint(5) unsigned | NO |  |
| 6 | opt | tinyint(3) unsigned | NO |  |
| 7 | opt_level | tinyint(3) unsigned | NO |  |
| 8 | duration | int(10) unsigned | YES |  |
| 9 | last_check_time | datetime | NO |  |
| 10 | synergy | tinyint(3) unsigned | YES |  |
| 11 | synergy_level | tinyint(3) unsigned | YES |  |

### `u_guildmember` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | HeroIdx | int(10) unsigned | NO | PRI |
| 2 | HeroOrder | tinyint(3) unsigned | NO | PRI |
| 3 | GuildIdx | smallint(5) unsigned | NO |  |
| 4 | MemberID | smallint(5) unsigned | NO |  |
| 5 | Grade | tinyint(4) unsigned | YES |  |
| 6 | Authority | int(10) unsigned | YES |  |
| 7 | UpgradeDate | timestamp | NO |  |
| 8 | Memo | varchar(31) | NO |  |

### `u_hench_0` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | hero_order | tinyint(3) unsigned | NO |  |
| 3 | serial | bigint(20) unsigned | NO |  |
| 4 | position | tinyint(3) unsigned | NO |  |
| 5 | hench_order | tinyint(3) unsigned | NO |  |
| 6 | monster_type | smallint(5) unsigned | NO |  |
| 7 | name | varchar(24) | NO |  |
| 8 | sex | tinyint(3) unsigned | NO |  |
| 9 | state | tinyint(3) unsigned | NO |  |
| 10 | mixnum | smallint(5) unsigned | NO |  |
| 11 | baselevel | smallint(5) unsigned | NO |  |
| 12 | max_baselevel | smallint(3) unsigned | NO |  |
| 13 | exp | bigint(20) unsigned | NO |  |
| 14 | speed_move | tinyint(3) unsigned | NO |  |
| 15 | speed_attack | smallint(5) unsigned | NO |  |
| 16 | speed_skill | smallint(5) unsigned | NO |  |
| 17 | str | smallint(5) unsigned | NO |  |
| 18 | dex | smallint(5) unsigned | NO |  |
| 19 | aim | smallint(5) unsigned | NO |  |
| 20 | luck | smallint(5) unsigned | NO |  |
| 21 | ap | smallint(5) unsigned | NO |  |
| 22 | dp | smallint(5) unsigned | NO |  |
| 23 | hc | smallint(5) unsigned | NO |  |
| 24 | hd | smallint(5) unsigned | NO |  |
| 25 | hp | smallint(5) unsigned | NO |  |
| 26 | mp | smallint(5) unsigned | NO |  |
| 27 | maxhp | smallint(5) unsigned | NO |  |
| 28 | maxmp | smallint(5) unsigned | NO |  |
| 29 | item0 | int(10) unsigned | NO |  |
| 30 | item1 | int(10) unsigned | NO |  |
| 31 | item2 | int(10) unsigned | NO |  |
| 32 | growthtype | tinyint(3) unsigned | NO |  |
| 33 | race_val | smallint(5) unsigned | NO |  |
| 34 | ign_att_cnt | tinyint(3) unsigned | YES |  |
| 35 | add_defense_cnt | tinyint(3) unsigned | NO |  |
| 36 | enchant_grade | tinyint(3) | YES |  |
| 37 | item_slot_total | tinyint(3) unsigned | NO |  |
| 38 | item_idx_0 | smallint(5) unsigned | NO |  |
| 39 | item_serial_0 | bigint(20) unsigned | NO |  |
| 40 | item_duration_0 | int(10) unsigned | NO |  |
| 41 | item_idx_1 | smallint(5) unsigned | NO |  |
| 42 | item_serial_1 | bigint(20) unsigned | NO |  |
| 43 | item_duration_1 | int(10) unsigned | NO |  |
| 44 | item_idx_2 | smallint(5) unsigned | NO |  |
| 45 | item_serial_2 | bigint(20) unsigned | NO |  |
| 46 | item_duration_2 | int(10) unsigned | NO |  |
| 47 | duration | int(10) unsigned | YES |  |
| 48 | last_check_time | datetime | NO |  |

### `u_hench_1` (6 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | hero_order | tinyint(3) unsigned | NO |  |
| 3 | serial | bigint(20) unsigned | NO |  |
| 4 | position | tinyint(3) unsigned | NO |  |
| 5 | hench_order | tinyint(3) unsigned | NO |  |
| 6 | monster_type | smallint(5) unsigned | NO |  |
| 7 | name | varchar(24) | NO |  |
| 8 | sex | tinyint(3) unsigned | NO |  |
| 9 | state | tinyint(3) unsigned | NO |  |
| 10 | mixnum | smallint(5) unsigned | NO |  |
| 11 | baselevel | smallint(5) unsigned | NO |  |
| 12 | max_baselevel | smallint(3) unsigned | NO |  |
| 13 | exp | bigint(20) unsigned | NO |  |
| 14 | speed_move | tinyint(3) unsigned | NO |  |
| 15 | speed_attack | smallint(5) unsigned | NO |  |
| 16 | speed_skill | smallint(5) unsigned | NO |  |
| 17 | str | smallint(5) unsigned | NO |  |
| 18 | dex | smallint(5) unsigned | NO |  |
| 19 | aim | smallint(5) unsigned | NO |  |
| 20 | luck | smallint(5) unsigned | NO |  |
| 21 | ap | smallint(5) unsigned | NO |  |
| 22 | dp | smallint(5) unsigned | NO |  |
| 23 | hc | smallint(5) unsigned | NO |  |
| 24 | hd | smallint(5) unsigned | NO |  |
| 25 | hp | smallint(5) unsigned | NO |  |
| 26 | mp | smallint(5) unsigned | NO |  |
| 27 | maxhp | smallint(5) unsigned | NO |  |
| 28 | maxmp | smallint(5) unsigned | NO |  |
| 29 | item0 | int(10) unsigned | NO |  |
| 30 | item1 | int(10) unsigned | NO |  |
| 31 | item2 | int(10) unsigned | NO |  |
| 32 | growthtype | tinyint(3) unsigned | NO |  |
| 33 | race_val | smallint(5) unsigned | NO |  |
| 34 | ign_att_cnt | tinyint(3) unsigned | YES |  |
| 35 | add_defense_cnt | tinyint(3) unsigned | NO |  |
| 36 | enchant_grade | tinyint(3) | YES |  |
| 37 | item_slot_total | tinyint(3) unsigned | NO |  |
| 38 | item_idx_0 | smallint(5) unsigned | NO |  |
| 39 | item_serial_0 | bigint(20) unsigned | NO |  |
| 40 | item_duration_0 | int(10) unsigned | NO |  |
| 41 | item_idx_1 | smallint(5) unsigned | NO |  |
| 42 | item_serial_1 | bigint(20) unsigned | NO |  |
| 43 | item_duration_1 | int(10) unsigned | NO |  |
| 44 | item_idx_2 | smallint(5) unsigned | NO |  |
| 45 | item_serial_2 | bigint(20) unsigned | NO |  |
| 46 | item_duration_2 | int(10) unsigned | NO |  |
| 47 | duration | int(10) unsigned | YES |  |
| 48 | last_check_time | datetime | NO |  |

### `u_hench_2` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | hero_order | tinyint(3) unsigned | NO |  |
| 3 | serial | bigint(20) unsigned | NO |  |
| 4 | position | tinyint(3) unsigned | NO |  |
| 5 | hench_order | tinyint(3) unsigned | NO |  |
| 6 | monster_type | smallint(5) unsigned | NO |  |
| 7 | name | varchar(24) | NO |  |
| 8 | sex | tinyint(3) unsigned | NO |  |
| 9 | state | tinyint(3) unsigned | NO |  |
| 10 | mixnum | smallint(5) unsigned | NO |  |
| 11 | baselevel | smallint(5) unsigned | NO |  |
| 12 | max_baselevel | smallint(3) unsigned | NO |  |
| 13 | exp | bigint(20) unsigned | NO |  |
| 14 | speed_move | tinyint(3) unsigned | NO |  |
| 15 | speed_attack | smallint(5) unsigned | NO |  |
| 16 | speed_skill | smallint(5) unsigned | NO |  |
| 17 | str | smallint(5) unsigned | NO |  |
| 18 | dex | smallint(5) unsigned | NO |  |
| 19 | aim | smallint(5) unsigned | NO |  |
| 20 | luck | smallint(5) unsigned | NO |  |
| 21 | ap | smallint(5) unsigned | NO |  |
| 22 | dp | smallint(5) unsigned | NO |  |
| 23 | hc | smallint(5) unsigned | NO |  |
| 24 | hd | smallint(5) unsigned | NO |  |
| 25 | hp | smallint(5) unsigned | NO |  |
| 26 | mp | smallint(5) unsigned | NO |  |
| 27 | maxhp | smallint(5) unsigned | NO |  |
| 28 | maxmp | smallint(5) unsigned | NO |  |
| 29 | item0 | int(10) unsigned | NO |  |
| 30 | item1 | int(10) unsigned | NO |  |
| 31 | item2 | int(10) unsigned | NO |  |
| 32 | growthtype | tinyint(3) unsigned | NO |  |
| 33 | race_val | smallint(5) unsigned | NO |  |
| 34 | ign_att_cnt | tinyint(3) unsigned | YES |  |
| 35 | add_defense_cnt | tinyint(3) unsigned | NO |  |
| 36 | enchant_grade | tinyint(3) | YES |  |
| 37 | item_slot_total | tinyint(3) unsigned | NO |  |
| 38 | item_idx_0 | smallint(5) unsigned | NO |  |
| 39 | item_serial_0 | bigint(20) unsigned | NO |  |
| 40 | item_duration_0 | int(10) unsigned | NO |  |
| 41 | item_idx_1 | smallint(5) unsigned | NO |  |
| 42 | item_serial_1 | bigint(20) unsigned | NO |  |
| 43 | item_duration_1 | int(10) unsigned | NO |  |
| 44 | item_idx_2 | smallint(5) unsigned | NO |  |
| 45 | item_serial_2 | bigint(20) unsigned | NO |  |
| 46 | item_duration_2 | int(10) unsigned | NO |  |
| 47 | duration | int(10) unsigned | YES |  |
| 48 | last_check_time | datetime | NO |  |

### `u_hench_3` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | hero_order | tinyint(3) unsigned | NO |  |
| 3 | serial | bigint(20) unsigned | NO |  |
| 4 | position | tinyint(3) unsigned | NO |  |
| 5 | hench_order | tinyint(3) unsigned | NO |  |
| 6 | monster_type | smallint(5) unsigned | NO |  |
| 7 | name | varchar(24) | NO |  |
| 8 | sex | tinyint(3) unsigned | NO |  |
| 9 | state | tinyint(3) unsigned | NO |  |
| 10 | mixnum | smallint(5) unsigned | NO |  |
| 11 | baselevel | smallint(5) unsigned | NO |  |
| 12 | max_baselevel | smallint(3) unsigned | NO |  |
| 13 | exp | bigint(20) unsigned | NO |  |
| 14 | speed_move | tinyint(3) unsigned | NO |  |
| 15 | speed_attack | smallint(5) unsigned | NO |  |
| 16 | speed_skill | smallint(5) unsigned | NO |  |
| 17 | str | smallint(5) unsigned | NO |  |
| 18 | dex | smallint(5) unsigned | NO |  |
| 19 | aim | smallint(5) unsigned | NO |  |
| 20 | luck | smallint(5) unsigned | NO |  |
| 21 | ap | smallint(5) unsigned | NO |  |
| 22 | dp | smallint(5) unsigned | NO |  |
| 23 | hc | smallint(5) unsigned | NO |  |
| 24 | hd | smallint(5) unsigned | NO |  |
| 25 | hp | smallint(5) unsigned | NO |  |
| 26 | mp | smallint(5) unsigned | NO |  |
| 27 | maxhp | smallint(5) unsigned | NO |  |
| 28 | maxmp | smallint(5) unsigned | NO |  |
| 29 | item0 | int(10) unsigned | NO |  |
| 30 | item1 | int(10) unsigned | NO |  |
| 31 | item2 | int(10) unsigned | NO |  |
| 32 | growthtype | tinyint(3) unsigned | NO |  |
| 33 | race_val | smallint(5) unsigned | NO |  |
| 34 | ign_att_cnt | tinyint(3) unsigned | YES |  |
| 35 | add_defense_cnt | tinyint(3) unsigned | NO |  |
| 36 | enchant_grade | tinyint(3) | YES |  |
| 37 | item_slot_total | tinyint(3) unsigned | NO |  |
| 38 | item_idx_0 | smallint(5) unsigned | NO |  |
| 39 | item_serial_0 | bigint(20) unsigned | NO |  |
| 40 | item_duration_0 | int(10) unsigned | NO |  |
| 41 | item_idx_1 | smallint(5) unsigned | NO |  |
| 42 | item_serial_1 | bigint(20) unsigned | NO |  |
| 43 | item_duration_1 | int(10) unsigned | NO |  |
| 44 | item_idx_2 | smallint(5) unsigned | NO |  |
| 45 | item_serial_2 | bigint(20) unsigned | NO |  |
| 46 | item_duration_2 | int(10) unsigned | NO |  |
| 47 | duration | int(10) unsigned | YES |  |
| 48 | last_check_time | datetime | NO |  |

### `u_hench_4` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | hero_order | tinyint(3) unsigned | NO |  |
| 3 | serial | bigint(20) unsigned | NO |  |
| 4 | position | tinyint(3) unsigned | NO |  |
| 5 | hench_order | tinyint(3) unsigned | NO |  |
| 6 | monster_type | smallint(5) unsigned | NO |  |
| 7 | name | varchar(24) | NO |  |
| 8 | sex | tinyint(3) unsigned | NO |  |
| 9 | state | tinyint(3) unsigned | NO |  |
| 10 | mixnum | smallint(5) unsigned | NO |  |
| 11 | baselevel | smallint(5) unsigned | NO |  |
| 12 | max_baselevel | smallint(3) unsigned | NO |  |
| 13 | exp | bigint(20) unsigned | NO |  |
| 14 | speed_move | tinyint(3) unsigned | NO |  |
| 15 | speed_attack | smallint(5) unsigned | NO |  |
| 16 | speed_skill | smallint(5) unsigned | NO |  |
| 17 | str | smallint(5) unsigned | NO |  |
| 18 | dex | smallint(5) unsigned | NO |  |
| 19 | aim | smallint(5) unsigned | NO |  |
| 20 | luck | smallint(5) unsigned | NO |  |
| 21 | ap | smallint(5) unsigned | NO |  |
| 22 | dp | smallint(5) unsigned | NO |  |
| 23 | hc | smallint(5) unsigned | NO |  |
| 24 | hd | smallint(5) unsigned | NO |  |
| 25 | hp | smallint(5) unsigned | NO |  |
| 26 | mp | smallint(5) unsigned | NO |  |
| 27 | maxhp | smallint(5) unsigned | NO |  |
| 28 | maxmp | smallint(5) unsigned | NO |  |
| 29 | item0 | int(10) unsigned | NO |  |
| 30 | item1 | int(10) unsigned | NO |  |
| 31 | item2 | int(10) unsigned | NO |  |
| 32 | growthtype | tinyint(3) unsigned | NO |  |
| 33 | race_val | smallint(5) unsigned | NO |  |
| 34 | ign_att_cnt | tinyint(3) unsigned | YES |  |
| 35 | add_defense_cnt | tinyint(3) unsigned | NO |  |
| 36 | enchant_grade | tinyint(3) | YES |  |
| 37 | item_slot_total | tinyint(3) unsigned | NO |  |
| 38 | item_idx_0 | smallint(5) unsigned | NO |  |
| 39 | item_serial_0 | bigint(20) unsigned | NO |  |
| 40 | item_duration_0 | int(10) unsigned | NO |  |
| 41 | item_idx_1 | smallint(5) unsigned | NO |  |
| 42 | item_serial_1 | bigint(20) unsigned | NO |  |
| 43 | item_duration_1 | int(10) unsigned | NO |  |
| 44 | item_idx_2 | smallint(5) unsigned | NO |  |
| 45 | item_serial_2 | bigint(20) unsigned | NO |  |
| 46 | item_duration_2 | int(10) unsigned | NO |  |
| 47 | duration | int(10) unsigned | YES |  |
| 48 | last_check_time | datetime | NO |  |

### `u_hench_5` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | hero_order | tinyint(3) unsigned | NO |  |
| 3 | serial | bigint(20) unsigned | NO |  |
| 4 | position | tinyint(3) unsigned | NO |  |
| 5 | hench_order | tinyint(3) unsigned | NO |  |
| 6 | monster_type | smallint(5) unsigned | NO |  |
| 7 | name | varchar(24) | NO |  |
| 8 | sex | tinyint(3) unsigned | NO |  |
| 9 | state | tinyint(3) unsigned | NO |  |
| 10 | mixnum | smallint(5) unsigned | NO |  |
| 11 | baselevel | smallint(5) unsigned | NO |  |
| 12 | max_baselevel | smallint(3) unsigned | NO |  |
| 13 | exp | bigint(20) unsigned | NO |  |
| 14 | speed_move | tinyint(3) unsigned | NO |  |
| 15 | speed_attack | smallint(5) unsigned | NO |  |
| 16 | speed_skill | smallint(5) unsigned | NO |  |
| 17 | str | smallint(5) unsigned | NO |  |
| 18 | dex | smallint(5) unsigned | NO |  |
| 19 | aim | smallint(5) unsigned | NO |  |
| 20 | luck | smallint(5) unsigned | NO |  |
| 21 | ap | smallint(5) unsigned | NO |  |
| 22 | dp | smallint(5) unsigned | NO |  |
| 23 | hc | smallint(5) unsigned | NO |  |
| 24 | hd | smallint(5) unsigned | NO |  |
| 25 | hp | smallint(5) unsigned | NO |  |
| 26 | mp | smallint(5) unsigned | NO |  |
| 27 | maxhp | smallint(5) unsigned | NO |  |
| 28 | maxmp | smallint(5) unsigned | NO |  |
| 29 | item0 | int(10) unsigned | NO |  |
| 30 | item1 | int(10) unsigned | NO |  |
| 31 | item2 | int(10) unsigned | NO |  |
| 32 | growthtype | tinyint(3) unsigned | NO |  |
| 33 | race_val | smallint(5) unsigned | NO |  |
| 34 | ign_att_cnt | tinyint(3) unsigned | YES |  |
| 35 | add_defense_cnt | tinyint(3) unsigned | NO |  |
| 36 | enchant_grade | tinyint(3) | YES |  |
| 37 | item_slot_total | tinyint(3) unsigned | NO |  |
| 38 | item_idx_0 | smallint(5) unsigned | NO |  |
| 39 | item_serial_0 | bigint(20) unsigned | NO |  |
| 40 | item_duration_0 | int(10) unsigned | NO |  |
| 41 | item_idx_1 | smallint(5) unsigned | NO |  |
| 42 | item_serial_1 | bigint(20) unsigned | NO |  |
| 43 | item_duration_1 | int(10) unsigned | NO |  |
| 44 | item_idx_2 | smallint(5) unsigned | NO |  |
| 45 | item_serial_2 | bigint(20) unsigned | NO |  |
| 46 | item_duration_2 | int(10) unsigned | NO |  |
| 47 | duration | int(10) unsigned | YES |  |
| 48 | last_check_time | datetime | NO |  |

### `u_hench_6` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | hero_order | tinyint(3) unsigned | NO |  |
| 3 | serial | bigint(20) unsigned | NO |  |
| 4 | position | tinyint(3) unsigned | NO |  |
| 5 | hench_order | tinyint(3) unsigned | NO |  |
| 6 | monster_type | smallint(5) unsigned | NO |  |
| 7 | name | varchar(24) | NO |  |
| 8 | sex | tinyint(3) unsigned | NO |  |
| 9 | state | tinyint(3) unsigned | NO |  |
| 10 | mixnum | smallint(5) unsigned | NO |  |
| 11 | baselevel | smallint(5) unsigned | NO |  |
| 12 | max_baselevel | smallint(3) unsigned | NO |  |
| 13 | exp | bigint(20) unsigned | NO |  |
| 14 | speed_move | tinyint(3) unsigned | NO |  |
| 15 | speed_attack | smallint(5) unsigned | NO |  |
| 16 | speed_skill | smallint(5) unsigned | NO |  |
| 17 | str | smallint(5) unsigned | NO |  |
| 18 | dex | smallint(5) unsigned | NO |  |
| 19 | aim | smallint(5) unsigned | NO |  |
| 20 | luck | smallint(5) unsigned | NO |  |
| 21 | ap | smallint(5) unsigned | NO |  |
| 22 | dp | smallint(5) unsigned | NO |  |
| 23 | hc | smallint(5) unsigned | NO |  |
| 24 | hd | smallint(5) unsigned | NO |  |
| 25 | hp | smallint(5) unsigned | NO |  |
| 26 | mp | smallint(5) unsigned | NO |  |
| 27 | maxhp | smallint(5) unsigned | NO |  |
| 28 | maxmp | smallint(5) unsigned | NO |  |
| 29 | item0 | int(10) unsigned | NO |  |
| 30 | item1 | int(10) unsigned | NO |  |
| 31 | item2 | int(10) unsigned | NO |  |
| 32 | growthtype | tinyint(3) unsigned | NO |  |
| 33 | race_val | smallint(5) unsigned | NO |  |
| 34 | ign_att_cnt | tinyint(3) unsigned | YES |  |
| 35 | add_defense_cnt | tinyint(3) unsigned | NO |  |
| 36 | enchant_grade | tinyint(3) | YES |  |
| 37 | item_slot_total | tinyint(3) unsigned | NO |  |
| 38 | item_idx_0 | smallint(5) unsigned | NO |  |
| 39 | item_serial_0 | bigint(20) unsigned | NO |  |
| 40 | item_duration_0 | int(10) unsigned | NO |  |
| 41 | item_idx_1 | smallint(5) unsigned | NO |  |
| 42 | item_serial_1 | bigint(20) unsigned | NO |  |
| 43 | item_duration_1 | int(10) unsigned | NO |  |
| 44 | item_idx_2 | smallint(5) unsigned | NO |  |
| 45 | item_serial_2 | bigint(20) unsigned | NO |  |
| 46 | item_duration_2 | int(10) unsigned | NO |  |
| 47 | duration | int(10) unsigned | YES |  |
| 48 | last_check_time | datetime | NO |  |

### `u_hench_7` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | hero_order | tinyint(3) unsigned | NO |  |
| 3 | serial | bigint(20) unsigned | NO |  |
| 4 | position | tinyint(3) unsigned | NO |  |
| 5 | hench_order | tinyint(3) unsigned | NO |  |
| 6 | monster_type | smallint(5) unsigned | NO |  |
| 7 | name | varchar(24) | NO |  |
| 8 | sex | tinyint(3) unsigned | NO |  |
| 9 | state | tinyint(3) unsigned | NO |  |
| 10 | mixnum | smallint(5) unsigned | NO |  |
| 11 | baselevel | smallint(5) unsigned | NO |  |
| 12 | max_baselevel | smallint(3) unsigned | NO |  |
| 13 | exp | bigint(20) unsigned | NO |  |
| 14 | speed_move | tinyint(3) unsigned | NO |  |
| 15 | speed_attack | smallint(5) unsigned | NO |  |
| 16 | speed_skill | smallint(5) unsigned | NO |  |
| 17 | str | smallint(5) unsigned | NO |  |
| 18 | dex | smallint(5) unsigned | NO |  |
| 19 | aim | smallint(5) unsigned | NO |  |
| 20 | luck | smallint(5) unsigned | NO |  |
| 21 | ap | smallint(5) unsigned | NO |  |
| 22 | dp | smallint(5) unsigned | NO |  |
| 23 | hc | smallint(5) unsigned | NO |  |
| 24 | hd | smallint(5) unsigned | NO |  |
| 25 | hp | smallint(5) unsigned | NO |  |
| 26 | mp | smallint(5) unsigned | NO |  |
| 27 | maxhp | smallint(5) unsigned | NO |  |
| 28 | maxmp | smallint(5) unsigned | NO |  |
| 29 | item0 | int(10) unsigned | NO |  |
| 30 | item1 | int(10) unsigned | NO |  |
| 31 | item2 | int(10) unsigned | NO |  |
| 32 | growthtype | tinyint(3) unsigned | NO |  |
| 33 | race_val | smallint(5) unsigned | NO |  |
| 34 | ign_att_cnt | tinyint(3) unsigned | YES |  |
| 35 | add_defense_cnt | tinyint(3) unsigned | NO |  |
| 36 | enchant_grade | tinyint(3) | YES |  |
| 37 | item_slot_total | tinyint(3) unsigned | NO |  |
| 38 | item_idx_0 | smallint(5) unsigned | NO |  |
| 39 | item_serial_0 | bigint(20) unsigned | NO |  |
| 40 | item_duration_0 | int(10) unsigned | NO |  |
| 41 | item_idx_1 | smallint(5) unsigned | NO |  |
| 42 | item_serial_1 | bigint(20) unsigned | NO |  |
| 43 | item_duration_1 | int(10) unsigned | NO |  |
| 44 | item_idx_2 | smallint(5) unsigned | NO |  |
| 45 | item_serial_2 | bigint(20) unsigned | NO |  |
| 46 | item_duration_2 | int(10) unsigned | NO |  |
| 47 | duration | int(10) unsigned | YES |  |
| 48 | last_check_time | datetime | NO |  |

### `u_hench_8` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | hero_order | tinyint(3) unsigned | NO |  |
| 3 | serial | bigint(20) unsigned | NO |  |
| 4 | position | tinyint(3) unsigned | NO |  |
| 5 | hench_order | tinyint(3) unsigned | NO |  |
| 6 | monster_type | smallint(5) unsigned | NO |  |
| 7 | name | varchar(24) | NO |  |
| 8 | sex | tinyint(3) unsigned | NO |  |
| 9 | state | tinyint(3) unsigned | NO |  |
| 10 | mixnum | smallint(5) unsigned | NO |  |
| 11 | baselevel | smallint(5) unsigned | NO |  |
| 12 | max_baselevel | smallint(3) unsigned | NO |  |
| 13 | exp | bigint(20) unsigned | NO |  |
| 14 | speed_move | tinyint(3) unsigned | NO |  |
| 15 | speed_attack | smallint(5) unsigned | NO |  |
| 16 | speed_skill | smallint(5) unsigned | NO |  |
| 17 | str | smallint(5) unsigned | NO |  |
| 18 | dex | smallint(5) unsigned | NO |  |
| 19 | aim | smallint(5) unsigned | NO |  |
| 20 | luck | smallint(5) unsigned | NO |  |
| 21 | ap | smallint(5) unsigned | NO |  |
| 22 | dp | smallint(5) unsigned | NO |  |
| 23 | hc | smallint(5) unsigned | NO |  |
| 24 | hd | smallint(5) unsigned | NO |  |
| 25 | hp | smallint(5) unsigned | NO |  |
| 26 | mp | smallint(5) unsigned | NO |  |
| 27 | maxhp | smallint(5) unsigned | NO |  |
| 28 | maxmp | smallint(5) unsigned | NO |  |
| 29 | item0 | int(10) unsigned | NO |  |
| 30 | item1 | int(10) unsigned | NO |  |
| 31 | item2 | int(10) unsigned | NO |  |
| 32 | growthtype | tinyint(3) unsigned | NO |  |
| 33 | race_val | smallint(5) unsigned | NO |  |
| 34 | ign_att_cnt | tinyint(3) unsigned | YES |  |
| 35 | add_defense_cnt | tinyint(3) unsigned | NO |  |
| 36 | enchant_grade | tinyint(3) | YES |  |
| 37 | item_slot_total | tinyint(3) unsigned | NO |  |
| 38 | item_idx_0 | smallint(5) unsigned | NO |  |
| 39 | item_serial_0 | bigint(20) unsigned | NO |  |
| 40 | item_duration_0 | int(10) unsigned | NO |  |
| 41 | item_idx_1 | smallint(5) unsigned | NO |  |
| 42 | item_serial_1 | bigint(20) unsigned | NO |  |
| 43 | item_duration_1 | int(10) unsigned | NO |  |
| 44 | item_idx_2 | smallint(5) unsigned | NO |  |
| 45 | item_serial_2 | bigint(20) unsigned | NO |  |
| 46 | item_duration_2 | int(10) unsigned | NO |  |
| 47 | duration | int(10) unsigned | YES |  |
| 48 | last_check_time | datetime | NO |  |

### `u_hench_9` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | hero_order | tinyint(3) unsigned | NO |  |
| 3 | serial | bigint(20) unsigned | NO |  |
| 4 | position | tinyint(3) unsigned | NO |  |
| 5 | hench_order | tinyint(3) unsigned | NO |  |
| 6 | monster_type | smallint(5) unsigned | NO |  |
| 7 | name | varchar(24) | NO |  |
| 8 | sex | tinyint(3) unsigned | NO |  |
| 9 | state | tinyint(3) unsigned | NO |  |
| 10 | mixnum | smallint(5) unsigned | NO |  |
| 11 | baselevel | smallint(5) unsigned | NO |  |
| 12 | max_baselevel | smallint(3) unsigned | NO |  |
| 13 | exp | bigint(20) unsigned | NO |  |
| 14 | speed_move | tinyint(3) unsigned | NO |  |
| 15 | speed_attack | smallint(5) unsigned | NO |  |
| 16 | speed_skill | smallint(5) unsigned | NO |  |
| 17 | str | smallint(5) unsigned | NO |  |
| 18 | dex | smallint(5) unsigned | NO |  |
| 19 | aim | smallint(5) unsigned | NO |  |
| 20 | luck | smallint(5) unsigned | NO |  |
| 21 | ap | smallint(5) unsigned | NO |  |
| 22 | dp | smallint(5) unsigned | NO |  |
| 23 | hc | smallint(5) unsigned | NO |  |
| 24 | hd | smallint(5) unsigned | NO |  |
| 25 | hp | smallint(5) unsigned | NO |  |
| 26 | mp | smallint(5) unsigned | NO |  |
| 27 | maxhp | smallint(5) unsigned | NO |  |
| 28 | maxmp | smallint(5) unsigned | NO |  |
| 29 | item0 | int(10) unsigned | NO |  |
| 30 | item1 | int(10) unsigned | NO |  |
| 31 | item2 | int(10) unsigned | NO |  |
| 32 | growthtype | tinyint(3) unsigned | NO |  |
| 33 | race_val | smallint(5) unsigned | NO |  |
| 34 | ign_att_cnt | tinyint(3) unsigned | YES |  |
| 35 | add_defense_cnt | tinyint(3) unsigned | NO |  |
| 36 | enchant_grade | tinyint(3) | YES |  |
| 37 | item_slot_total | tinyint(3) unsigned | NO |  |
| 38 | item_idx_0 | smallint(5) unsigned | NO |  |
| 39 | item_serial_0 | bigint(20) unsigned | NO |  |
| 40 | item_duration_0 | int(10) unsigned | NO |  |
| 41 | item_idx_1 | smallint(5) unsigned | NO |  |
| 42 | item_serial_1 | bigint(20) unsigned | NO |  |
| 43 | item_duration_1 | int(10) unsigned | NO |  |
| 44 | item_idx_2 | smallint(5) unsigned | NO |  |
| 45 | item_serial_2 | bigint(20) unsigned | NO |  |
| 46 | item_duration_2 | int(10) unsigned | NO |  |
| 47 | duration | int(10) unsigned | YES |  |
| 48 | last_check_time | datetime | NO |  |

### `u_hero` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | PRI |
| 2 | hero_order | tinyint(3) unsigned | NO | PRI |
| 3 | serial | bigint(20) unsigned | NO |  |
| 4 | class | tinyint(3) unsigned | NO |  |
| 5 | name | varchar(12) | NO | MUL |
| 6 | hero_type | tinyint(3) unsigned | NO |  |
| 7 | now_zone_idx | smallint(5) unsigned | NO |  |
| 8 | now_zone_x | tinyint(3) unsigned | NO |  |
| 9 | now_zone_y | tinyint(3) unsigned | NO |  |
| 10 | init_pos_layer | smallint(5) unsigned | NO |  |
| 11 | revive_zone_idx | smallint(5) unsigned | NO |  |
| 12 | baselevel | smallint(5) unsigned | NO |  |
| 13 | gold | int(10) unsigned | NO |  |
| 14 | attr | int(10) unsigned | NO |  |
| 15 | exp | bigint(20) unsigned | NO |  |
| 16 | speed_move | tinyint(3) unsigned | NO |  |
| 17 | speed_attack | smallint(5) unsigned | NO |  |
| 18 | speed_skill | smallint(5) unsigned | NO |  |
| 19 | str | smallint(5) unsigned | NO |  |
| 20 | dex | smallint(5) unsigned | NO |  |
| 21 | aim | smallint(5) unsigned | NO |  |
| 22 | luck | smallint(6) unsigned | NO |  |
| 23 | ap | smallint(5) unsigned | NO |  |
| 24 | dp | smallint(5) unsigned | NO |  |
| 25 | hc | smallint(5) unsigned | NO |  |
| 26 | hd | smallint(5) unsigned | NO |  |
| 27 | hp | smallint(5) unsigned | NO |  |
| 28 | mp | smallint(5) unsigned | NO |  |
| 29 | maxhp | smallint(5) unsigned | NO |  |
| 30 | maxmp | smallint(5) unsigned | NO |  |
| 31 | abil_freepoint | smallint(5) unsigned | NO |  |
| 32 | res_fire | smallint(5) unsigned | NO |  |
| 33 | res_water | smallint(5) unsigned | NO |  |
| 34 | res_earth | smallint(5) unsigned | NO |  |
| 35 | res_wind | smallint(5) unsigned | NO |  |
| 36 | res_devil | smallint(5) unsigned | NO |  |
| 37 | ign_att_cnt | tinyint(3) unsigned | YES |  |
| 38 | regdate | datetime | NO |  |
| 39 | avatar_head | smallint(5) unsigned | YES |  |
| 40 | avatar_body | smallint(5) unsigned | YES |  |
| 41 | avatar_foot | smallint(5) unsigned | YES |  |
| 42 | return_time | int(10) unsigned | YES |  |
| 43 | status | tinyint(3) unsigned | YES |  |
| 44 | status_time | datetime | NO |  |
| 45 | nickname | smallint(5) unsigned | NO |  |
| 46 | last_logout_time | datetime | NO |  |
| 47 | skill_point | smallint(5) unsigned | NO |  |
| 48 | login | tinyint(1) unsigned | NO |  |
| 49 | limit_zone_idx | smallint(5) unsigned | NO |  |
| 50 | requestname | smallint(5) unsigned | NO |  |

### `u_hero_event` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | PRI |
| 2 | hero_order | tinyint(3) unsigned | NO | PRI |
| 3 | event_no | int(10) unsigned | YES |  |

### `u_hero_quest` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | hero_order | tinyint(3) unsigned | NO |  |
| 3 | switch_number | smallint(5) unsigned | NO |  |
| 4 | success_count | smallint(5) unsigned | YES |  |
| 5 | success_time | datetime | NO |  |

### `u_item` (13 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | hero_order | tinyint(3) unsigned | NO |  |
| 3 | serial | bigint(20) unsigned | NO |  |
| 4 | item_idx | int(10) unsigned | NO |  |
| 5 | socket_type | tinyint(3) unsigned | NO |  |
| 6 | socket_num | tinyint(3) unsigned | NO |  |
| 7 | count | smallint(5) unsigned | NO |  |
| 8 | opt | tinyint(3) unsigned | NO |  |
| 9 | opt_level | tinyint(3) unsigned | NO |  |
| 10 | duration | int(10) unsigned | YES |  |
| 11 | last_check_time | datetime | NO |  |
| 12 | synergy | tinyint(3) unsigned | YES |  |
| 13 | synergy_level | tinyint(3) unsigned | YES |  |

### `u_messenger` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | HeroIdx | int(10) unsigned | NO | PRI |
| 2 | HeroOrder | tinyint(3) unsigned | NO | PRI |
| 3 | TargetHeroIdx | int(10) unsigned | NO | PRI |
| 4 | TargetHeroOrder | tinyint(3) unsigned | NO | PRI |
| 5 | Status | tinyint(3) unsigned | NO |  |
| 6 | MyState | tinyint(3) unsigned | NO |  |

### `u_skillstate` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) | NO |  |
| 2 | hero_order | tinyint(4) | NO |  |
| 3 | effect_idx | tinyint(4) | NO |  |
| 4 | SkillIdx | tinyint(4) | NO |  |
| 5 | EffectSkillTime | int(10) | NO |  |
| 6 | EffectValue | float | NO |  |
| 7 | EffectLevel | tinyint(4) | NO |  |

### `u_store` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | PRI |
| 2 | store_gold | int(10) unsigned | NO |  |
| 3 | store_state | tinyint(3) unsigned | NO |  |
| 4 | last_store_time | datetime | NO |  |

### `u_store_hench_0` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | serial | bigint(20) unsigned | NO |  |
| 3 | hench_order | tinyint(3) unsigned | NO |  |
| 4 | monster_type | smallint(5) unsigned | NO |  |
| 5 | name | char(12) | NO |  |
| 6 | sex | tinyint(3) unsigned | NO |  |
| 7 | state | tinyint(3) unsigned | NO |  |
| 8 | mixnum | smallint(5) unsigned | NO |  |
| 9 | baselevel | smallint(5) unsigned | NO |  |
| 10 | max_baselevel | tinyint(3) unsigned | NO |  |
| 11 | exp | bigint(20) unsigned | NO |  |
| 12 | speed_move | tinyint(3) unsigned | NO |  |
| 13 | speed_attack | smallint(5) unsigned | NO |  |
| 14 | speed_spell | smallint(5) unsigned | NO |  |
| 15 | str | smallint(5) unsigned | NO |  |
| 16 | dex | smallint(5) unsigned | NO |  |
| 17 | aim | smallint(5) unsigned | NO |  |
| 18 | luck | smallint(5) unsigned | NO |  |
| 19 | ap | smallint(5) unsigned | NO |  |
| 20 | dp | smallint(5) unsigned | NO |  |
| 21 | hc | smallint(5) unsigned | NO |  |
| 22 | hd | smallint(5) unsigned | NO |  |
| 23 | hp | smallint(5) unsigned | NO |  |
| 24 | mp | smallint(5) unsigned | NO |  |
| 25 | maxhp | smallint(5) unsigned | NO |  |
| 26 | maxmp | smallint(5) unsigned | NO |  |
| 27 | item0 | int(10) unsigned | NO |  |
| 28 | item1 | int(10) unsigned | NO |  |
| 29 | item2 | int(10) unsigned | NO |  |
| 30 | growthtype | tinyint(3) unsigned | NO |  |
| 31 | race_val | int(5) unsigned | NO |  |
| 32 | ign_att_cnt | tinyint(3) unsigned | NO |  |
| 33 | add_defense_cnt | tinyint(3) unsigned | NO |  |
| 34 | enchant_grade | tinyint(3) | YES |  |
| 35 | item_slot_total | tinyint(3) unsigned | NO |  |
| 36 | item_idx_0 | smallint(5) unsigned | NO |  |
| 37 | item_serial_0 | bigint(20) unsigned | NO |  |
| 38 | item_duration_0 | int(10) unsigned | NO |  |
| 39 | item_idx_1 | smallint(5) unsigned | NO |  |
| 40 | item_serial_1 | bigint(20) unsigned | NO |  |
| 41 | item_duration_1 | int(10) unsigned | NO |  |
| 42 | item_idx_2 | smallint(5) unsigned | NO |  |
| 43 | item_serial_2 | bigint(20) unsigned | NO |  |
| 44 | item_duration_2 | int(10) unsigned | NO |  |
| 45 | duration | int(10) unsigned | YES |  |
| 46 | last_check_time | datetime | NO |  |

### `u_store_hench_1` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | serial | bigint(20) unsigned | NO |  |
| 3 | hench_order | tinyint(3) unsigned | NO |  |
| 4 | monster_type | smallint(5) unsigned | NO |  |
| 5 | name | char(12) | NO |  |
| 6 | sex | tinyint(3) unsigned | NO |  |
| 7 | state | tinyint(3) unsigned | NO |  |
| 8 | mixnum | smallint(5) unsigned | NO |  |
| 9 | baselevel | smallint(5) unsigned | NO |  |
| 10 | max_baselevel | tinyint(3) unsigned | NO |  |
| 11 | exp | bigint(20) unsigned | NO |  |
| 12 | speed_move | tinyint(3) unsigned | NO |  |
| 13 | speed_attack | smallint(5) unsigned | NO |  |
| 14 | speed_spell | smallint(5) unsigned | NO |  |
| 15 | str | smallint(5) unsigned | NO |  |
| 16 | dex | smallint(5) unsigned | NO |  |
| 17 | aim | smallint(5) unsigned | NO |  |
| 18 | luck | smallint(5) unsigned | NO |  |
| 19 | ap | smallint(5) unsigned | NO |  |
| 20 | dp | smallint(5) unsigned | NO |  |
| 21 | hc | smallint(5) unsigned | NO |  |
| 22 | hd | smallint(5) unsigned | NO |  |
| 23 | hp | smallint(5) unsigned | NO |  |
| 24 | mp | smallint(5) unsigned | NO |  |
| 25 | maxhp | smallint(5) unsigned | NO |  |
| 26 | maxmp | smallint(5) unsigned | NO |  |
| 27 | item0 | int(10) unsigned | NO |  |
| 28 | item1 | int(10) unsigned | NO |  |
| 29 | item2 | int(10) unsigned | NO |  |
| 30 | growthtype | tinyint(3) unsigned | NO |  |
| 31 | race_val | int(5) unsigned | NO |  |
| 32 | ign_att_cnt | tinyint(3) unsigned | NO |  |
| 33 | add_defense_cnt | tinyint(3) unsigned | NO |  |
| 34 | enchant_grade | tinyint(3) | YES |  |
| 35 | item_slot_total | tinyint(3) unsigned | NO |  |
| 36 | item_idx_0 | smallint(5) unsigned | NO |  |
| 37 | item_serial_0 | bigint(20) unsigned | NO |  |
| 38 | item_duration_0 | int(10) unsigned | NO |  |
| 39 | item_idx_1 | smallint(5) unsigned | NO |  |
| 40 | item_serial_1 | bigint(20) unsigned | NO |  |
| 41 | item_duration_1 | int(10) unsigned | NO |  |
| 42 | item_idx_2 | smallint(5) unsigned | NO |  |
| 43 | item_serial_2 | bigint(20) unsigned | NO |  |
| 44 | item_duration_2 | int(10) unsigned | NO |  |
| 45 | duration | int(10) unsigned | YES |  |
| 46 | last_check_time | datetime | NO |  |

### `u_store_hench_2` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | serial | bigint(20) unsigned | NO |  |
| 3 | hench_order | tinyint(3) unsigned | NO |  |
| 4 | monster_type | smallint(5) unsigned | NO |  |
| 5 | name | char(12) | NO |  |
| 6 | sex | tinyint(3) unsigned | NO |  |
| 7 | state | tinyint(3) unsigned | NO |  |
| 8 | mixnum | smallint(5) unsigned | NO |  |
| 9 | baselevel | smallint(5) unsigned | NO |  |
| 10 | max_baselevel | tinyint(3) unsigned | NO |  |
| 11 | exp | bigint(20) unsigned | NO |  |
| 12 | speed_move | tinyint(3) unsigned | NO |  |
| 13 | speed_attack | smallint(5) unsigned | NO |  |
| 14 | speed_spell | smallint(5) unsigned | NO |  |
| 15 | str | smallint(5) unsigned | NO |  |
| 16 | dex | smallint(5) unsigned | NO |  |
| 17 | aim | smallint(5) unsigned | NO |  |
| 18 | luck | smallint(5) unsigned | NO |  |
| 19 | ap | smallint(5) unsigned | NO |  |
| 20 | dp | smallint(5) unsigned | NO |  |
| 21 | hc | smallint(5) unsigned | NO |  |
| 22 | hd | smallint(5) unsigned | NO |  |
| 23 | hp | smallint(5) unsigned | NO |  |
| 24 | mp | smallint(5) unsigned | NO |  |
| 25 | maxhp | smallint(5) unsigned | NO |  |
| 26 | maxmp | smallint(5) unsigned | NO |  |
| 27 | item0 | int(10) unsigned | NO |  |
| 28 | item1 | int(10) unsigned | NO |  |
| 29 | item2 | int(10) unsigned | NO |  |
| 30 | growthtype | tinyint(3) unsigned | NO |  |
| 31 | race_val | int(5) unsigned | NO |  |
| 32 | ign_att_cnt | tinyint(3) unsigned | NO |  |
| 33 | add_defense_cnt | tinyint(3) unsigned | NO |  |
| 34 | enchant_grade | tinyint(3) | YES |  |
| 35 | item_slot_total | tinyint(3) unsigned | NO |  |
| 36 | item_idx_0 | smallint(5) unsigned | NO |  |
| 37 | item_serial_0 | bigint(20) unsigned | NO |  |
| 38 | item_duration_0 | int(10) unsigned | NO |  |
| 39 | item_idx_1 | smallint(5) unsigned | NO |  |
| 40 | item_serial_1 | bigint(20) unsigned | NO |  |
| 41 | item_duration_1 | int(10) unsigned | NO |  |
| 42 | item_idx_2 | smallint(5) unsigned | NO |  |
| 43 | item_serial_2 | bigint(20) unsigned | NO |  |
| 44 | item_duration_2 | int(10) unsigned | NO |  |
| 45 | duration | int(10) unsigned | YES |  |
| 46 | last_check_time | datetime | NO |  |

### `u_store_hench_3` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | serial | bigint(20) unsigned | NO |  |
| 3 | hench_order | tinyint(3) unsigned | NO |  |
| 4 | monster_type | smallint(5) unsigned | NO |  |
| 5 | name | char(12) | NO |  |
| 6 | sex | tinyint(3) unsigned | NO |  |
| 7 | state | tinyint(3) unsigned | NO |  |
| 8 | mixnum | smallint(5) unsigned | NO |  |
| 9 | baselevel | smallint(5) unsigned | NO |  |
| 10 | max_baselevel | tinyint(3) unsigned | NO |  |
| 11 | exp | bigint(20) unsigned | NO |  |
| 12 | speed_move | tinyint(3) unsigned | NO |  |
| 13 | speed_attack | smallint(5) unsigned | NO |  |
| 14 | speed_spell | smallint(5) unsigned | NO |  |
| 15 | str | smallint(5) unsigned | NO |  |
| 16 | dex | smallint(5) unsigned | NO |  |
| 17 | aim | smallint(5) unsigned | NO |  |
| 18 | luck | smallint(5) unsigned | NO |  |
| 19 | ap | smallint(5) unsigned | NO |  |
| 20 | dp | smallint(5) unsigned | NO |  |
| 21 | hc | smallint(5) unsigned | NO |  |
| 22 | hd | smallint(5) unsigned | NO |  |
| 23 | hp | smallint(5) unsigned | NO |  |
| 24 | mp | smallint(5) unsigned | NO |  |
| 25 | maxhp | smallint(5) unsigned | NO |  |
| 26 | maxmp | smallint(5) unsigned | NO |  |
| 27 | item0 | int(10) unsigned | NO |  |
| 28 | item1 | int(10) unsigned | NO |  |
| 29 | item2 | int(10) unsigned | NO |  |
| 30 | growthtype | tinyint(3) unsigned | NO |  |
| 31 | race_val | int(5) unsigned | NO |  |
| 32 | ign_att_cnt | tinyint(3) unsigned | NO |  |
| 33 | add_defense_cnt | tinyint(3) unsigned | NO |  |
| 34 | enchant_grade | tinyint(3) | YES |  |
| 35 | item_slot_total | tinyint(3) unsigned | NO |  |
| 36 | item_idx_0 | smallint(5) unsigned | NO |  |
| 37 | item_serial_0 | bigint(20) unsigned | NO |  |
| 38 | item_duration_0 | int(10) unsigned | NO |  |
| 39 | item_idx_1 | smallint(5) unsigned | NO |  |
| 40 | item_serial_1 | bigint(20) unsigned | NO |  |
| 41 | item_duration_1 | int(10) unsigned | NO |  |
| 42 | item_idx_2 | smallint(5) unsigned | NO |  |
| 43 | item_serial_2 | bigint(20) unsigned | NO |  |
| 44 | item_duration_2 | int(10) unsigned | NO |  |
| 45 | duration | int(10) unsigned | YES |  |
| 46 | last_check_time | datetime | NO |  |

### `u_store_hench_4` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | serial | bigint(20) unsigned | NO |  |
| 3 | hench_order | tinyint(3) unsigned | NO |  |
| 4 | monster_type | smallint(5) unsigned | NO |  |
| 5 | name | char(12) | NO |  |
| 6 | sex | tinyint(3) unsigned | NO |  |
| 7 | state | tinyint(3) unsigned | NO |  |
| 8 | mixnum | smallint(5) unsigned | NO |  |
| 9 | baselevel | smallint(5) unsigned | NO |  |
| 10 | max_baselevel | tinyint(3) unsigned | NO |  |
| 11 | exp | bigint(20) unsigned | NO |  |
| 12 | speed_move | tinyint(3) unsigned | NO |  |
| 13 | speed_attack | smallint(5) unsigned | NO |  |
| 14 | speed_spell | smallint(5) unsigned | NO |  |
| 15 | str | smallint(5) unsigned | NO |  |
| 16 | dex | smallint(5) unsigned | NO |  |
| 17 | aim | smallint(5) unsigned | NO |  |
| 18 | luck | smallint(5) unsigned | NO |  |
| 19 | ap | smallint(5) unsigned | NO |  |
| 20 | dp | smallint(5) unsigned | NO |  |
| 21 | hc | smallint(5) unsigned | NO |  |
| 22 | hd | smallint(5) unsigned | NO |  |
| 23 | hp | smallint(5) unsigned | NO |  |
| 24 | mp | smallint(5) unsigned | NO |  |
| 25 | maxhp | smallint(5) unsigned | NO |  |
| 26 | maxmp | smallint(5) unsigned | NO |  |
| 27 | item0 | int(10) unsigned | NO |  |
| 28 | item1 | int(10) unsigned | NO |  |
| 29 | item2 | int(10) unsigned | NO |  |
| 30 | growthtype | tinyint(3) unsigned | NO |  |
| 31 | race_val | int(5) unsigned | NO |  |
| 32 | ign_att_cnt | tinyint(3) unsigned | NO |  |
| 33 | add_defense_cnt | tinyint(3) unsigned | NO |  |
| 34 | enchant_grade | tinyint(3) | YES |  |
| 35 | item_slot_total | tinyint(3) unsigned | NO |  |
| 36 | item_idx_0 | smallint(5) unsigned | NO |  |
| 37 | item_serial_0 | bigint(20) unsigned | NO |  |
| 38 | item_duration_0 | int(10) unsigned | NO |  |
| 39 | item_idx_1 | smallint(5) unsigned | NO |  |
| 40 | item_serial_1 | bigint(20) unsigned | NO |  |
| 41 | item_duration_1 | int(10) unsigned | NO |  |
| 42 | item_idx_2 | smallint(5) unsigned | NO |  |
| 43 | item_serial_2 | bigint(20) unsigned | NO |  |
| 44 | item_duration_2 | int(10) unsigned | NO |  |
| 45 | duration | int(10) unsigned | YES |  |
| 46 | last_check_time | datetime | NO |  |

### `u_store_hench_5` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | serial | bigint(20) unsigned | NO |  |
| 3 | hench_order | tinyint(3) unsigned | NO |  |
| 4 | monster_type | smallint(5) unsigned | NO |  |
| 5 | name | char(12) | NO |  |
| 6 | sex | tinyint(3) unsigned | NO |  |
| 7 | state | tinyint(3) unsigned | NO |  |
| 8 | mixnum | smallint(5) unsigned | NO |  |
| 9 | baselevel | smallint(5) unsigned | NO |  |
| 10 | max_baselevel | tinyint(3) unsigned | NO |  |
| 11 | exp | bigint(20) unsigned | NO |  |
| 12 | speed_move | tinyint(3) unsigned | NO |  |
| 13 | speed_attack | smallint(5) unsigned | NO |  |
| 14 | speed_spell | smallint(5) unsigned | NO |  |
| 15 | str | smallint(5) unsigned | NO |  |
| 16 | dex | smallint(5) unsigned | NO |  |
| 17 | aim | smallint(5) unsigned | NO |  |
| 18 | luck | smallint(5) unsigned | NO |  |
| 19 | ap | smallint(5) unsigned | NO |  |
| 20 | dp | smallint(5) unsigned | NO |  |
| 21 | hc | smallint(5) unsigned | NO |  |
| 22 | hd | smallint(5) unsigned | NO |  |
| 23 | hp | smallint(5) unsigned | NO |  |
| 24 | mp | smallint(5) unsigned | NO |  |
| 25 | maxhp | smallint(5) unsigned | NO |  |
| 26 | maxmp | smallint(5) unsigned | NO |  |
| 27 | item0 | int(10) unsigned | NO |  |
| 28 | item1 | int(10) unsigned | NO |  |
| 29 | item2 | int(10) unsigned | NO |  |
| 30 | growthtype | tinyint(3) unsigned | NO |  |
| 31 | race_val | int(5) unsigned | NO |  |
| 32 | ign_att_cnt | tinyint(3) unsigned | NO |  |
| 33 | add_defense_cnt | tinyint(3) unsigned | NO |  |
| 34 | enchant_grade | tinyint(3) | YES |  |
| 35 | item_slot_total | tinyint(3) unsigned | NO |  |
| 36 | item_idx_0 | smallint(5) unsigned | NO |  |
| 37 | item_serial_0 | bigint(20) unsigned | NO |  |
| 38 | item_duration_0 | int(10) unsigned | NO |  |
| 39 | item_idx_1 | smallint(5) unsigned | NO |  |
| 40 | item_serial_1 | bigint(20) unsigned | NO |  |
| 41 | item_duration_1 | int(10) unsigned | NO |  |
| 42 | item_idx_2 | smallint(5) unsigned | NO |  |
| 43 | item_serial_2 | bigint(20) unsigned | NO |  |
| 44 | item_duration_2 | int(10) unsigned | NO |  |
| 45 | duration | int(10) unsigned | YES |  |
| 46 | last_check_time | datetime | NO |  |

### `u_store_hench_6` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | serial | bigint(20) unsigned | NO |  |
| 3 | hench_order | tinyint(3) unsigned | NO |  |
| 4 | monster_type | smallint(5) unsigned | NO |  |
| 5 | name | char(12) | NO |  |
| 6 | sex | tinyint(3) unsigned | NO |  |
| 7 | state | tinyint(3) unsigned | NO |  |
| 8 | mixnum | smallint(5) unsigned | NO |  |
| 9 | baselevel | smallint(5) unsigned | NO |  |
| 10 | max_baselevel | tinyint(3) unsigned | NO |  |
| 11 | exp | bigint(20) unsigned | NO |  |
| 12 | speed_move | tinyint(3) unsigned | NO |  |
| 13 | speed_attack | smallint(5) unsigned | NO |  |
| 14 | speed_spell | smallint(5) unsigned | NO |  |
| 15 | str | smallint(5) unsigned | NO |  |
| 16 | dex | smallint(5) unsigned | NO |  |
| 17 | aim | smallint(5) unsigned | NO |  |
| 18 | luck | smallint(5) unsigned | NO |  |
| 19 | ap | smallint(5) unsigned | NO |  |
| 20 | dp | smallint(5) unsigned | NO |  |
| 21 | hc | smallint(5) unsigned | NO |  |
| 22 | hd | smallint(5) unsigned | NO |  |
| 23 | hp | smallint(5) unsigned | NO |  |
| 24 | mp | smallint(5) unsigned | NO |  |
| 25 | maxhp | smallint(5) unsigned | NO |  |
| 26 | maxmp | smallint(5) unsigned | NO |  |
| 27 | item0 | int(10) unsigned | NO |  |
| 28 | item1 | int(10) unsigned | NO |  |
| 29 | item2 | int(10) unsigned | NO |  |
| 30 | growthtype | tinyint(3) unsigned | NO |  |
| 31 | race_val | int(5) unsigned | NO |  |
| 32 | ign_att_cnt | tinyint(3) unsigned | NO |  |
| 33 | add_defense_cnt | tinyint(3) unsigned | NO |  |
| 34 | enchant_grade | tinyint(3) | YES |  |
| 35 | item_slot_total | tinyint(3) unsigned | NO |  |
| 36 | item_idx_0 | smallint(5) unsigned | NO |  |
| 37 | item_serial_0 | bigint(20) unsigned | NO |  |
| 38 | item_duration_0 | int(10) unsigned | NO |  |
| 39 | item_idx_1 | smallint(5) unsigned | NO |  |
| 40 | item_serial_1 | bigint(20) unsigned | NO |  |
| 41 | item_duration_1 | int(10) unsigned | NO |  |
| 42 | item_idx_2 | smallint(5) unsigned | NO |  |
| 43 | item_serial_2 | bigint(20) unsigned | NO |  |
| 44 | item_duration_2 | int(10) unsigned | NO |  |
| 45 | duration | int(10) unsigned | YES |  |
| 46 | last_check_time | datetime | NO |  |

### `u_store_hench_7` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | serial | bigint(20) unsigned | NO |  |
| 3 | hench_order | tinyint(3) unsigned | NO |  |
| 4 | monster_type | smallint(5) unsigned | NO |  |
| 5 | name | char(12) | NO |  |
| 6 | sex | tinyint(3) unsigned | NO |  |
| 7 | state | tinyint(3) unsigned | NO |  |
| 8 | mixnum | smallint(5) unsigned | NO |  |
| 9 | baselevel | smallint(5) unsigned | NO |  |
| 10 | max_baselevel | tinyint(3) unsigned | NO |  |
| 11 | exp | bigint(20) unsigned | NO |  |
| 12 | speed_move | tinyint(3) unsigned | NO |  |
| 13 | speed_attack | smallint(5) unsigned | NO |  |
| 14 | speed_spell | smallint(5) unsigned | NO |  |
| 15 | str | smallint(5) unsigned | NO |  |
| 16 | dex | smallint(5) unsigned | NO |  |
| 17 | aim | smallint(5) unsigned | NO |  |
| 18 | luck | smallint(5) unsigned | NO |  |
| 19 | ap | smallint(5) unsigned | NO |  |
| 20 | dp | smallint(5) unsigned | NO |  |
| 21 | hc | smallint(5) unsigned | NO |  |
| 22 | hd | smallint(5) unsigned | NO |  |
| 23 | hp | smallint(5) unsigned | NO |  |
| 24 | mp | smallint(5) unsigned | NO |  |
| 25 | maxhp | smallint(5) unsigned | NO |  |
| 26 | maxmp | smallint(5) unsigned | NO |  |
| 27 | item0 | int(10) unsigned | NO |  |
| 28 | item1 | int(10) unsigned | NO |  |
| 29 | item2 | int(10) unsigned | NO |  |
| 30 | growthtype | tinyint(3) unsigned | NO |  |
| 31 | race_val | int(5) unsigned | NO |  |
| 32 | ign_att_cnt | tinyint(3) unsigned | NO |  |
| 33 | add_defense_cnt | tinyint(3) unsigned | NO |  |
| 34 | enchant_grade | tinyint(3) | YES |  |
| 35 | item_slot_total | tinyint(3) unsigned | NO |  |
| 36 | item_idx_0 | smallint(5) unsigned | NO |  |
| 37 | item_serial_0 | bigint(20) unsigned | NO |  |
| 38 | item_duration_0 | int(10) unsigned | NO |  |
| 39 | item_idx_1 | smallint(5) unsigned | NO |  |
| 40 | item_serial_1 | bigint(20) unsigned | NO |  |
| 41 | item_duration_1 | int(10) unsigned | NO |  |
| 42 | item_idx_2 | smallint(5) unsigned | NO |  |
| 43 | item_serial_2 | bigint(20) unsigned | NO |  |
| 44 | item_duration_2 | int(10) unsigned | NO |  |
| 45 | duration | int(10) unsigned | YES |  |
| 46 | last_check_time | datetime | NO |  |

### `u_store_hench_8` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | serial | bigint(20) unsigned | NO |  |
| 3 | hench_order | tinyint(3) unsigned | NO |  |
| 4 | monster_type | smallint(5) unsigned | NO |  |
| 5 | name | char(12) | NO |  |
| 6 | sex | tinyint(3) unsigned | NO |  |
| 7 | state | tinyint(3) unsigned | NO |  |
| 8 | mixnum | smallint(5) unsigned | NO |  |
| 9 | baselevel | smallint(5) unsigned | NO |  |
| 10 | max_baselevel | tinyint(3) unsigned | NO |  |
| 11 | exp | bigint(20) unsigned | NO |  |
| 12 | speed_move | tinyint(3) unsigned | NO |  |
| 13 | speed_attack | smallint(5) unsigned | NO |  |
| 14 | speed_spell | smallint(5) unsigned | NO |  |
| 15 | str | smallint(5) unsigned | NO |  |
| 16 | dex | smallint(5) unsigned | NO |  |
| 17 | aim | smallint(5) unsigned | NO |  |
| 18 | luck | smallint(5) unsigned | NO |  |
| 19 | ap | smallint(5) unsigned | NO |  |
| 20 | dp | smallint(5) unsigned | NO |  |
| 21 | hc | smallint(5) unsigned | NO |  |
| 22 | hd | smallint(5) unsigned | NO |  |
| 23 | hp | smallint(5) unsigned | NO |  |
| 24 | mp | smallint(5) unsigned | NO |  |
| 25 | maxhp | smallint(5) unsigned | NO |  |
| 26 | maxmp | smallint(5) unsigned | NO |  |
| 27 | item0 | int(10) unsigned | NO |  |
| 28 | item1 | int(10) unsigned | NO |  |
| 29 | item2 | int(10) unsigned | NO |  |
| 30 | growthtype | tinyint(3) unsigned | NO |  |
| 31 | race_val | int(5) unsigned | NO |  |
| 32 | ign_att_cnt | tinyint(3) unsigned | NO |  |
| 33 | add_defense_cnt | tinyint(3) unsigned | NO |  |
| 34 | enchant_grade | tinyint(3) | YES |  |
| 35 | item_slot_total | tinyint(3) unsigned | NO |  |
| 36 | item_idx_0 | smallint(5) unsigned | NO |  |
| 37 | item_serial_0 | bigint(20) unsigned | NO |  |
| 38 | item_duration_0 | int(10) unsigned | NO |  |
| 39 | item_idx_1 | smallint(5) unsigned | NO |  |
| 40 | item_serial_1 | bigint(20) unsigned | NO |  |
| 41 | item_duration_1 | int(10) unsigned | NO |  |
| 42 | item_idx_2 | smallint(5) unsigned | NO |  |
| 43 | item_serial_2 | bigint(20) unsigned | NO |  |
| 44 | item_duration_2 | int(10) unsigned | NO |  |
| 45 | duration | int(10) unsigned | YES |  |
| 46 | last_check_time | datetime | NO |  |

### `u_store_hench_9` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | serial | bigint(20) unsigned | NO |  |
| 3 | hench_order | tinyint(3) unsigned | NO |  |
| 4 | monster_type | smallint(5) unsigned | NO |  |
| 5 | name | char(12) | NO |  |
| 6 | sex | tinyint(3) unsigned | NO |  |
| 7 | state | tinyint(3) unsigned | NO |  |
| 8 | mixnum | smallint(5) unsigned | NO |  |
| 9 | baselevel | smallint(5) unsigned | NO |  |
| 10 | max_baselevel | tinyint(3) unsigned | NO |  |
| 11 | exp | bigint(20) unsigned | NO |  |
| 12 | speed_move | tinyint(3) unsigned | NO |  |
| 13 | speed_attack | smallint(5) unsigned | NO |  |
| 14 | speed_spell | smallint(5) unsigned | NO |  |
| 15 | str | smallint(5) unsigned | NO |  |
| 16 | dex | smallint(5) unsigned | NO |  |
| 17 | aim | smallint(5) unsigned | NO |  |
| 18 | luck | smallint(5) unsigned | NO |  |
| 19 | ap | smallint(5) unsigned | NO |  |
| 20 | dp | smallint(5) unsigned | NO |  |
| 21 | hc | smallint(5) unsigned | NO |  |
| 22 | hd | smallint(5) unsigned | NO |  |
| 23 | hp | smallint(5) unsigned | NO |  |
| 24 | mp | smallint(5) unsigned | NO |  |
| 25 | maxhp | smallint(5) unsigned | NO |  |
| 26 | maxmp | smallint(5) unsigned | NO |  |
| 27 | item0 | int(10) unsigned | NO |  |
| 28 | item1 | int(10) unsigned | NO |  |
| 29 | item2 | int(10) unsigned | NO |  |
| 30 | growthtype | tinyint(3) unsigned | NO |  |
| 31 | race_val | int(5) unsigned | NO |  |
| 32 | ign_att_cnt | tinyint(3) unsigned | NO |  |
| 33 | add_defense_cnt | tinyint(3) unsigned | NO |  |
| 34 | enchant_grade | tinyint(3) | YES |  |
| 35 | item_slot_total | tinyint(3) unsigned | NO |  |
| 36 | item_idx_0 | smallint(5) unsigned | NO |  |
| 37 | item_serial_0 | bigint(20) unsigned | NO |  |
| 38 | item_duration_0 | int(10) unsigned | NO |  |
| 39 | item_idx_1 | smallint(5) unsigned | NO |  |
| 40 | item_serial_1 | bigint(20) unsigned | NO |  |
| 41 | item_duration_1 | int(10) unsigned | NO |  |
| 42 | item_idx_2 | smallint(5) unsigned | NO |  |
| 43 | item_serial_2 | bigint(20) unsigned | NO |  |
| 44 | item_duration_2 | int(10) unsigned | NO |  |
| 45 | duration | int(10) unsigned | YES |  |
| 46 | last_check_time | datetime | NO |  |

### `u_store_item` (0 rows)

| # | Field | Type | Null | Key |
|---|-------|------|------|-----|
| 1 | id_idx | int(10) unsigned | NO | MUL |
| 2 | serial | bigint(20) unsigned | NO |  |
| 3 | item_idx | int(10) unsigned | NO |  |
| 4 | socket_num | tinyint(3) unsigned | NO |  |
| 5 | count | smallint(5) unsigned | NO |  |
| 6 | opt | tinyint(3) unsigned | NO |  |
| 7 | opt_level | tinyint(3) unsigned | NO |  |
| 8 | duration | int(10) unsigned | YES |  |
| 9 | last_check_time | datetime | NO |  |
| 10 | synergy | tinyint(3) unsigned | YES |  |
| 11 | synergy_level | tinyint(3) unsigned | YES |  |
