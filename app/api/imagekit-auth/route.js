import { getUploadAuthParams } from "@imagekit/next/server";

export async function GET() {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return Response.json(
      { error: "ImageKit configuration is missing." },
      { status: 500 }
    );
  }

  const { token, expire, signature } =
    getUploadAuthParams({
      privateKey,
      publicKey,
    });

  return Response.json({
    token,
    expire,
    signature,
    publicKey,
  });
}
