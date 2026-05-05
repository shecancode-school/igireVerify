import { NextRequest, NextResponse } from "next/server";
import { requireAuthOrRedirect } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await requireAuthOrRedirect();
    const formData = await req.formData();
    const file = formData.get("photo");
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Use Unsigned Upload directly to Cloudinary REST API to avoid server signature issues
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", file);
    cloudinaryFormData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "igire_attendance");
    cloudinaryFormData.append("folder", "igireverify/profiles");

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
    
    const uploadRes = await fetch(cloudinaryUrl, {
      method: "POST",
      body: cloudinaryFormData,
    });

    if (!uploadRes.ok) {
      const errorData = await uploadRes.json();
      console.error("Cloudinary upload failed:", errorData);
      return NextResponse.json({ error: "Cloudinary upload failed", details: errorData }, { status: 500 });
    }

    const data = await uploadRes.json();
    return NextResponse.json({ url: data.secure_url });
    
  } catch (err) {
    console.error("Profile photo upload error:", err);
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 });
  }
}
