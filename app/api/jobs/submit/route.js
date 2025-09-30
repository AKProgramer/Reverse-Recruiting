import { NextResponse } from 'next/server';
import { refreshAccessToken } from '@/lib/oauth';

export async function POST(request) {
  try {
    const formData = await request.json();
    
    // Get tokens from cookies
    const accessToken = request.cookies.get('google_access_token')?.value;
    const refreshToken = request.cookies.get('google_refresh_token')?.value;

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'Not authenticated. Please connect your Google account first.' },
        { status: 401 }
      );
    }

    // Prepare data for n8n webhook
    const webhookData = {
      ...formData,
      access_token: accessToken,
      timestamp: new Date().toISOString()
    };

    // Send data to n8n webhook
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData)
    });

    if (!webhookResponse.ok) {
      // If token is expired, try to refresh it
      if (webhookResponse.status === 401) {
        try {
          console.log('Access token expired, attempting to refresh...');
          const newTokens = await refreshAccessToken(refreshToken);
          
          // Retry the request with new token
          const retryData = {
            ...formData,
            access_token: newTokens.access_token,
            timestamp: new Date().toISOString()
          };

          const retryResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(retryData)
          });

          if (!retryResponse.ok) {
            throw new Error(`Webhook request failed after token refresh: ${retryResponse.status}`);
          }

          const retryResult = await retryResponse.json();

          // Update cookies with new access token
          const response = NextResponse.json({
            success: true,
            message: 'Job data submitted successfully',
            data: retryResult
          });

          const newAccessTokenExpiry = new Date(Date.now() + (newTokens.expires_in * 1000));
          response.cookies.set('google_access_token', newTokens.access_token, {
            expires: newAccessTokenExpiry,
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/'
          });

          return response;

        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          return NextResponse.json(
            { error: 'Authentication expired. Please reconnect your Google account.' },
            { status: 401 }
          );
        }
      }

      const errorText = await webhookResponse.text();
      throw new Error(`Webhook request failed: ${webhookResponse.status} - ${errorText}`);
    }

    const result = await webhookResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Job data submitted successfully',
      data: result
    });

  } catch (error) {
    console.error('Job submission error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to submit job data', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}