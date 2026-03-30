// src/lib/cloudinary.ts
export async function uploadToCloudinary(
  dataUrl: string, 
  folder: string = "attendance"
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    throw new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set in .env.local");
  }

  const formData = new FormData();
  formData.append("file", dataUrl);
  formData.append("upload_preset", "igire_attendance");
  formData.append("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary upload failed: ${errorText}`);
  }

  const data = await response.json();
  return data.secure_url; // This is the permanent Cloudinary URL
}