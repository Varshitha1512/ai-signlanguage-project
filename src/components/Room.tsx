import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import VideoCall from './VideoCall';
import Timmy from './Timmy';
import { Canvas } from '@react-three/fiber';

const Room = () => {
  const { roomId } = useParams();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000'); // Replace with your server URL
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  if (!socket) return <div>Connecting...</div>;

  return (
    <div className="flex min-h-screen">
      <div className="w-3/4">
        <VideoCall socket={socket} roomId={roomId} />
      </div>
      <div className="w-1/4 relative">
        <Canvas className="h-full">
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Timmy position={[0, -1, 0]} scale={[0.5, 0.5, 0.5]} />
        </Canvas>
      </div>
    </div>
  );
};

export default Room;