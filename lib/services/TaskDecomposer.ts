import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { query, queryOne } from '@/lib/db/client';
import type { Goal, Task } from '@/lib/db/client';
import type { CreateTaskInput, TaskComplexity, TaskPriority } from '@/types/task';
import type { GoalDecompositionResult } from '@/types/goal';

// Schema for task decomposition
const TaskDecompositionSchema = z.object({
  tasks: z.array(z.object({
    title: z.string().describe('Clear, actionable task title'),
    description: z.string().describe('Detailed description of what needs to be done'),
    complexity: z.enum(['trivial', 'simple', 'moderate', 'complex', 'epic']).describe('Task complexity'),
    priority: z.enum(['low', 'medium', 'high', 'critical']).describe('Task priority'),
    estimated_cost_usd: z.number().min(0).describe('Estimated cost in USD'),
    dependencies: z.array(z.number()).describe('Indices of tasks this depends on (0-indexed)'),
    required_capabilities: z.array(z.string()).describe('Required agent capabilities'),
  })),
  reasoning: z.string().describe('Why the goal was broken down this way'),
  estimated_total_cost: z.number().describe('Total estimated cost for all tasks'),
  estimated_complexity: z.enum(['trivial', 'simple', 'moderate', 'complex', 'epic']).describe('Overall goal complexity'),
});

type DecomposedTask = z.infer<typeof TaskDecompositionSchema>['tasks'][number];

export class TaskDecomposer {
  private model = anthropic('claude-sonnet-4-20250514');

  /**
   * Decomposes a goal into actionable tasks using AI
   */
  async decomposeGoal(goalId: string): Promise<GoalDecompositionResult> {
    // Fetch the goal
    const goal = await queryOne<Goal>(
      'SELECT * FROM goals WHERE id = $1',
      [goalId]
    );

    if (!goal) {
      throw new Error(`Goal not found: ${goalId}`);
    }

    // Fetch project context if available
    let projectContext = '';
    if (goal.project_id) {
      const project = await queryOne<{ name: string; tech_stack: Record<string, unknown> }>(
        'SELECT name, tech_stack FROM projects WHERE id = $1',
        [goal.project_id]
      );
      if (project) {
        projectContext = `
Project: ${project.name}
Tech Stack: ${JSON.stringify(project.tech_stack)}`;
      }
    }

    // Generate task breakdown using AI
    const prompt = this.buildDecompositionPrompt(goal, projectContext);

    const result = await generateObject({
      model: this.model,
      schema: TaskDecompositionSchema,
      prompt,
    });

    // Create tasks in database
    const createdTasks: CreateTaskInput[] = [];
    const taskIdMap: Map<number, string> = new Map();

    for (let i = 0; i < result.object.tasks.length; i++) {
      const task = result.object.tasks[i];
      const taskInput = await this.createTaskFromDecomposition(
        goalId,
        task,
        i,
        taskIdMap
      );
      createdTasks.push(taskInput);
    }

    // Log the decomposition to audit log
    await this.logDecomposition(goalId, result.object);

    return {
      goal_id: goalId,
      tasks: createdTasks,
      reasoning: result.object.reasoning,
      estimated_total_cost: result.object.estimated_total_cost,
      estimated_complexity: result.object.estimated_complexity,
    };
  }

  /**
   * Decomposes a task into subtasks
   */
  async decomposeTask(taskId: string): Promise<CreateTaskInput[]> {
    const task = await queryOne<Task>(
      'SELECT * FROM tasks WHERE id = $1',
      [taskId]
    );

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Don't decompose beyond depth 3
    if (task.depth >= 3) {
      throw new Error('Maximum task depth reached (3)');
    }

    const prompt = this.buildSubtaskPrompt(task);

    const result = await generateObject({
      model: this.model,
      schema: TaskDecompositionSchema,
      prompt,
    });

    const createdTasks: CreateTaskInput[] = [];
    const taskIdMap: Map<number, string> = new Map();

    for (let i = 0; i < result.object.tasks.length; i++) {
      const subtask = result.object.tasks[i];
      const taskInput = await this.createSubtaskFromDecomposition(
        task,
        subtask,
        i,
        taskIdMap
      );
      createdTasks.push(taskInput);
    }

    return createdTasks;
  }

  /**
   * Quick decomposition for simple goals
   */
  async quickDecompose(goalTitle: string, goalDescription?: string): Promise<DecomposedTask[]> {
    const prompt = `Break down this goal into 3-5 actionable tasks.

Goal: ${goalTitle}
${goalDescription ? `Description: ${goalDescription}` : ''}

Create specific, actionable tasks that can be assigned to an AI agent.
Each task should be completable in a single work session.
Order tasks by dependencies (dependent tasks come after their dependencies).`;

    const result = await generateObject({
      model: this.model,
      schema: TaskDecompositionSchema,
      prompt,
    });

    return result.object.tasks;
  }

  /**
   * Validates that a task decomposition is reasonable
   */
  validateDecomposition(tasks: DecomposedTask[]): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (tasks.length < 1) {
      issues.push('Decomposition produced no tasks');
    }

    if (tasks.length > 10) {
      issues.push('Decomposition produced too many tasks (max 10)');
    }

    // Check for circular dependencies
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      for (const dep of task.dependencies) {
        if (dep >= i) {
          issues.push(`Task ${i} has forward dependency to task ${dep}`);
        }
        if (dep < 0 || dep >= tasks.length) {
          issues.push(`Task ${i} has invalid dependency index ${dep}`);
        }
      }
    }

    // Check for empty titles
    for (let i = 0; i < tasks.length; i++) {
      if (!tasks[i].title.trim()) {
        issues.push(`Task ${i} has empty title`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  private buildDecompositionPrompt(goal: Goal, projectContext: string): string {
    return `You are an AI project manager breaking down a high-level goal into actionable tasks.

GOAL:
Title: ${goal.title}
Description: ${goal.description || 'No description provided'}
Priority: ${goal.priority}
${goal.target_date ? `Target Date: ${goal.target_date}` : ''}
${projectContext}

INSTRUCTIONS:
1. Break this goal into 3-7 specific, actionable tasks
2. Each task should be completable by a single AI agent in one work session
3. Order tasks so dependencies come before dependent tasks
4. Estimate costs based on complexity (trivial: $0.10, simple: $0.50, moderate: $2, complex: $5, epic: $10+)
5. Identify required capabilities for each task (e.g., "code_generation", "architecture", "testing")

GUIDELINES:
- Tasks should be atomic and well-defined
- Include any necessary setup, implementation, and verification steps
- Consider testing and documentation if relevant
- Don't over-decompose simple goals`;
  }

  private buildSubtaskPrompt(task: Task): string {
    return `Break down this task into smaller subtasks.

PARENT TASK:
Title: ${task.title}
Description: ${task.description || 'No description'}
Complexity: ${task.complexity || 'unknown'}
Depth: ${task.depth}

INSTRUCTIONS:
1. Break into 2-4 smaller, more specific subtasks
2. Each subtask should be simpler than the parent
3. Maintain logical order with dependencies
4. This is depth ${task.depth + 1}, so keep subtasks focused`;
  }

  private async createTaskFromDecomposition(
    goalId: string,
    task: DecomposedTask,
    index: number,
    taskIdMap: Map<number, string>
  ): Promise<CreateTaskInput> {
    // Determine parent task ID from dependencies
    let parentTaskId: string | undefined;
    if (task.dependencies.length > 0) {
      // Use the most recent dependency as parent
      const lastDep = task.dependencies[task.dependencies.length - 1];
      parentTaskId = taskIdMap.get(lastDep);
    }

    const insertResult = await queryOne<{ id: string }>(
      `INSERT INTO tasks (goal_id, parent_task_id, title, description, priority, complexity, estimated_cost_usd, depth)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        goalId,
        parentTaskId || null,
        task.title,
        task.description,
        task.priority,
        task.complexity,
        task.estimated_cost_usd,
        parentTaskId ? 1 : 0,
      ]
    );

    if (insertResult) {
      taskIdMap.set(index, insertResult.id);
    }

    return {
      goal_id: goalId,
      parent_task_id: parentTaskId,
      title: task.title,
      description: task.description,
      priority: task.priority as TaskPriority,
      complexity: task.complexity as TaskComplexity,
      estimated_cost_usd: task.estimated_cost_usd,
    };
  }

  private async createSubtaskFromDecomposition(
    parentTask: Task,
    subtask: DecomposedTask,
    index: number,
    taskIdMap: Map<number, string>
  ): Promise<CreateTaskInput> {
    const insertResult = await queryOne<{ id: string }>(
      `INSERT INTO tasks (goal_id, parent_task_id, title, description, priority, complexity, estimated_cost_usd, depth)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        parentTask.goal_id,
        parentTask.id,
        subtask.title,
        subtask.description,
        subtask.priority,
        subtask.complexity,
        subtask.estimated_cost_usd,
        parentTask.depth + 1,
      ]
    );

    if (insertResult) {
      taskIdMap.set(index, insertResult.id);
    }

    return {
      goal_id: parentTask.goal_id || undefined,
      parent_task_id: parentTask.id,
      title: subtask.title,
      description: subtask.description,
      priority: subtask.priority as TaskPriority,
      complexity: subtask.complexity as TaskComplexity,
      estimated_cost_usd: subtask.estimated_cost_usd,
    };
  }

  private async logDecomposition(
    goalId: string,
    decomposition: z.infer<typeof TaskDecompositionSchema>
  ): Promise<void> {
    // Log to audit for the goal (as a pseudo-task entry)
    await query(
      `INSERT INTO task_audit_log (task_id, action, actor_type, actor_id, new_state)
       SELECT id, 'created', 'system', 'task_decomposer', $2::jsonb
       FROM tasks WHERE goal_id = $1`,
      [goalId, JSON.stringify({ decomposition_reasoning: decomposition.reasoning })]
    );
  }
}

// Export singleton instance
export const taskDecomposer = new TaskDecomposer();
