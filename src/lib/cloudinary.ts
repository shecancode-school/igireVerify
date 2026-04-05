export async function uploadToCloudinary(
  data: File | string,
  folder: string = "attendance"
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    throw new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set in .env.local");
  }

  const formData = new FormData();
  formData.append("file", data);
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

  const json = (await response.json()) as { secure_url?: string; error?: any };

  if (!json.secure_url) {
    throw new Error(`Cloudinary upload response invalid: ${JSON.stringify(json)}`);
  }

  return json.secure_url; 
}