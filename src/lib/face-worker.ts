import * as faceapi from 'face-api.js';

if (typeof self !== 'undefined') {
  faceapi.env.monkeyPatch({
    Canvas: OffscreenCanvas as any,
    createCanvasElement: () => new OffscreenCanvas(128, 128) as any,
  });
}


let modelsLoaded = false;


async function loadModels() {
  if (modelsLoaded) return;
  const MODEL_URL = '/models';
  try {
    console.log("Worker: Loading models from", MODEL_URL);
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    console.log("Worker: Models loaded successfully");
    self.postMessage({ type: 'MODELS_LOADED' });
  } catch (err: any) {
    console.error("Worker: Model load failed", err);
    self.postMessage({ type: 'ERROR', payload: "Failed to load models: " + err.message });
  }
}

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  if (type === 'LOAD_MODELS') {
    await loadModels();
  }

  if (type === 'DETECT_FACE') {
    if (!modelsLoaded) {
    
      await loadModels();
      return;
    }

    try {
      const { imageData, options } = payload;
      const canvas = new OffscreenCanvas(imageData.width, imageData.height);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(imageData, 0, 0);
        
        
        let brightness = 0;
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          brightness += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        }
        brightness = brightness / (imageData.width * imageData.height);

        if (brightness < 40 || brightness > 220) {
          self.postMessage({ type: 'QUALITY_ERROR', payload: brightness < 40 ? "Too dark" : "Too bright" });
          return;
        }

        const detection = await faceapi
          .detectSingleFace(canvas as any, new faceapi.TinyFaceDetectorOptions(options))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          const leftEye = detection.landmarks.getLeftEye();
          const rightEye = detection.landmarks.getRightEye();
        
          
          const calculateEAR = (eye: faceapi.Point[]) => {
            const v1 = Math.sqrt(Math.pow(eye[1].x - eye[5].x, 2) + Math.pow(eye[1].y - eye[5].y, 2));
            const v2 = Math.sqrt(Math.pow(eye[2].x - eye[4].x, 2) + Math.pow(eye[2].y - eye[4].y, 2));
            const h = Math.sqrt(Math.pow(eye[0].x - eye[3].x, 2) + Math.pow(eye[0].y - eye[3].y, 2));
            return (v1 + v2) / (2.0 * h);
          };

          const avgEAR = (calculateEAR(leftEye) + calculateEAR(rightEye)) / 2.0;
          const isBlinking = avgEAR < 0.25;

          const nose = detection.landmarks.getNose();
          const leftEyeCenter = leftEye[3];
          const rightEyeCenter = rightEye[0];
          const distToLeft = Math.abs(nose[0].x - leftEyeCenter.x);
          const distToRight = Math.abs(nose[0].x - rightEyeCenter.x);
          const yaw = (distToLeft / distToRight) - 1.0;

          self.postMessage({
            type: 'FACE_DETECTED',
            payload: {
              descriptor: Array.from(detection.descriptor),
              isBlinking,
              yaw,
              ear: avgEAR,
              box: detection.detection.box
            }
          });
        } else {
          self.postMessage({ type: 'FACE_NOT_FOUND' });
        }
      }
    } catch (error: any) {
      self.postMessage({ type: 'ERROR', payload: error.message });
    }
  }
};
