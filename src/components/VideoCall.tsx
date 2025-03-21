import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { Socket } from 'socket.io-client';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface VideoCallProps {
  socket: Socket;
  roomId: string;
}

const VideoCall: React.FC<VideoCallProps> = ({ socket, roomId }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peer, setPeer] = useState<Peer.Instance | null>(null);
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);
  const [signText, setSignText] = useState<string>('');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Initialize MediaPipe Hand Landmarker
    const initializeHandLandmarker = async () => {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      const handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 2
      });
      setHandLandmarker(handLandmarker);
    };

    initializeHandLandmarker();

    // Get user media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const newPeer = new Peer({
          initiator: true,
          trickle: false,
          stream
        });

        newPeer.on('signal', (data) => {
          socket.emit('signal', { signal: data, roomId });
        });

        newPeer.on('stream', (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        });

        setPeer(newPeer);
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (peer) {
        peer.destroy();
      }
    };
  }, []);

  // Handle incoming signals
  useEffect(() => {
    socket.on('signal', (data) => {
      if (peer) {
        peer.signal(data.signal);
      }
    });

    return () => {
      socket.off('signal');
    };
  }, [peer]);

  // Process video frames for sign language detection
  const processFrame = async () => {
    if (!handLandmarker || !localVideoRef.current) return;

    const detections = await handLandmarker.detectForVideo(localVideoRef.current, Date.now());
    
    if (detections.landmarks.length > 0) {
      // Here you would implement the sign language recognition logic
      // This is a simplified example - you'd need a more sophisticated model
      interpretSignLanguage(detections.landmarks);
    }

    requestAnimationFrame(processFrame);
  };

  const interpretSignLanguage = (landmarks: any) => {
    // Simplified example - in reality, you'd need a trained model
    // This is just a placeholder to show the concept
    const gesture = analyzeGesture(landmarks);
    setSignText(gesture);
  };

  const analyzeGesture = (landmarks: any) => {
    // Placeholder for gesture recognition
    // In reality, this would use a trained model to recognize signs
    return "Hello"; // Example output
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="grid grid-cols-2 gap-4 w-full max-w-4xl">
        <div className="relative">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full rounded-lg"
          />
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded">
            You
          </div>
        </div>
        <div className="relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg"
          />
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded">
            Remote User
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-white rounded-lg shadow-lg w-full max-w-4xl">
        <h3 className="text-lg font-semibold mb-2">Sign Language Interpretation</h3>
        <p className="text-gray-700">{signText}</p>
      </div>
    </div>
  );
};

export default VideoCall;