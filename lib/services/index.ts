// Re-export all services from the services directory

export { promptEnricher, PromptEnricher } from './PromptEnricher';
export { ambiguityDetector, AmbiguityDetector } from './AmbiguityDetector';
export { questionGenerator, QuestionGenerator } from './QuestionGenerator';
export { contextBuilder, ContextBuilder } from './ContextBuilder';
export { costTracker, CostTracker } from './CostTracker';
export { patternDetector, PatternDetector } from './PatternDetector';
export { patternApplicator, PatternApplicator } from './PatternApplicator';

// Phase 1: Intelligent Work System
export { taskDecomposer, TaskDecomposer } from './TaskDecomposer';
export { taskCheckout, TaskCheckout } from './TaskCheckout';

// Phase 2: Dynamic Agent Registry
export { agentRouter, AgentRouter } from './AgentRouter';
export { heartbeatCoordinator, HeartbeatCoordinator } from './HeartbeatCoordinator';

// Phase 3: Trust-Based Governance
export { approvalEngine, ApprovalEngine } from './ApprovalEngine';

// Phase 4: Organization & Delegation
export { delegationTracker, DelegationTracker } from './DelegationTracker';
