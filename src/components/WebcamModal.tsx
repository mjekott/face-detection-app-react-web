/* eslint-disable @typescript-eslint/no-explicit-any */
import * as faceapi from "face-api.js";
import { useCallback, useEffect, useRef, useState } from "react";

const STEP_TIMEOUT = 7000;

interface WebcamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture?: (imageDataUrl: string) => void;
}

export default function WebcamModal({
  isOpen,
  onClose,
  onCapture,
}: WebcamModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const stepDelayRef = useRef<any>(null);
  const lastYaw = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const noFaceDetectedTimeRef = useRef<number | null>(null);

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isProcessingStep, setIsProcessingStep] = useState(false);

  const getInstruction = useCallback(() => {
    return [
      "Center your face in the box",
      "Turn your head left or right",
      "Please smile",
      "Verification completed",
    ][step];
  }, [step]);

  const speak = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }, []);

  const resetFlow = useCallback(() => {
    lastYaw.current = null;
    setStep(0);
    setIsProcessingStep(false);
  }, []);

  const advanceStep = useCallback(
    (nextStep: number, message: string) => {
      if (isProcessingStep) return;
      setIsProcessingStep(true);
      speak(message);
      stepDelayRef.current = setTimeout(() => {
        setStep(nextStep);
        setIsProcessingStep(false);
        // Close modal after completing verification
        if (nextStep === 3) {
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      }, 1000);
    },
    [isProcessingStep, speak, onClose]
  );

  const startTimeout = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      speak("Time expired. Please try again.");
      resetFlow();
    }, STEP_TIMEOUT);
  }, [speak, resetFlow]);

  const loadModels = useCallback(async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      ]);
    } catch (err) {
      setError("Failed to load face detection models");
      console.error("Model loading error:", err);
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: "user",
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraReady(true);
      }
    } catch (err) {
      setError("Failed to access camera. Please grant camera permissions.");
      console.error("Camera error:", err);
    }
  }, []);

  const isCentered = useCallback((box: faceapi.Box) => {
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    return centerX > 200 && centerX < 440 && centerY > 150 && centerY < 350;
  }, []);

  const drawBox = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 3;
    ctx.strokeRect(200, 150, 240, 200);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d")!;

    // Draw the current video frame to canvas (flip back to normal orientation for capture)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    // Convert to data URL
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.95);

    // Call the onCapture callback if provided
    if (onCapture) {
      onCapture(imageDataUrl);
    }

    // Redraw the detection box
    drawBox();
  }, [onCapture, drawBox]);

  const detectFace = useCallback(async () => {
    if (!videoRef.current || step === 3 || isProcessingStep) return;

    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    if (!detection) {
      drawBox();

      // Track no face detected time
      if (noFaceDetectedTimeRef.current === null) {
        noFaceDetectedTimeRef.current = Date.now();
      } else {
        const elapsedTime = Date.now() - noFaceDetectedTimeRef.current;
        // Reset if no face detected for 3 seconds and we're past step 0
        if (elapsedTime > 3000 && step > 0) {
          speak("Face not detected. Please start again.");
          resetFlow();
        }
      }
      return;
    }

    // Face detected, reset the no-face timer
    noFaceDetectedTimeRef.current = null;

    const { box } = detection.detection;
    const expressions = detection.expressions;
    const landmarks = detection.landmarks;

    // STEP 0 — Center face
    if (step === 0) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      const centered = isCentered(box);
      console.log(
        `Step 0: Face at (${centerX.toFixed(0)}, ${centerY.toFixed(
          0
        )}), centered: ${centered}`
      );
      if (centered) {
        console.log("Face centered! Moving to step 1");
        advanceStep(1, "Great! Now turn your head left or right");
      }
    }

    // STEP 1 — Head movement (anti-spoof)
    if (step === 1) {
      const nose = landmarks.getNose();
      const yaw = nose[0].x;

      if (lastYaw.current === null) {
        lastYaw.current = yaw;
      } else if (Math.abs(yaw - lastYaw.current) > 15) {
        advanceStep(2, "Perfect! Now give me a big smile");
      }
    }

    // STEP 2 — Smile
    if (step === 2 && expressions.happy > 0.7) {
      setIsProcessingStep(true);
      speak("Perfect smile! Hold it...");
      setTimeout(() => {
        capturePhoto();
        speak("Verification complete!");
        setTimeout(() => {
          onClose();
        }, 500);
      }, 2000);
    }

    drawBox();
  }, [step, isProcessingStep, isCentered, drawBox, advanceStep, capturePhoto, speak, onClose, resetFlow]);

  useEffect(() => {
    if (isOpen) {
      lastYaw.current = null;
      noFaceDetectedTimeRef.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadModels().then(startCamera);
    } else {
      setError(null);
      setStep(0);
      setIsCameraReady(false);
      setIsProcessingStep(false);
      noFaceDetectedTimeRef.current = null;
    }
    return () => {
      const stream = streamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (stepDelayRef.current) {
        clearTimeout(stepDelayRef.current);
      }
      window.speechSynthesis.cancel();
    };
  }, [isOpen, loadModels, startCamera]);

  // Start face detection interval when camera is ready
  useEffect(() => {
    if (isCameraReady && isOpen) {
      intervalRef.current = setInterval(detectFace, 200);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isCameraReady, isOpen, detectFace]);

  useEffect(() => {
    if (isOpen) {
      speak(getInstruction());
      startTimeout();
    }
    return () => clearTimeout(timerRef.current);
  }, [step, isOpen, speak, getInstruction, startTimeout]);

  if (!isOpen) return null;

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <button onClick={onClose} style={closeButtonStyle}>
          ×
        </button>

        {error ? (
          <div style={errorStyle}>{error}</div>
        ) : (
          <div style={{ position: "relative", width: 640 }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              width={640}
              height={480}
              style={{ transform: "scaleX(-1)" }}
            />

            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                transform: "scaleX(-1)",
              }}
            />

            <div style={instructionStyle}>{getInstruction()}</div>
          </div>
        )}
      </div>
    </div>
  );
}

const modalOverlayStyle = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalContentStyle = {
  position: "relative" as const,
  backgroundColor: "#1a1a1a",
  borderRadius: 12,
  padding: 20,
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
};

const closeButtonStyle = {
  position: "absolute" as const,
  top: 10,
  right: 10,
  background: "rgba(255, 255, 255, 0.1)",
  border: "none",
  color: "#fff",
  fontSize: 32,
  width: 40,
  height: 40,
  borderRadius: 20,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1001,
  lineHeight: "32px",
  padding: 0,
};

const instructionStyle = {
  position: "absolute" as const,
  bottom: 20,
  left: "50%",
  transform: "translateX(-50%)",
  background: "rgba(0,0,0,0.7)",
  color: "#fff",
  padding: "12px 20px",
  borderRadius: 8,
  fontSize: 18,
};

const errorStyle = {
  padding: "40px",
  color: "#ff6b6b",
  fontSize: 18,
  textAlign: "center" as const,
  minWidth: 400,
};
