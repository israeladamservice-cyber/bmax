import { getUploadAuthParams } from "@imagekit/next/server";

export async function GET() {
  try {
    const { token, expire, signature } = getUploadAuthParams({
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    });

    return Response.json({
      token,
      expire,
      signature,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    });
  } catch (error) {
    console.error("ImageKit auth error:", error);

    return Response.json(
      { error: "Unable to authenticate ImageKit upload" },
      { status: 500 }
    );
  }
}
