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
  // Points for an eye:
  // p1 (left), p2 (top-left), p3 (top-right), p4 (right), p5 (bottom-right), p6 (bottom-left)
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

  // Threshold for closed eyes is typically around 0.2 - 0.25
  return avgEAR < 0.22;
}

/**
 * Gets the 128-point face descriptor for identity comparison.
 */
export async function getFaceDescriptor(input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) {
  const detection = await faceapi
    .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection ? detection.descriptor : null;
}

/**
 * Compares two face descriptors and returns the Euclidean distance.
 * 0.6 or less is typically considered a match.
 */
export function compareFaces(descriptor1: Float32Array | number[], descriptor2: Float32Array | number[]) {
  const d1 = descriptor1 instanceof Float32Array ? descriptor1 : new Float32Array(descriptor1);
  const d2 = descriptor2 instanceof Float32Array ? descriptor2 : new Float32Array(descriptor2);
  
  return faceapi.euclideanDistance(d1, d2);
}
