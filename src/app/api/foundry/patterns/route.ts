/**
 * /api/foundry/patterns — Hermes cognitive pattern library (The Forge)
 * Replaces: readDirectory + readMarkdown → in-memory pattern store
 */
import { NextResponse } from 'next/server';

const PATTERNS = [
  {
    id: 'pat_chain_of_thought',
    name: 'Chain of Thought',
    category: 'reasoning',
    description: 'Step-by-step reasoning that externalizes the thought process before arriving at a conclusion.',
    template: '1. Understand the problem\n2. Break it into components\n3. Reason through each component\n4. Synthesize the answer\n5. Verify correctness',
    tags: ['reasoning', 'accuracy'],
    usageCount: 847,
  },
  {
    id: 'pat_react',
    name: 'ReAct (Reason + Act)',
    category: 'agentic',
    description: 'Interleave reasoning traces and external tool actions for complex task completion.',
    template: 'Thought: [reasoning]\nAction: [tool call]\nObservation: [result]\n... repeat until done',
    tags: ['agentic', 'tools', 'loop'],
    usageCount: 1203,
  },
  {
    id: 'pat_tree_of_thought',
    name: 'Tree of Thought',
    category: 'reasoning',
    description: 'Explore multiple reasoning paths simultaneously and select the most promising branch.',
    template: 'Generate N candidate thoughts → evaluate each → expand best → repeat',
    tags: ['reasoning', 'exploration'],
    usageCount: 312,
  },
  {
    id: 'pat_reflexion',
    name: 'Reflexion',
    category: 'memory',
    description: 'Use verbal self-reflection on task failures to improve future performance without retraining.',
    template: 'Attempt task → Evaluate result → Reflect on failure → Store reflection in memory → Retry',
    tags: ['memory', 'learning', 'self-improvement'],
    usageCount: 156,
  },
  {
    id: 'pat_plan_solve',
    name: 'Plan-and-Solve',
    category: 'agentic',
    description: 'First create an explicit plan, then execute each step methodically.',
    template: 'Phase 1: Devise a plan\nPhase 2: Carry out the plan step by step',
    tags: ['planning', 'agentic'],
    usageCount: 523,
  },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const filtered = category ? PATTERNS.filter(p => p.category === category) : PATTERNS;

    return NextResponse.json({
      patterns: filtered,
      categories: [...new Set(PATTERNS.map(p => p.category))],
      summary: { total: filtered.length },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error), patterns: [] }, { status: 500 });
  }
}
