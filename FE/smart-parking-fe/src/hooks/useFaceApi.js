import { useState, useCallback, useRef } from 'react';

// ── Config ──────────────────────────────────────────────────────────────────
const MODEL_URL      = '/models';
export const MATCH_THRESHOLD = 0.6;

// ── Lazy faceapi singleton (dynamic import để không block page load) ──────────
let faceapiModule = null;
const getFaceApi = async () => {
  if (!faceapiModule) {
    faceapiModule = await import('@vladmandic/face-api');
  }
  return faceapiModule;
};

// ── LocalStorage helpers ─────────────────────────────────────────────────────
const LS_KEY = (sessionId) => `face_desc_${sessionId}`;

export function saveFaceDescriptor(sessionId, descriptor) {
  try {
    localStorage.setItem(LS_KEY(sessionId), JSON.stringify(Array.from(descriptor)));
  } catch { /* quota exceeded, ignore */ }
}

export function loadFaceDescriptor(sessionId) {
  try {
    const raw = localStorage.getItem(LS_KEY(sessionId));
    if (!raw) return null;
    return new Float32Array(JSON.parse(raw));
  } catch { return null; }
}

export function clearFaceDescriptor(sessionId) {
  try { localStorage.removeItem(LS_KEY(sessionId)); } catch { /* ignore */ }
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export default function useFaceApi() {
  const [modelsLoaded,  setModelsLoaded]  = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError,    setModelError]    = useState('');
  const loadingRef = useRef(false);

  // Load tất cả model cần thiết — chỉ gọi khi user thực sự vào step camera
  const loadModels = useCallback(async () => {
    if (modelsLoaded || loadingRef.current) return;
    loadingRef.current = true;
    setLoadingModels(true);
    setModelError('');
    try {
      const faceapi = await getFaceApi();
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    } catch (err) {
      console.error('[face-api] load models error:', err);
      setModelError('Không thể tải model nhận diện khuôn mặt.');
    } finally {
      setLoadingModels(false);
      loadingRef.current = false;
    }
  }, [modelsLoaded]);

  /**
   * Detect và trả về face descriptor từ videoRef
   */
  const captureDescriptor = useCallback(async (videoRef) => {
    if (!modelsLoaded) throw new Error('Models chưa được tải');
    const faceapi = await getFaceApi();
    const video = videoRef.current;
    if (!video) throw new Error('Không tìm thấy video element');

    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    return detection?.descriptor ?? null;
  }, [modelsLoaded]);

  /**
   * So sánh 2 face descriptors
   */
  const compareDescriptors = useCallback(async (d1, d2, threshold = MATCH_THRESHOLD) => {
    if (!d1 || !d2) return { match: false, distance: 1 };
    const faceapi = await getFaceApi();
    const distance = faceapi.euclideanDistance(d1, d2);
    return { match: distance < threshold, distance: parseFloat(distance.toFixed(3)) };
  }, []);

  /**
   * Detect khuôn mặt và vẽ bounding box lên canvas overlay
   */
  const detectAndDraw = useCallback(async (videoRef, canvasRef) => {
    if (!modelsLoaded) return null;
    const faceapi = await getFaceApi();
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    const displaySize = {
      width:  video.videoWidth  || video.clientWidth,
      height: video.videoHeight || video.clientHeight,
    };
    if (!displaySize.width || !displaySize.height) return null;

    faceapi.matchDimensions(canvas, displaySize);

    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
      .withFaceLandmarks();

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (detection) {
      const resized = faceapi.resizeResults(detection, displaySize);
      const box = resized.detection.box;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth   = 2.5;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
    }

    return detection ?? null;
  }, [modelsLoaded]);

  return {
    modelsLoaded,
    loadingModels,
    modelError,
    loadModels,
    captureDescriptor,
    compareDescriptors,
    detectAndDraw,
  };
}
