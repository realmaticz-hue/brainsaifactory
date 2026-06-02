import { useRef, useState, useCallback } from 'react';
import { Video, Download, StopCircle } from 'lucide-react';

interface VideoRecorderProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  audioStream?: MediaStream;
  onRecordingComplete?: (blob: Blob) => void;
}

export function VideoRecorder({ canvasRef, audioStream, onRecordingComplete }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not available for recording');
      return;
    }

    try {
      // Get video stream from canvas
      const videoStream = canvas.captureStream(30); // 30 FPS
      
      // Combine with audio if available
      let combinedStream: MediaStream;
      if (audioStream) {
        combinedStream = new MediaStream([
          ...videoStream.getVideoTracks(),
          ...audioStream.getAudioTracks()
        ]);
      } else {
        combinedStream = videoStream;
      }

      // Create media recorder
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        if (onRecordingComplete) {
          onRecordingComplete(blob);
        }
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [canvasRef, audioStream, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      console.log('Recording stopped');
    }
  }, [isRecording]);

  const downloadVideo = useCallback(() => {
    if (!recordedBlob) return;

    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ugc-video-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [recordedBlob]);

  return (
    <div className="flex gap-2">
      {!isRecording && !recordedBlob && (
        <button
          onClick={startRecording}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2 font-semibold"
        >
          <Video className="w-4 h-4" />
          Record Video
        </button>
      )}

      {isRecording && (
        <button
          onClick={stopRecording}
          className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all flex items-center justify-center gap-2 font-semibold animate-pulse"
        >
          <StopCircle className="w-4 h-4" />
          Stop Recording
        </button>
      )}

      {recordedBlob && (
        <>
          <button
            onClick={downloadVideo}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2 font-semibold"
          >
            <Download className="w-4 h-4" />
            Download Video
          </button>
          <button
            onClick={() => {
              setRecordedBlob(null);
              chunksRef.current = [];
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
          >
            Record Again
          </button>
        </>
      )}
    </div>
  );
}
