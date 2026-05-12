import * as faceapi from 'face-api.js';

let modelsLoaded = false;

/**
 * Loads the necessary models for face detection, landmarks, and recognition.
 */
export async function loadFaceApiModels() {
  if (modelsLoaded) return;

  const MODEL_URL = '/models';
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);

  modelsLoaded = true;
}

/**
 * Calculates the Eye Aspect Ratio (EAR) to detect blinking.
 */
export function calculateEAR(eye: faceapi.Point[]) {
  const p1 = eye[0];
  const p2 = eye[1];
  const p3 = eye[2];
  const p4 = eye[3];
  const p5 = eye[4];
  const p6 = eye[5];

  const vertical1 = Math.sqrt(Math.pow(p2.x - p6.x, 2) + Math.pow(p2.y - p6.y, 2));
  const vertical2 = Math.sqrt(Math.pow(p3.x - p5.x, 2) + Math.pow(p3.y - p5.y, 2));
  const horizontal = Math.sqrt(Math.pow(p1.x - p4.x, 2) + Math.pow(p1.y - p4.y, 2));

  return (vertical1 + vertical2) / (2.0 * horizontal);
}

/**
 * Detects if the eyes are closed (EAR below threshold).
 */
export function isEyeClosed(landmarks: faceapi.FaceLandmarks68) {
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();

  const leftEAR = calculateEAR(leftEye);
  const rightEAR = calculateEAR(rightEye);

  const avgEAR = (leftEAR + rightEAR) / 2.0;

  return avgEAR < 0.22;
}

/**
 * Calculates the Mouth Aspect Ratio (MAR) to detect speaking/yawning (liveness).
 */
export function calculateMAR(landmarks: faceapi.FaceLandmarks68) {
  const mouth = landmarks.getMouth();
  // Inner lips vertical: [14, 18], [15, 17]
  // Inner lips horizontal: [13, 16]
  const p14 = mouth[14];
  const p18 = mouth[18];
  const p15 = mouth[15];
  const p17 = mouth[17];
  const p13 = mouth[13];
  const p16 = mouth[16];

  const v1 = Math.sqrt(Math.pow(p14.x - p18.x, 2) + Math.pow(p14.y - p18.y, 2));
  const v2 = Math.sqrt(Math.pow(p15.x - p17.x, 2) + Math.pow(p15.y - p17.y, 2));
  const h = Math.sqrt(Math.pow(p13.x - p16.x, 2) + Math.pow(p13.y - p16.y, 2));

  return (v1 + v2) / (2.0 * h);
}

/**
 * Gets the 128-point face descriptor for identity comparison.
 */
export async function getFaceDescriptor(input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) {
  const detection = await faceapi
    .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;

  return {
    descriptor: detection.descriptor,
    landmarks: detection.landmarks,
    detection: detection.detection
  };
}

/**
 * Professional Face Alignment: Extracts a square, aligned face image.
 */
export async function extractAlignedFace(input: HTMLVideoElement | HTMLCanvasElement, landmarks: faceapi.FaceLandmarks68) {
  const regionsToExtract = [
    new faceapi.Rect(
      landmarks.getLeftEye()[0].x - 50,
      landmarks.getLeftEye()[0].y - 50,
      200,
      200
    )
  ];
  return faceapi.extractFaces(input, regionsToExtract);
}

/**
 * Checks for image quality (Lighting).
 */
export function checkImageQuality(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { ok: false, reason: "Internal Error" };

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let brightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    brightness += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }
  brightness = brightness / (canvas.width * canvas.height);

  if (brightness < 40) return { ok: false, reason: "Too dark. Please find better lighting.", value: brightness };
  if (brightness > 220) return { ok: false, reason: "Too bright. Avoid direct sunlight.", value: brightness };

  return { ok: true, brightness };
}

/**
 * Compares two face descriptors and returns the Euclidean distance.
 * 0.5 or less is considered a very strong match.
 */
export function compareFaces(descriptor1: Float32Array | number[], descriptor2: Float32Array | number[]) {
  const d1 = descriptor1 instanceof Float32Array ? descriptor1 : new Float32Array(descriptor1);
  const d2 = descriptor2 instanceof Float32Array ? descriptor2 : new Float32Array(descriptor2);

  return faceapi.euclideanDistance(d1, d2);
}

/**
 * Smoothing logic: Averages multiple descriptors to reduce noise.
 */
export function getAverageDescriptor(descriptors: (Float32Array | number[])[]) {
  if (descriptors.length === 0) return null;
  const size = 128;
  const average = new Float32Array(size).fill(0);
  
  for (const desc of descriptors) {
    const d = desc instanceof Float32Array ? desc : new Float32Array(desc);
    for (let i = 0; i < size; i++) {
      average[i] += d[i];
    }
  }

  for (let i = 0; i < size; i++) {
    average[i] /= descriptors.length;
  }

  return average;
}
