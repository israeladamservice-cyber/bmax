import { getUploadAuthParams } from "@imagekit/next/server";

export async function GET() {
  try {
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
      console.error("ImageKit environment variables are missing.");

      return Response.json(
        {
          error: "ImageKit environment variables are not configured.",
        },
        { status: 500 }
      );
    }

    const { token, expire, signature } = getUploadAuthParams({
      privateKey,
      publicKey,
    });

    return Response.json({
      token,
      expire,
      signature,
      publicKey,
    });
  } catch (error) {
    console.error("ImageKit authentication error:", error);

    return Response.json(
      {
        error: "Unable to create ImageKit upload authentication.",
      },
      { status: 500 }
    );
  }
}
