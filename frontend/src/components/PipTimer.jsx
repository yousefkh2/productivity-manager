import { useEffect, useRef } from 'react';

/**
 * Picture-in-Picture Timer Component
 * Renders timer and task info on a canvas for PiP display
 */
export default function PipTimer({ 
  timeLeft, 
  isRunning, 
  mode, 
  selectedTask,
  isPipActive,
  onPipToggle 
}) {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const pipWindowRef = useRef(null);
  const streamRef = useRef(null);

  // Check browser compatibility on mount
  useEffect(() => {
    console.log('PiP Compatibility Check:');
    console.log('- document.pictureInPictureEnabled:', document.pictureInPictureEnabled);
    console.log('- HTMLVideoElement.prototype.requestPictureInPicture:', 'requestPictureInPicture' in HTMLVideoElement.prototype);
    console.log('- HTMLCanvasElement.prototype.captureStream:', 'captureStream' in HTMLCanvasElement.prototype);
    
    if (!document.pictureInPictureEnabled) {
      console.warn('Picture-in-Picture is not enabled in this browser');
    }

    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Draw the timer on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Mode indicator
    ctx.font = 'bold 24px system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = mode === 'focus' ? '#EF4444' : '#10B981';
    ctx.fillText(
      mode === 'focus' ? '🎯 FOCUS MODE' : '☕ BREAK TIME',
      width / 2,
      50
    );

    // Task name (if available and in focus mode)
    if (selectedTask && mode === 'focus') {
      ctx.font = '20px system-ui';
      ctx.fillStyle = '#9CA3AF';
      ctx.fillText('Working on:', width / 2, 90);

      // Task name (truncate if too long)
      ctx.font = 'bold 28px system-ui';
      ctx.fillStyle = '#FFFFFF';
      const taskName = selectedTask.task_name.length > 30 
        ? selectedTask.task_name.substring(0, 27) + '...' 
        : selectedTask.task_name;
      ctx.fillText(taskName, width / 2, 130);

      // Pomodoro count
      ctx.font = '16px system-ui';
      ctx.fillStyle = '#6B7280';
      ctx.fillText(
        `Pomodoro ${(selectedTask.pomodoros_spent || 0) + 1} of ${selectedTask.planned_pomodoros || 1}`,
        width / 2,
        160
      );
    }

    // Timer display
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    ctx.font = 'bold 120px monospace';
    ctx.fillStyle = mode === 'focus' ? '#EF4444' : '#10B981';
    ctx.textAlign = 'center';
    ctx.fillText(timeString, width / 2, selectedTask && mode === 'focus' ? 320 : 240);

    // Status text
    ctx.font = '18px system-ui';
    ctx.fillStyle = '#9CA3AF';
    const statusY = selectedTask && mode === 'focus' ? 380 : 300;
    
    if (isRunning) {
      ctx.fillText(
        mode === 'focus' ? 'Stay focused. Every second matters.' : 'Recharge. You earned this break.',
        width / 2,
        statusY
      );
    } else {
      ctx.fillText('Paused', width / 2, statusY);
    }

    // Progress bar
    const totalTime = mode === 'focus' ? 25 * 60 : 5 * 60;
    const progress = (totalTime - timeLeft) / totalTime;
    const barWidth = width - 80;
    const barHeight = 8;
    const barX = 40;
    const barY = selectedTask && mode === 'focus' ? 420 : 340;

    // Background bar
    ctx.fillStyle = '#374151';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Progress bar
    ctx.fillStyle = mode === 'focus' ? '#EF4444' : '#10B981';
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);

  }, [timeLeft, isRunning, mode, selectedTask]);

  // Start/Stop PiP
  const togglePip = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) {
      console.error('Video or canvas ref not available');
      return;
    }

    try {
      // Check if PiP is supported
      if (!document.pictureInPictureEnabled) {
        alert('Picture-in-Picture is not supported in your browser. Please use Chrome, Edge, Firefox, or Safari.');
        return;
      }

      if (isPipActive && document.pictureInPictureElement) {
        // Exit PiP
        await document.exitPictureInPicture();
        onPipToggle(false);
      } else {
        // Check if canvas.captureStream is available
        if (typeof canvas.captureStream !== 'function') {
          alert('Canvas streaming is not supported in your browser. Please update to the latest version.');
          console.error('captureStream not available on canvas');
          return;
        }

        console.log('Starting PiP...');
        console.log('Canvas size:', canvas.width, 'x', canvas.height);

        // Create or reuse the stream
        if (!streamRef.current) {
          // Capture canvas stream with 30 FPS
          streamRef.current = canvas.captureStream(30);
          console.log('Stream created:', streamRef.current);
          console.log('Stream tracks:', streamRef.current.getTracks());
        }
        
        // Only set srcObject if it's not already set
        if (video.srcObject !== streamRef.current) {
          video.srcObject = streamRef.current;
        }
        
        // Make sure video is not paused
        if (video.paused) {
          try {
            await video.play();
            console.log('Video playing');
          } catch (playError) {
            console.error('Error playing video:', playError);
            // Continue anyway, sometimes PiP can work even if play fails
          }
        }
        
        // Enter PiP mode
        try {
          const pipWindow = await video.requestPictureInPicture();
          console.log('PiP window opened:', pipWindow);
          onPipToggle(true);

          // Listen for exit
          video.addEventListener('leavepictureinpicture', () => {
            console.log('PiP window closed');
            onPipToggle(false);
          }, { once: true });
        } catch (pipError) {
          console.error('Error entering PiP:', pipError);
          alert('Could not start Picture-in-Picture. Error: ' + pipError.message);
        }
      }
    } catch (error) {
      console.error('PiP Error:', error);
      alert(`Picture-in-Picture error: ${error.message}`);
    }
  };

  return (
    <div>
      {/* Hidden canvas that renders the PiP content */}
      <canvas 
        ref={canvasRef}
        width={640}
        height={480}
        style={{ display: 'none' }}
      />
      
      {/* Hidden video element for PiP - preload is set to none to avoid auto-loading */}
      <video
        ref={videoRef}
        muted
        playsInline
        preload="none"
        width={640}
        height={480}
        style={{ display: 'none' }}
      />

      {/* Expose toggle function via data attribute */}
      <button
        data-pip-toggle="true"
        ref={(el) => {
          if (el) {
            el.__pipToggle = togglePip;
          }
        }}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    </div>
  );
}
