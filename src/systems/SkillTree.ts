/**
 * SkillTree — 3-column skill tree with tier prerequisites.
 * Columns: Attack(攻擊) / Defense(防禦) / Magic(魔法)
 * Each column: Tier-1 → Tier-2 → Passive (3 tiers, 3 columns = 9 nodes)
 */

export interface SkillTreeNode {
      id: string;
      name: string;
      nameCN: string;
      icon: string;
      column: 'atk' | 'def' | 'magic';
      tier: 1 | 2 | 3;
      maxLevel: number;
      currentLevel: number;
      prereqId?: string;
      effect: string;
      effectPerLevel: number;   // numerical bonus per level
}

const TREE_NODES: SkillTreeNode[] = [
      // ── Attack Column ──
      {
            id: 'atk_t1', name: 'Power Boost', nameCN: '力量強化', icon: '⚔️',
            column: 'atk', tier: 1, maxLevel: 5, currentLevel: 0,
            effect: 'ATK +5% per level', effectPerLevel: 5,
      },
      {
            id: 'atk_t2', name: 'Crit Master', nameCN: '暴擊大師', icon: '💥',
            column: 'atk', tier: 2, maxLevel: 5, currentLevel: 0,
            prereqId: 'atk_t1',
            effect: 'CRIT +3% per level', effectPerLevel: 3,
      },
      {
            id: 'atk_t3', name: 'Berserker', nameCN: '狂戰士', icon: '🔥',
            column: 'atk', tier: 3, maxLevel: 1, currentLevel: 0,
            prereqId: 'atk_t2',
            effect: 'ATK +15% when HP < 30%', effectPerLevel: 15,
      },
      // ── Defense Column ──
      {
            id: 'def_t1', name: 'Iron Will', nameCN: '鋼鐵意志', icon: '🛡️',
            column: 'def', tier: 1, maxLevel: 5, currentLevel: 0,
            effect: 'DEF +5% per level', effectPerLevel: 5,
      },
      {
            id: 'def_t2', name: 'Vitality', nameCN: '生命之源', icon: '❤️',
            column: 'def', tier: 2, maxLevel: 5, currentLevel: 0,
            prereqId: 'def_t1',
            effect: 'HP +8% per level', effectPerLevel: 8,
      },
      {
            id: 'def_t3', name: 'Unyielding', nameCN: '不屈', icon: '✨',
            column: 'def', tier: 3, maxLevel: 1, currentLevel: 0,
            prereqId: 'def_t2',
            effect: '30% chance survive lethal hit', effectPerLevel: 30,
      },
      // ── Magic Column ──
      {
            id: 'mag_t1', name: 'Mana Amplify', nameCN: '魔力增幅', icon: '🔮',
            column: 'magic', tier: 1, maxLevel: 5, currentLevel: 0,
            effect: 'MP +8% per level', effectPerLevel: 8,
      },
      {
            id: 'mag_t2', name: 'Quick Cooldown', nameCN: '冷卻加速', icon: '⏱️',
            column: 'magic', tier: 2, maxLevel: 5, currentLevel: 0,
            prereqId: 'mag_t1',
            effect: 'CD -5% per level', effectPerLevel: 5,
      },
      {
            id: 'mag_t3', name: 'Wisdom Aura', nameCN: '智慧光環', icon: '💫',
            column: 'magic', tier: 3, maxLevel: 1, currentLevel: 0,
            prereqId: 'mag_t2',
            effect: 'Pet MP +10%', effectPerLevel: 10,
      },
];

export interface SkillTreeBonuses {
      atkPct: number;
      critPct: number;
      berserkerActive: boolean;
      defPct: number;
      hpPct: number;
      unyieldingChance: number;
      mpPct: number;
      cdReductionPct: number;
      petMpPct: number;
}

export class SkillTree {
      nodes: SkillTreeNode[];
      skillPoints = 0;

      constructor() {
            // Deep clone default nodes
            this.nodes = TREE_NODES.map(n => ({ ...n }));
      }

      /** +1 SP per level */
      onLevelUp(): void {
            this.skillPoints++;
      }

      /** Check if a node can be learned */
      canLearn(nodeId: string): boolean {
            const node = this.nodes.find(n => n.id === nodeId);
            if (!node || node.currentLevel >= node.maxLevel) return false;
            if (this.skillPoints <= 0) return false;

            // Check prerequisite: previous tier must be maxed
            if (node.prereqId) {
                  const prereq = this.nodes.find(n => n.id === node.prereqId);
                  if (!prereq || prereq.currentLevel < prereq.maxLevel) return false;
            }
            return true;
      }

      /** Learn/upgrade a node */
      learn(nodeId: string): boolean {
            if (!this.canLearn(nodeId)) return false;
            const node = this.nodes.find(n => n.id === nodeId)!;
            node.currentLevel++;
            this.skillPoints--;
            return true;
      }

      /** Get node by ID */
      getNode(nodeId: string): SkillTreeNode | undefined {
            return this.nodes.find(n => n.id === nodeId);
      }

      /** Reset all skill points */
      reset(): void {
            for (const node of this.nodes) {
                  this.skillPoints += node.currentLevel;
                  node.currentLevel = 0;
            }
      }

      /** Calculate total bonuses from all learned nodes */
      getBonuses(): SkillTreeBonuses {
            const g = (id: string) => this.nodes.find(n => n.id === id)?.currentLevel ?? 0;
            return {
                  atkPct: g('atk_t1') * 5,
                  critPct: g('atk_t2') * 3,
                  berserkerActive: g('atk_t3') > 0,
                  defPct: g('def_t1') * 5,
                  hpPct: g('def_t2') * 8,
                  unyieldingChance: g('def_t3') > 0 ? 30 : 0,
                  mpPct: g('mag_t1') * 8,
                  cdReductionPct: g('mag_t2') * 5,
                  petMpPct: g('mag_t3') > 0 ? 10 : 0,
            };
      }

      /** Total SP spent */
      get totalSpent(): number {
            return this.nodes.reduce((s, n) => s + n.currentLevel, 0);
      }
}
