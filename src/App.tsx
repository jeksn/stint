import { useState, useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { sendNotification } from "@tauri-apps/plugin-notification";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

const PRESETS = [2/60, 10, 15, 20, 30, 45, 60];

function App() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/gong.mp3");
    
    // Load settings from localStorage
    const savedAlwaysOnTop = localStorage.getItem('alwaysOnTop') === 'true';
    setAlwaysOnTop(savedAlwaysOnTop);
    
    // Apply always on top on load
    if (savedAlwaysOnTop) {
      getCurrentWindow().setAlwaysOnTop(true);
    }
    
    // Listen for settings changes
    const channel = new BroadcastChannel('stint-settings');
    channel.onmessage = (event) => {
      if (event.data.type === 'updateSettings') {
        setAlwaysOnTop(event.data.alwaysOnTop);
        localStorage.setItem('alwaysOnTop', event.data.alwaysOnTop.toString());
      }
    };
    
    // Keyboard shortcut for Cmd+, (settings)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === ',') {
        console.log("Cmd+, pressed in main window");
        e.preventDefault();
        openSettings();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      channel.close();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            playGong();
            sendTimerNotification();
            // Reset animation after 1.5 seconds
            setTimeout(() => setIsComplete(false), 1500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  
  const playGong = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => console.error("Audio play failed:", err));
    }
  };

  const sendTimerNotification = async () => {
    try {
      await sendNotification({
        title: "Stint Complete",
        body: "Your session has ended! Nice work!",
      });
    } catch (err) {
      console.error("Notification failed:", err);
    }
  };

  const setTimer = (minutes: number) => {
    setTimeLeft(minutes * 60);
    setIsRunning(false);
  };

  const toggleTimer = () => {
    if (timeLeft > 0) {
      setIsRunning(!isRunning);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(0);
  };

  const toggleAlwaysOnTop = async () => {
    const newValue = !alwaysOnTop;
    setAlwaysOnTop(newValue);
    try {
      await getCurrentWindow().setAlwaysOnTop(newValue);
    } catch (err) {
      console.error("Failed to set always on top:", err);
    }
  };

  const openSettings = async () => {
    console.log('Settings button clicked');
    try {
      // Use invoke to call Rust command
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("open_settings");
    } catch (err) {
      console.error("Failed to open settings:", err);
    }
  };

  const formatTime = (seconds: number): { minutes: string; seconds: string } => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
      minutes: mins.toString().padStart(2, "0"),
      seconds: secs.toString().padStart(2, "0")
    };
  };

  return (
    <div className={`dark app ${isComplete ? 'complete' : ''}`}>
      <div className="draggable-area">
        <div className="timer-display">
          <span className="minutes">{formatTime(timeLeft).minutes}</span>
          <span className="time-label">M</span>
          <span className="seconds">{formatTime(timeLeft).seconds}</span>
          <span className="time-label">S</span>
        </div>
      </div>

      <div className="presets">
        {PRESETS.map((minutes) => (
          <button
            key={minutes}
            onClick={() => setTimer(minutes)}
            disabled={isRunning}
            className="preset-btn"
          >
            {minutes < 1 ? `${Math.round(minutes * 60)}s` : `${minutes}m`}
          </button>
        ))}
      </div>

      <div className="controls">
        <button onClick={toggleTimer} disabled={timeLeft === 0} className="control-btn primary">
          {isRunning ? "Pause" : "Start"}
        </button>
        <button onClick={resetTimer} className="control-btn secondary">
          Reset
        </button>
        <button onClick={openSettings} className="control-btn icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default App;
