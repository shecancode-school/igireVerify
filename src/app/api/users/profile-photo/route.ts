import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAuthOrRedirect } from "@/lib/auth";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    await requireAuthOrRedirect();
    const formData = await req.formData();
    const file = formData.get("photo");
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    let buffer: Buffer;
    if (typeof file === "object" && "arrayBuffer" in file) {
      buffer = Buffer.from(await (file as Blob).arrayBuffer());
    } else {
      return NextResponse.json({ error: "Invalid file upload" }, { status: 400 });
    }
  
    const upload = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({
        folder: "igireverify/profiles",
        upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
      }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }).end(buffer);
    });
    // @ts-ignore
    return NextResponse.json({ url: upload.secure_url });
  } catch (err) {
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 });
  }
}
