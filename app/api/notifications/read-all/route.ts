import { NextResponse } from 'next/server';
import { notificationService } from '@/lib/services/NotificationService';

export async function POST() {
  try {
    const count = await notificationService.markAllAsRead();

    return NextResponse.json({
      success: true,
      data: { marked_count: count },
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
