/**
 * Uploads an image to Cloudinary using a signed or unsigned preset.
 */
export async function uploadToCloudinary(
  data: File | string,
  folder: string = "attendance"
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    throw new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set in environment.");
  }

  const formData = new FormData();
  
  // Handle base64 strings properly by converting to Blob manually (avoiding fetch CSP issues)
  if (typeof data === 'string' && data.startsWith('data:')) {
    const parts = data.split(',');
    const mime = parts[0].match(/:(.*?);/)![1];
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    formData.append("file", blob, "capture.jpg");
  } else {
    formData.append("file", data);
  }

  formData.append("upload_preset", "igire_attendance");
  formData.append("folder", folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[CLOUDINARY_UPLOAD_ERROR]", errorText);
      throw new Error(`Upload failed: ${errorText}`);
    }

    const json = (await response.json()) as { secure_url?: string; error?: any };

    if (!json.secure_url) {
      throw new Error("Invalid response from storage provider.");
    }

    return json.secure_url;
  } catch (error) {
    console.error("[FETCH_CRITICAL_ERROR]", error);
    throw new Error("Network connection error while uploading photo. Please try again.");
  }
}