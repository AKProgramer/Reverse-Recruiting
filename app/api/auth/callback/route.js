import { NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/oauth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    // Check if code is present
    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(
        new URL('/?error=no_code', request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Calculate expiry time for access token
    const expiresAt = Date.now() + (tokens.expires_in * 1000);

    // Create response with redirect that includes token data
    const tokenData = {
      access_token: tokens.access_token,
      expires_at: expiresAt,
      token_type: tokens.token_type || 'Bearer'
    };

    // Encode token data for URL (will be stored in localStorage by client)
    const encodedTokenData = encodeURIComponent(JSON.stringify(tokenData));
    const encodedRefreshToken = encodeURIComponent(tokens.refresh_token);

    const response = NextResponse.redirect(
      new URL(`/?auth=success&token_data=${encodedTokenData}&refresh_token=${encodedRefreshToken}`, request.url)
    );

    return response;

  } catch (error) {
    console.error('OAuth callback error:', error);
    
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}