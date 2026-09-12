import { NextResponse } from 'next/server';
import ImageKit from 'imagekit';

export async function GET() {
  try {
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

    if (!publicKey || !privateKey || !urlEndpoint) {
      return NextResponse.json(
        { error: 'ImageKit environment variables are missing' },
        { status: 500 }
      );
    }

    const imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });

    const authenticationParameters = imagekit.getAuthenticationParameters();

    return NextResponse.json(authenticationParameters);
  } catch (error) {
    console.error('ImageKit authentication error:', error);

    return NextResponse.json(
      { error: 'Could not create ImageKit authentication parameters' },
      { status: 500 }
    );
  }
}
