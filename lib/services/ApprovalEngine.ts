import { query, queryOne } from '@/lib/db/client';
import type { ApprovalPolicy as DbApprovalPolicy, ApprovalRequest as DbApprovalRequest } from '@/lib/db/client';
import type {
  ApprovalCheckResult,
  ApprovalDecision,
  ApprovalPolicy,
  ApprovalRequest,
  ApprovalStats,
  ApprovalStatus,
  CostThresholdConfig,
  CreateApprovalRequestInput,
  OperationDetails,
  OperationTypeConfig,
  RiskAssessment,
} from '@/types/approval';

export class ApprovalEngine {
  /**
   * Checks if an operation requires approval and creates a request if needed
   */
  async checkAndRequestApproval(
    operationType: string,
    operationDetails: OperationDetails,
    options: {
      taskId?: string;
      agentId?: string;
      estimatedCostUsd?: number;
    } = {}
  ): Promise<ApprovalCheckResult> {
    // Get all active policies
    const dbPolicies = await query<DbApprovalPolicy>(
      `SELECT * FROM approval_policies WHERE is_active = true`
    );
    const policies = dbPolicies as unknown as ApprovalPolicy[];

    // Find matching policies
    const matchingPolicies = policies.filter(policy =>
      this.matchesPolicy(policy, operationType, operationDetails, options)
    );

    if (matchingPolicies.length === 0) {
      return {
        requires_approval: false,
        matching_policies: [],
        auto_approved: false,
        reason: 'No matching approval policies',
      };
    }

    // Check if any policy allows auto-approval
    const confidenceForAutoApproval = this.calculateApprovalConfidence(matchingPolicies);
    const canAutoApprove = matchingPolicies.every(
      policy => policy.auto_approve_confidence > 0 && confidenceForAutoApproval >= policy.auto_approve_confidence
    );

    if (canAutoApprove) {
      // Record auto-approval
      const request = await this.createApprovalRequest({
        policy_id: matchingPolicies[0].id,
        task_id: options.taskId,
        agent_id: options.agentId,
        operation_type: operationType,
        operation_details: operationDetails,
      });

      await this.processDecision({
        request_id: request.id,
        decision: 'approved',
        decided_by: 'system',
        reason: 'Auto-approved based on confidence level',
      });

      // Update policy stats
      await this.incrementPolicyApproval(matchingPolicies[0].id);

      return {
        requires_approval: false,
        matching_policies: matchingPolicies,
        auto_approved: true,
        approval_request_id: request.id,
        reason: 'Auto-approved based on confidence level',
      };
    }

    // Create approval request
    const riskAssessment = this.assessRisk(operationType, operationDetails, options);
    const request = await this.createApprovalRequest({
      policy_id: matchingPolicies[0].id,
      task_id: options.taskId,
      agent_id: options.agentId,
      operation_type: operationType,
      operation_details: operationDetails,
      risk_assessment: riskAssessment,
    });

    return {
      requires_approval: true,
      matching_policies: matchingPolicies,
      auto_approved: false,
      approval_request_id: request.id,
      reason: `Requires approval: ${matchingPolicies.map(p => p.name).join(', ')}`,
    };
  }

  /**
   * Creates an approval request
   */
  async createApprovalRequest(input: CreateApprovalRequestInput): Promise<DbApprovalRequest> {
    const result = await queryOne<DbApprovalRequest>(
      `INSERT INTO approval_requests (
        policy_id, task_id, agent_id, operation_type, operation_details, risk_assessment
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        input.policy_id,
        input.task_id,
        input.agent_id,
        input.operation_type,
        JSON.stringify(input.operation_details),
        input.risk_assessment ? JSON.stringify(input.risk_assessment) : null,
      ]
    );

    if (!result) {
      throw new Error('Failed to create approval request');
    }

    return result;
  }

  /**
   * Processes an approval decision
   */
  async processDecision(decision: ApprovalDecision): Promise<DbApprovalRequest> {
    const status: ApprovalStatus = decision.decision === 'approved' ? 'approved' : 'rejected';

    const result = await queryOne<DbApprovalRequest>(
      `UPDATE approval_requests
       SET status = $1,
           decided_at = NOW(),
           decided_by = $2,
           decision_reason = $3
       WHERE id = $4 AND status = 'pending'
       RETURNING *`,
      [status, decision.decided_by, decision.reason, decision.request_id]
    );

    if (!result) {
      throw new Error('Approval request not found or already decided');
    }

    // Update policy stats
    if (result.policy_id) {
      if (decision.decision === 'approved') {
        await this.incrementPolicyApproval(result.policy_id);
      } else {
        await this.incrementPolicyRejection(result.policy_id);
      }
    }

    return result;
  }

  /**
   * Gets pending approval requests
   */
  async getPendingApprovals(options: {
    agentId?: string;
    taskId?: string;
    limit?: number;
  } = {}): Promise<DbApprovalRequest[]> {
    let whereClause = "status = 'pending'";
    const params: unknown[] = [];
    let paramIndex = 1;

    if (options.agentId) {
      whereClause += ` AND agent_id = $${paramIndex++}`;
      params.push(options.agentId);
    }

    if (options.taskId) {
      whereClause += ` AND task_id = $${paramIndex++}`;
      params.push(options.taskId);
    }

    const limit = options.limit || 50;

    return query<DbApprovalRequest>(
      `SELECT * FROM approval_requests
       WHERE ${whereClause}
       ORDER BY requested_at ASC
       LIMIT ${limit}`,
      params
    );
  }

  /**
   * Gets a single approval request by ID
   */
  async getApprovalRequest(requestId: string): Promise<DbApprovalRequest | null> {
    return queryOne<DbApprovalRequest>(
      'SELECT * FROM approval_requests WHERE id = $1',
      [requestId]
    );
  }

  /**
   * Waits for an approval to be decided (with timeout)
   */
  async waitForApproval(
    requestId: string,
    timeoutMs: number = 30000
  ): Promise<DbApprovalRequest> {
    const startTime = Date.now();
    const pollIntervalMs = 1000;

    while (Date.now() - startTime < timeoutMs) {
      const request = await this.getApprovalRequest(requestId);

      if (!request) {
        throw new Error('Approval request not found');
      }

      if (request.status !== 'pending') {
        return request;
      }

      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error('Approval request timed out');
  }

  /**
   * Gets approval statistics
   */
  async getApprovalStats(): Promise<ApprovalStats> {
    const result = await queryOne<{
      total_requests: string;
      pending_count: string;
      approved_count: string;
      rejected_count: string;
      auto_approved_count: string;
      avg_decision_time_ms: string;
    }>(
      `SELECT
         COUNT(*) as total_requests,
         COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
         COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
         COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
         COUNT(*) FILTER (WHERE status = 'auto_approved') as auto_approved_count,
         AVG(EXTRACT(EPOCH FROM (decided_at - requested_at)) * 1000)
           FILTER (WHERE decided_at IS NOT NULL) as avg_decision_time_ms
       FROM approval_requests`
    );

    const totalDecisions = parseInt(result?.approved_count || '0') +
                          parseInt(result?.rejected_count || '0');

    return {
      total_requests: parseInt(result?.total_requests || '0'),
      pending_count: parseInt(result?.pending_count || '0'),
      approved_count: parseInt(result?.approved_count || '0'),
      rejected_count: parseInt(result?.rejected_count || '0'),
      auto_approved_count: parseInt(result?.auto_approved_count || '0'),
      average_decision_time_ms: parseFloat(result?.avg_decision_time_ms || '0'),
      approval_rate: totalDecisions > 0
        ? parseInt(result?.approved_count || '0') / totalDecisions
        : 0,
    };
  }

  /**
   * Gets all approval policies
   */
  async getPolicies(onlyActive: boolean = true): Promise<DbApprovalPolicy[]> {
    if (onlyActive) {
      return query<DbApprovalPolicy>(
        `SELECT * FROM approval_policies WHERE is_active = true ORDER BY name`
      );
    }
    return query<DbApprovalPolicy>(
      `SELECT * FROM approval_policies ORDER BY name`
    );
  }

  /**
   * Creates a new approval policy
   */
  async createPolicy(input: {
    name: string;
    description?: string;
    trigger_type: string;
    trigger_config: Record<string, unknown>;
    auto_approve_confidence?: number;
  }): Promise<DbApprovalPolicy> {
    const result = await queryOne<DbApprovalPolicy>(
      `INSERT INTO approval_policies (name, description, trigger_type, trigger_config, auto_approve_confidence)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        input.name,
        input.description,
        input.trigger_type,
        JSON.stringify(input.trigger_config),
        input.auto_approve_confidence || 0,
      ]
    );

    if (!result) {
      throw new Error('Failed to create approval policy');
    }

    return result;
  }

  /**
   * Updates a policy's auto-approve confidence based on rubber-stamps
   */
  async updatePolicyConfidence(policyId: string): Promise<void> {
    // Calculate confidence based on approval/rejection ratio
    // Higher approval rate = higher confidence for auto-approval
    const policy = await queryOne<DbApprovalPolicy>(
      'SELECT times_approved, times_rejected, auto_approve_confidence FROM approval_policies WHERE id = $1',
      [policyId]
    );

    if (!policy) return;

    const total = policy.times_approved + policy.times_rejected;
    if (total < 5) return; // Need minimum sample size

    const approvalRate = policy.times_approved / total;

    // Increase confidence by 5% per rubber-stamp (up to 90%)
    let newConfidence = policy.auto_approve_confidence;
    if (approvalRate > 0.9 && policy.times_approved > 10) {
      newConfidence = Math.min(0.9, policy.auto_approve_confidence + 0.05);
    }

    if (newConfidence !== policy.auto_approve_confidence) {
      await query(
        `UPDATE approval_policies SET auto_approve_confidence = $1 WHERE id = $2`,
        [newConfidence, policyId]
      );
    }
  }

  private matchesPolicy(
    policy: ApprovalPolicy,
    operationType: string,
    operationDetails: OperationDetails,
    options: { estimatedCostUsd?: number }
  ): boolean {
    const config = policy.trigger_config;

    switch (policy.trigger_type) {
      case 'cost_threshold': {
        const costConfig = config as unknown as CostThresholdConfig;
        const cost = options.estimatedCostUsd || operationDetails.estimated_cost_usd || 0;
        return cost >= costConfig.threshold_usd;
      }
      case 'operation_type': {
        const opConfig = config as unknown as OperationTypeConfig;
        return opConfig.operations.includes(operationType);
      }
      case 'pattern_match': {
        const patterns = (config as { patterns: string[] }).patterns;
        const description = operationDetails.description.toLowerCase();
        return patterns.some(pattern =>
          description.includes(pattern.toLowerCase())
        );
      }
      default:
        return false;
    }
  }

  private calculateApprovalConfidence(policies: ApprovalPolicy[]): number {
    // Calculate average approval rate across matching policies
    let totalApprovals = 0;
    let totalDecisions = 0;

    for (const policy of policies) {
      totalApprovals += policy.times_approved;
      totalDecisions += policy.times_approved + policy.times_rejected;
    }

    if (totalDecisions === 0) return 0;
    return totalApprovals / totalDecisions;
  }

  private assessRisk(
    operationType: string,
    operationDetails: OperationDetails,
    options: { estimatedCostUsd?: number }
  ): RiskAssessment {
    const riskFactors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check cost
    const cost = options.estimatedCostUsd || operationDetails.estimated_cost_usd || 0;
    if (cost > 100) {
      riskFactors.push('High cost operation');
      riskLevel = 'high';
    } else if (cost > 25) {
      riskFactors.push('Moderate cost operation');
      riskLevel = 'medium';
    }

    // Check operation type
    const highRiskOps = ['deploy_production', 'delete_files', 'migrate_database'];
    if (highRiskOps.includes(operationType)) {
      riskFactors.push(`High-risk operation type: ${operationType}`);
      riskLevel = riskLevel === 'high' ? 'critical' : 'high';
    }

    // Check reversibility
    if (operationDetails.reversible === false) {
      riskFactors.push('Operation is not reversible');
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    }

    return {
      risk_level: riskLevel,
      risk_factors: riskFactors,
      confidence: 0.8,
    };
  }

  private async incrementPolicyApproval(policyId: string): Promise<void> {
    await query(
      `UPDATE approval_policies
       SET times_approved = times_approved + 1,
           updated_at = NOW()
       WHERE id = $1`,
      [policyId]
    );

    // Update confidence based on rubber-stamp rate
    await this.updatePolicyConfidence(policyId);
  }

  private async incrementPolicyRejection(policyId: string): Promise<void> {
    await query(
      `UPDATE approval_policies
       SET times_rejected = times_rejected + 1,
           updated_at = NOW()
       WHERE id = $1`,
      [policyId]
    );
  }
}

// Export singleton instance
export const approvalEngine = new ApprovalEngine();
