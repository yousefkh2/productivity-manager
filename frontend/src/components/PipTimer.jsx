import { useEffect, useRef, useState } from 'react';

// Layout configurations
// Note: Browsers enforce minimum PiP dimensions (typically ~100px height minimum)
const LAYOUTS = {
  default: { width: 640, height: 480, name: 'Default (Square)', desc: 'Full details' },
  taskbar: { width: 800, height: 120, name: 'Taskbar Strip', desc: 'Horizontal bar' },
  compact: { width: 400, height: 300, name: 'Compact', desc: 'Small square' },
  minimal: { width: 600, height: 100, name: 'Minimal', desc: 'Ultra-thin bar' },
};

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
  
  // Load saved layout preference or default to 'default'
  const [layout, setLayout] = useState(() => {
    return localStorage.getItem('pipLayout') || 'default';
  });

  const currentLayout = LAYOUTS[layout];

  // Save layout preference
  const changeLayout = (newLayout) => {
    setLayout(newLayout);
    localStorage.setItem('pipLayout', newLayout);
    
    // If PiP is active, need to restart it with new dimensions
    if (isPipActive) {
      // Store that we need to reopen PiP
      const shouldReopenPip = true;
      
      // Exit current PiP
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().then(() => {
          // Recreate stream with new dimensions
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          
          // Reopen PiP after a brief delay
          if (shouldReopenPip) {
            setTimeout(() => {
              const pipButton = document.querySelector('[data-pip-toggle]');
              if (pipButton && pipButton.__pipToggle) {
                pipButton.__pipToggle();
              }
            }, 300);
          }
        });
      }
    } else {
      // Just recreate the stream if it exists
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  // Expose layout change function
  useEffect(() => {
    const pipButton = document.querySelector('[data-pip-toggle]');
    if (pipButton) {
      pipButton.__changeLayout = changeLayout;
    }
  }, []);

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

    // Render based on layout
    if (layout === 'taskbar' || layout === 'minimal') {
      renderTaskbarLayout(ctx, width, height);
    } else {
      renderDefaultLayout(ctx, width, height);
    }
  }, [timeLeft, isRunning, mode, selectedTask, layout]);

  // Default layout renderer (vertical)
  const renderDefaultLayout = (ctx, width, height) => {
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
    // TESTING: Use 10 seconds for focus, 5 for break (change to 25*60 and 5*60 for production)
    const totalTime = mode === 'focus' ? 10 : 5;
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
  };

  // Taskbar/Minimal layout renderer (horizontal)
  const renderTaskbarLayout = (ctx, width, height) => {
    const isMinimal = layout === 'minimal';
    const padding = 20;
    
    // Timer on the left
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    ctx.font = `bold ${isMinimal ? '48' : '64'}px monospace`;
    ctx.fillStyle = mode === 'focus' ? '#EF4444' : '#10B981';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(timeString, padding, height / 2);

    // Mode emoji and task name in the center
    const timerWidth = ctx.measureText(timeString).width;
    const centerStartX = timerWidth + padding * 2;
    
    ctx.font = `${isMinimal ? '24' : '32'}px system-ui`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    
    const modeEmoji = mode === 'focus' ? '🎯' : '☕';
    const taskText = selectedTask && mode === 'focus' 
      ? selectedTask.task_name 
      : (mode === 'focus' ? 'Focus Mode' : 'Break Time');
    
    // Truncate if too long
    const maxTaskWidth = width - centerStartX - padding * 2;
    let displayText = `${modeEmoji} ${taskText}`;
    let textWidth = ctx.measureText(displayText).width;
    
    while (textWidth > maxTaskWidth && displayText.length > 10) {
      displayText = displayText.substring(0, displayText.length - 4) + '...';
      textWidth = ctx.measureText(displayText).width;
    }
    
    ctx.fillText(displayText, centerStartX, height / 2);

    // Progress bar at the bottom
    // TESTING: Use 10 seconds for focus, 5 for break (change to 25*60 and 5*60 for production)
    const totalTime = mode === 'focus' ? 10 : 5;
    const progress = (totalTime - timeLeft) / totalTime;
    const barHeight = isMinimal ? 4 : 6;
    const barY = height - barHeight - 5;

    // Background bar
    ctx.fillStyle = '#374151';
    ctx.fillRect(0, barY, width, barHeight);

    // Progress bar
    ctx.fillStyle = mode === 'focus' ? '#EF4444' : '#10B981';
    ctx.fillRect(0, barY, width * progress, barHeight);

    // Pomodoro count (if applicable and not minimal)
    if (!isMinimal && selectedTask && mode === 'focus') {
      ctx.font = '14px system-ui';
      ctx.fillStyle = '#6B7280';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(
        `Pomo ${(selectedTask.pomodoros_spent || 0) + 1}/${selectedTask.planned_pomodoros || 1}`,
        width - padding,
        height - 15
      );
    }
  };

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
        width={currentLayout.width}
        height={currentLayout.height}
        style={{ display: 'none' }}
      />
      
      {/* Hidden video element for PiP - preload is set to none to avoid auto-loading */}
      <video
        ref={videoRef}
        muted
        playsInline
        preload="none"
        width={currentLayout.width}
        height={currentLayout.height}
        style={{ display: 'none' }}
      />

      {/* Expose toggle function via data attribute */}
      <button
        data-pip-toggle="true"
        data-current-layout={layout}
        ref={(el) => {
          if (el) {
            el.__pipToggle = togglePip;
            el.__changeLayout = changeLayout;
            el.__currentLayout = layout;
          }
        }}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    </div>
  );
}
