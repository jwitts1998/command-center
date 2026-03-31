import { NextRequest, NextResponse } from 'next/server';
import {
  getConversationWithMessages,
  updateConversation,
  deleteConversation,
} from '@/lib/chat/ConversationStore';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/chat/conversations/[id] - Get conversation with messages
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const messageLimit = parseInt(searchParams.get('limit') || '100', 10);

    const conversation = await getConversationWithMessages(id, messageLimit);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        userId: conversation.userId,
        title: conversation.title,
        context: conversation.context,
        isActive: conversation.isActive,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
      messages: conversation.messages,
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get conversation',
      },
      { status: 500 }
    );
  }
}

// PUT /api/chat/conversations/[id] - Update conversation
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, context, isActive } = body;

    const conversation = await updateConversation(id, {
      title,
      context,
      isActive,
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      conversation,
      success: true,
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update conversation',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/chat/conversations/[id] - Delete conversation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const deleted = await deleteConversation(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete conversation',
      },
      { status: 500 }
    );
  }
}
