import { NextResponse } from 'next/server';
import { notificationService } from '@/lib/services/NotificationService';
import type { NotificationType } from '@/types/notification';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as NotificationType | null;
    const is_read = searchParams.get('is_read');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const notifications = await notificationService.list({
      type: type || undefined,
      is_read: is_read !== null ? is_read === 'true' : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: notifications,
      total: notifications.length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, title, message, metadata, expires_at } = body;

    if (!type || !title) {
      return NextResponse.json(
        { success: false, error: 'Type and title are required' },
        { status: 400 }
      );
    }

    const notification = await notificationService.create({
      type,
      title,
      message,
      metadata,
      expires_at: expires_at ? new Date(expires_at) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
