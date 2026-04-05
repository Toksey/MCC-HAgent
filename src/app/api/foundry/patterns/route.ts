/**
 * /api/foundry/patterns — Hermes cognitive pattern library (The Forge)
 * Provides reasoning/agentic patterns with full crystallization metadata.
 */
import { NextResponse } from 'next/server';

export interface ForgePattern {
  id: string;
  name: string;
  category: 'reasoning' | 'agentic' | 'memory';
  description: string;
  template: string;
  tags: string[];
  usageCount: number;
  toolsUsed: string[];
  exampleGoal: string;
  frequency: number;
  successRate: number;
  averageDuration: number;
  proposedCode: string;
}

const PATTERNS: ForgePattern[] = [
  {
    id: 'pat_chain_of_thought',
    name: 'Chain of Thought',
    category: 'reasoning',
    description: 'Step-by-step reasoning that externalizes the thought process before arriving at a conclusion.',
    template: '1. Understand the problem\n2. Break it into components\n3. Reason through each component\n4. Synthesize the answer\n5. Verify correctness',
    tags: ['reasoning', 'accuracy'],
    usageCount: 847,
    toolsUsed: ['think', 'observe', 'verify'],
    exampleGoal: 'Debug a complex authentication failure across multiple services',
    frequency: 847,
    successRate: 0.91,
    averageDuration: 2400,
    proposedCode: `// crystallized_tool: chain_of_thought.js
async function chainOfThought(agent, problem) {
  const steps = [];
  steps.push(await agent.think(\`Understand: \${problem}\`));
  const components = await agent.decompose(problem);
  for (const component of components) {
    steps.push(await agent.reason(component));
  }
  const synthesis = await agent.synthesize(steps);
  return agent.verify(synthesis);
}
module.exports = { chainOfThought };`,
  },
  {
    id: 'pat_react',
    name: 'ReAct (Reason + Act)',
    category: 'agentic',
    description: 'Interleave reasoning traces and external tool actions for complex task completion.',
    template: 'Thought: [reasoning]\nAction: [tool call]\nObservation: [result]\n... repeat until done',
    tags: ['agentic', 'tools', 'loop'],
    usageCount: 1203,
    toolsUsed: ['think', 'tool_call', 'observe', 'memory.store'],
    exampleGoal: 'Research and summarize market intelligence for a product launch',
    frequency: 1203,
    successRate: 0.88,
    averageDuration: 5800,
    proposedCode: `// crystallized_tool: react_loop.js
async function reactLoop(agent, goal, maxIterations = 10) {
  let iteration = 0;
  while (iteration < maxIterations) {
    const thought = await agent.think(\`Goal: \${goal}. Iteration: \${iteration}\`);
    if (thought.isDone) break;
    const action = await agent.selectTool(thought);
    const observation = await agent.execute(action);
    await agent.memory.store({ content: observation, type: 'episodic' });
    iteration++;
  }
  return agent.synthesize();
}
module.exports = { reactLoop };`,
  },
  {
    id: 'pat_tree_of_thought',
    name: 'Tree of Thought',
    category: 'reasoning',
    description: 'Explore multiple reasoning paths simultaneously and select the most promising branch.',
    template: 'Generate N candidate thoughts → evaluate each → expand best → repeat',
    tags: ['reasoning', 'exploration'],
    usageCount: 312,
    toolsUsed: ['think', 'evaluate', 'expand', 'prune'],
    exampleGoal: 'Choose the optimal architecture for a high-traffic distributed system',
    frequency: 312,
    successRate: 0.85,
    averageDuration: 8200,
    proposedCode: `// crystallized_tool: tree_of_thought.js
async function treeOfThought(agent, problem, branches = 3, depth = 2) {
  const explore = async (context, d) => {
    if (d === 0) return agent.evaluate(context);
    const candidates = await agent.generateThoughts(context, branches);
    const scores = await Promise.all(candidates.map(c => agent.scoreThought(c)));
    const best = candidates[scores.indexOf(Math.max(...scores))];
    return explore(best, d - 1);
  };
  return explore(problem, depth);
}
module.exports = { treeOfThought };`,
  },
  {
    id: 'pat_reflexion',
    name: 'Reflexion',
    category: 'memory',
    description: 'Use verbal self-reflection on task failures to improve future performance without retraining.',
    template: 'Attempt task → Evaluate result → Reflect on failure → Store reflection in memory → Retry',
    tags: ['memory', 'learning', 'self-improvement'],
    usageCount: 156,
    toolsUsed: ['attempt', 'evaluate', 'reflect', 'memory.store', 'retry'],
    exampleGoal: 'Improve success rate on API integration tasks after repeated failures',
    frequency: 156,
    successRate: 0.79,
    averageDuration: 12000,
    proposedCode: `// crystallized_tool: reflexion.js
async function reflexion(agent, task, maxAttempts = 3) {
  const reflections = await agent.memory.query('past failures');
  let result;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    result = await agent.attempt(task, { context: reflections });
    if (result.success) return result;
    const reflection = await agent.reflect(result.error, task);
    await agent.memory.store({ content: reflection, type: 'reflection' });
    reflections.push(reflection);
  }
  return result;
}
module.exports = { reflexion };`,
  },
  {
    id: 'pat_plan_solve',
    name: 'Plan-and-Solve',
    category: 'agentic',
    description: 'First create an explicit plan, then execute each step methodically.',
    template: 'Phase 1: Devise a plan\nPhase 2: Carry out the plan step by step',
    tags: ['planning', 'agentic'],
    usageCount: 523,
    toolsUsed: ['plan', 'decompose', 'execute', 'checkpoint'],
    exampleGoal: 'Build and deploy a complete feature from spec to production',
    frequency: 523,
    successRate: 0.93,
    averageDuration: 4100,
    proposedCode: `// crystallized_tool: plan_and_solve.js
async function planAndSolve(agent, objective) {
  const plan = await agent.devisePlan(objective);
  const results = [];
  for (const step of plan.steps) {
    const result = await agent.execute(step);
    results.push(result);
    await agent.checkpoint(step, result);
    if (result.blocksNext) {
      return { partial: true, completedSteps: results.length, error: result.error };
    }
  }
  return { success: true, results };
}
module.exports = { planAndSolve };`,
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, category, template, tags } = body;

    if (!name || !description) {
      return NextResponse.json({ error: 'name and description are required' }, { status: 400 });
    }

    const custom: ForgePattern = {
      id: `pat_custom_${Date.now()}`,
      name,
      description,
      category: category || 'agentic',
      template: template || `// Custom pattern: ${name}\n// TODO: define steps`,
      tags: tags || ['custom'],
      usageCount: 0,
      toolsUsed: body.toolsUsed || [],
      exampleGoal: body.exampleGoal || description,
      frequency: 0,
      successRate: 0,
      averageDuration: 0,
      proposedCode: body.proposedCode ||
        `// crystallized_tool: ${name.toLowerCase().replace(/\s+/g, '_')}.js\nasync function run(agent, input) {\n  // ${description}\n  return agent.execute(input);\n}\nmodule.exports = { run };`,
    };

    return NextResponse.json({ ok: true, pattern: custom }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
