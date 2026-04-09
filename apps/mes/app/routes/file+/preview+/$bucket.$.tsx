import { requirePermissions } from "@carbon/auth/auth.server";
import { getCarbonServiceRole } from "@carbon/auth/client.server";
import type { LoaderFunctionArgs } from "react-router";

const supportedFileTypes: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  svg: "image/svg+xml",
  avif: "image/avif",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  wmv: "video/x-ms-wmv",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  flac: "audio/flac",
  dxf: "application/dxf",
  dwg: "application/dxf",
  stl: "application/stl",
  obj: "application/obj",
  glb: "application/glb",
  gltf: "application/gltf",
  fbx: "application/fbx",
  ply: "application/ply",
  off: "application/off",
  step: "application/step"
};

export let loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { companyId } = await requirePermissions(request, {});
  const { bucket } = params;
  let path = params["*"];

  if (!bucket) throw new Error("Bucket not found");
  if (!path) throw new Error("Path not found");

  // Don't decode the path here - let Supabase handle the URL encoding
  // path = decodeURIComponent(path);

  const fileType = path.split(".").pop()?.toLowerCase();

  if (!fileType) {
    return new Response(null, { status: 400 });
  }
  const contentType = supportedFileTypes[fileType];

  // Check that the bucket matches the user's companyId for security
  if (bucket !== companyId) {
    return new Response(null, { status: 403 });
  }

  const serviceRole = getCarbonServiceRole();

  async function downloadFromBucket(bucketId: string, objectPath: string) {
    const bucketClient = serviceRole.storage.from(bucketId);
    const direct = await bucketClient.download(objectPath);
    if (!direct.error) return direct.data;

    return null;
  }

  async function downloadFile() {
    if (!path) throw new Error("Path not found");
    // Try company bucket first (new format)
    const companyData = await downloadFromBucket(bucket!, path);
    if (companyData) return companyData;

    // Fallback: try legacy private bucket with companyId prefix (pre-migration files)
    const legacyData = await downloadFromBucket("private", `${bucket}/${path}`);
    if (legacyData) return legacyData;

    if (process.env.NODE_ENV !== "production") {
      console.error("Storage download failed (new + legacy)", {
        companyBucket: bucket,
        path,
        legacyPath: `${bucket}/${path}`
      });
    }
    return null;
  }

  let fileData = await downloadFile();
  if (!fileData) {
    // Wait for a second and try again
    await new Promise((resolve) => setTimeout(resolve, 1000));
    fileData = await downloadFile();
    if (!fileData) {
      throw new Error("Failed to download file after retry");
    }
  }

  const headers = new Headers({
    "Cache-Control": "private, max-age=31536000, immutable"
  });

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  return new Response(fileData, { status: 200, headers });
};
