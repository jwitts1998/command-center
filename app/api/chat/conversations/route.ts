import { NextRequest, NextResponse } from 'next/server';
import {
  listConversations,
  createConversation,
  searchConversations,
} from '@/lib/chat/ConversationStore';

// GET /api/chat/conversations - List conversations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const activeOnly = searchParams.get('active') === 'true';

    let conversations;

    if (search) {
      conversations = await searchConversations(search, { limit });
    } else {
      conversations = await listConversations({
        isActive: activeOnly ? true : undefined,
        limit,
        offset,
      });
    }

    return NextResponse.json({
      conversations,
      count: conversations.length,
    });
  } catch (error) {
    console.error('Error listing conversations:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to list conversations',
      },
      { status: 500 }
    );
  }
}

// POST /api/chat/conversations - Create new conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, context } = body;

    const conversation = await createConversation({
      title,
      context,
    });

    return NextResponse.json({
      conversation,
      success: true,
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create conversation',
      },
      { status: 500 }
    );
  }
}
