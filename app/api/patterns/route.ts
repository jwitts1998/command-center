import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import { patternDetector } from '@/lib/services/PatternDetector';
import { patternApplicator } from '@/lib/services/PatternApplicator';

/**
 * GET /api/patterns
 *
 * Get patterns with optional filters:
 * - ?type=clarification_preference
 * - ?min_confidence=0.5
 * - ?auto_apply=true
 * - ?project_id=xxx (get suggestions for project)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const minConfidence = searchParams.get('min_confidence');
    const autoApply = searchParams.get('auto_apply');
    const projectId = searchParams.get('project_id');

    // If project_id provided, get suggestions
    if (projectId) {
      const suggestions = await patternApplicator.getPatternSuggestions(projectId);
      return NextResponse.json({
        success: true,
        data: suggestions,
      });
    }

    // Otherwise get all patterns with filters
    let sql = `SELECT * FROM patterns WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (type) {
      sql += ` AND pattern_type = $${paramIndex++}`;
      params.push(type);
    }

    if (minConfidence) {
      sql += ` AND confidence >= $${paramIndex++}`;
      params.push(parseFloat(minConfidence));
    }

    if (autoApply === 'true') {
      sql += ` AND auto_apply = true`;
    } else if (autoApply === 'false') {
      sql += ` AND auto_apply = false`;
    }

    sql += ` ORDER BY confidence DESC, times_applied DESC`;

    const patterns = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: patterns,
    });
  } catch (error) {
    console.error('Error fetching patterns:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/patterns
 *
 * Trigger pattern detection for a project or accept/reject a pattern
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Detect patterns for a project
    if (body.action === 'detect' && body.projectId) {
      const patterns = await patternDetector.detectPatternsFromSessions(body.projectId);

      if (patterns.length > 0) {
        const stored = await patternDetector.storePatterns(patterns, [body.projectId]);
        return NextResponse.json({
          success: true,
          data: {
            detected: patterns.length,
            stored: stored.length,
            patterns: stored,
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          detected: 0,
          stored: 0,
          patterns: [],
        },
      });
    }

    // Detect cross-project patterns
    if (body.action === 'detect-cross-project') {
      const patterns = await patternDetector.detectCrossProjectPatterns();

      if (patterns.length > 0) {
        const stored = await patternDetector.storePatterns(patterns, []);
        return NextResponse.json({
          success: true,
          data: {
            detected: patterns.length,
            stored: stored.length,
            patterns: stored,
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          detected: 0,
          stored: 0,
          patterns: [],
        },
      });
    }

    // Accept or reject a pattern
    if (body.action === 'respond' && body.patternId) {
      await patternApplicator.respondToSuggestion(
        body.patternId,
        body.accepted === true,
        body.projectId
      );

      return NextResponse.json({
        success: true,
        message: body.accepted ? 'Pattern accepted' : 'Pattern rejected',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in patterns POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/patterns
 *
 * Update a pattern (e.g., toggle auto_apply)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { patternId, autoApply } = body;

    if (!patternId) {
      return NextResponse.json(
        { success: false, error: 'patternId required' },
        { status: 400 }
      );
    }

    if (typeof autoApply === 'boolean') {
      await query(
        `UPDATE patterns SET auto_apply = $1, updated_at = NOW() WHERE id = $2`,
        [autoApply, patternId]
      );
    }

    const updated = await queryOne(
      `SELECT * FROM patterns WHERE id = $1`,
      [patternId]
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating pattern:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/patterns
 *
 * Delete a pattern
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patternId = searchParams.get('id');

    if (!patternId) {
      return NextResponse.json(
        { success: false, error: 'Pattern ID required' },
        { status: 400 }
      );
    }

    await query(`DELETE FROM patterns WHERE id = $1`, [patternId]);

    return NextResponse.json({
      success: true,
      message: 'Pattern deleted',
    });
  } catch (error) {
    console.error('Error deleting pattern:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
