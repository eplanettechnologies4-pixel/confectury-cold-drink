import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Validate the order ID (mock)
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // In a real application, you would:
    // 1. Fetch order details from database (e.g. Supabase)
    // 2. Generate HTML email content
    // 3. Send email using Resend, SendGrid, Amazon SES, etc.
    // 4. Log the action to the receipt_logs table

    // Simulate network delay and email provider processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock successful response
    return NextResponse.json(
      {
        success: true,
        message: 'Receipt emailed successfully',
        data: {
          orderId,
          email,
          sentAt: new Date().toISOString(),
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error emailing receipt:', error);
    return NextResponse.json(
      { error: 'Internal server error while sending receipt' },
      { status: 500 }
    );
  }
}
