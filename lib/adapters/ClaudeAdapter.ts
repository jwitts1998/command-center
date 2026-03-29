import { generateText, streamText, generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type { Agent, AgentExecutionSession } from '@/lib/db/client';
import { heartbeatCoordinator } from '@/lib/services/HeartbeatCoordinator';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ExecutionContext {
  task_id?: string;
  task_description: string;
  goal_context?: string;
  project_context?: string;
  additional_instructions?: string;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  tokens_used: number;
  cost_usd: number;
  session_id: string;
  error?: string;
}

export interface StreamingExecutionOptions {
  onToken?: (token: string) => void;
  onComplete?: (result: ExecutionResult) => void;
  onError?: (error: Error) => void;
}

// Token pricing for Claude models (per 1M tokens)
const CLAUDE_PRICING = {
  'claude-sonnet-4-20250514': { input: 3, output: 15 },
  'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
  'claude-3-opus-20240229': { input: 15, output: 75 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
};

export class ClaudeAdapter {
  private agent: Agent;
  private model: ReturnType<typeof anthropic>;
  private modelId: string;
  private systemPrompt: string;

  constructor(agent: Agent) {
    this.agent = agent;
    this.modelId = this.getModelId();
    this.model = anthropic(this.modelId);
    this.systemPrompt = this.loadSystemPrompt();
  }

  private getModelId(): string {
    const config = this.agent.adapter_config as Record<string, unknown>;
    return (config.model as string) || 'claude-sonnet-4-20250514';
  }

  private loadSystemPrompt(): string {
    if (!this.agent.system_prompt_path) {
      return this.getDefaultSystemPrompt();
    }

    // Try to load from file
    const fullPath = join(process.cwd(), this.agent.system_prompt_path);
    if (existsSync(fullPath)) {
      try {
        return readFileSync(fullPath, 'utf-8');
      } catch {
        console.warn(`Failed to read system prompt from ${fullPath}`);
      }
    }

    return this.getDefaultSystemPrompt();
  }

  private getDefaultSystemPrompt(): string {
    return `You are ${this.agent.name}, an AI agent with the following role: ${this.agent.role}.

Description: ${this.agent.description || 'No description provided.'}

Capabilities: ${this.agent.capabilities.join(', ')}

Specializations: ${this.agent.specializations.join(', ')}

Instructions:
1. Execute tasks efficiently and accurately
2. Provide clear, actionable outputs
3. Report progress and any blockers encountered
4. Request clarification when needed
5. Stay within your defined capabilities`;
  }

  /**
   * Executes a task and returns the result
   */
  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    // Create execution session
    const session = await heartbeatCoordinator.createSession(
      this.agent.id,
      context.task_id || 'adhoc'
    );

    try {
      const prompt = this.buildPrompt(context);

      const result = await generateText({
        model: this.model,
        system: this.systemPrompt,
        prompt,
      });

      // Calculate cost
      const usage = result.usage as any;
      const inputTokens = usage?.promptTokens || usage?.inputTokens || 0;
      const outputTokens = usage?.completionTokens || usage?.outputTokens || 0;
      const cost = this.calculateCost(inputTokens, outputTokens);

      // Update session
      await heartbeatCoordinator.appendToConversation(session.id, {
        role: 'user',
        content: prompt,
        tokens: inputTokens,
      });

      await heartbeatCoordinator.appendToConversation(session.id, {
        role: 'assistant',
        content: result.text,
        tokens: outputTokens,
      });

      await heartbeatCoordinator.completeSession(session.id, cost);

      return {
        success: true,
        output: result.text,
        tokens_used: inputTokens + outputTokens,
        cost_usd: cost,
        session_id: session.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await heartbeatCoordinator.failSession(session.id, errorMessage);

      return {
        success: false,
        output: '',
        tokens_used: 0,
        cost_usd: 0,
        session_id: session.id,
        error: errorMessage,
      };
    }
  }

  /**
   * Executes a task with streaming output
   */
  async executeStreaming(
    context: ExecutionContext,
    options: StreamingExecutionOptions
  ): Promise<void> {
    const session = await heartbeatCoordinator.createSession(
      this.agent.id,
      context.task_id || 'adhoc'
    );

    try {
      const prompt = this.buildPrompt(context);

      const stream = streamText({
        model: this.model,
        system: this.systemPrompt,
        prompt,
      });

      let fullOutput = '';
      let inputTokens = 0;
      let outputTokens = 0;

      for await (const chunk of (await stream).textStream) {
        fullOutput += chunk;
        options.onToken?.(chunk);
      }

      // Get final usage
      const finalResult = await stream;
      const usage = (finalResult as any).usage || {};
      inputTokens = usage.promptTokens || usage.inputTokens || 0;
      outputTokens = usage.completionTokens || usage.outputTokens || 0;

      const cost = this.calculateCost(inputTokens, outputTokens);

      await heartbeatCoordinator.appendToConversation(session.id, {
        role: 'user',
        content: prompt,
        tokens: inputTokens,
      });

      await heartbeatCoordinator.appendToConversation(session.id, {
        role: 'assistant',
        content: fullOutput,
        tokens: outputTokens,
      });

      await heartbeatCoordinator.completeSession(session.id, cost);

      options.onComplete?.({
        success: true,
        output: fullOutput,
        tokens_used: inputTokens + outputTokens,
        cost_usd: cost,
        session_id: session.id,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      await heartbeatCoordinator.failSession(session.id, err.message);
      options.onError?.(err);
    }
  }

  /**
   * Executes a task with structured output
   */
  async executeStructured<T extends z.ZodType>(
    context: ExecutionContext,
    schema: T
  ): Promise<{ success: boolean; data: z.infer<T> | null; session_id: string; cost_usd: number; error?: string }> {
    const session = await heartbeatCoordinator.createSession(
      this.agent.id,
      context.task_id || 'adhoc'
    );

    try {
      const prompt = this.buildPrompt(context);

      const result = await generateObject({
        model: this.model,
        system: this.systemPrompt,
        prompt,
        schema,
      });

      const usage = result.usage as any;
      const inputTokens = usage?.promptTokens || usage?.inputTokens || 0;
      const outputTokens = usage?.completionTokens || usage?.outputTokens || 0;
      const cost = this.calculateCost(inputTokens, outputTokens);

      await heartbeatCoordinator.completeSession(session.id, cost);

      return {
        success: true,
        data: result.object as z.infer<T>,
        session_id: session.id,
        cost_usd: cost,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await heartbeatCoordinator.failSession(session.id, errorMessage);

      return {
        success: false,
        data: null,
        session_id: session.id,
        cost_usd: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Continues a previous session with additional context
   */
  async continueSession(
    sessionId: string,
    additionalPrompt: string
  ): Promise<ExecutionResult> {
    // Resume session
    const session = await heartbeatCoordinator.resumeSession(sessionId);

    if (!session) {
      return {
        success: false,
        output: '',
        tokens_used: 0,
        cost_usd: 0,
        session_id: sessionId,
        error: 'Session not found',
      };
    }

    try {
      // Build messages from conversation history
      const messages = this.buildMessagesFromHistory(session, additionalPrompt);

      const result = await generateText({
        model: this.model,
        system: this.systemPrompt,
        messages,
      });

      const usage = result.usage as any;
      const inputTokens = usage?.promptTokens || usage?.inputTokens || 0;
      const outputTokens = usage?.completionTokens || usage?.outputTokens || 0;
      const cost = this.calculateCost(inputTokens, outputTokens);

      await heartbeatCoordinator.appendToConversation(sessionId, {
        role: 'user',
        content: additionalPrompt,
        tokens: inputTokens,
      });

      await heartbeatCoordinator.appendToConversation(sessionId, {
        role: 'assistant',
        content: result.text,
        tokens: outputTokens,
      });

      return {
        success: true,
        output: result.text,
        tokens_used: inputTokens + outputTokens,
        cost_usd: cost,
        session_id: sessionId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await heartbeatCoordinator.failSession(sessionId, errorMessage);

      return {
        success: false,
        output: '',
        tokens_used: 0,
        cost_usd: 0,
        session_id: sessionId,
        error: errorMessage,
      };
    }
  }

  /**
   * Estimates the cost of an execution
   */
  estimateCost(promptLength: number, expectedOutputTokens: number = 1000): number {
    // Rough estimate: 4 characters per token
    const inputTokens = Math.ceil(promptLength / 4);
    return this.calculateCost(inputTokens, expectedOutputTokens);
  }

  private buildPrompt(context: ExecutionContext): string {
    let prompt = `TASK: ${context.task_description}`;

    if (context.goal_context) {
      prompt += `\n\nGOAL CONTEXT:\n${context.goal_context}`;
    }

    if (context.project_context) {
      prompt += `\n\nPROJECT CONTEXT:\n${context.project_context}`;
    }

    if (context.additional_instructions) {
      prompt += `\n\nADDITIONAL INSTRUCTIONS:\n${context.additional_instructions}`;
    }

    return prompt;
  }

  private buildMessagesFromHistory(
    session: AgentExecutionSession,
    additionalPrompt: string
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    const history = session.conversation_history || [];

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    for (const msg of history) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    messages.push({
      role: 'user',
      content: additionalPrompt,
    });

    return messages;
  }

  private calculateCost(inputTokens: number, outputTokens: number): number {
    const pricing = CLAUDE_PRICING[this.modelId as keyof typeof CLAUDE_PRICING] ||
      CLAUDE_PRICING['claude-sonnet-4-20250514'];

    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;

    return inputCost + outputCost;
  }
}

// Factory function to create adapter for an agent
export function createAdapter(agent: Agent): ClaudeAdapter {
  if (agent.adapter_type !== 'claude') {
    throw new Error(`Unsupported adapter type: ${agent.adapter_type}`);
  }

  return new ClaudeAdapter(agent);
}
