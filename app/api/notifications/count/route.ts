import { NextResponse } from 'next/server';
import { notificationService } from '@/lib/services/NotificationService';

export async function GET() {
  try {
    const count = await notificationService.getUnreadCount();

    return NextResponse.json({
      success: true,
      data: { unread: count },
    });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notification count' },
      { status: 500 }
    );
  }
}
