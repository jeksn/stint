import { useState, useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { sendNotification } from "@tauri-apps/plugin-notification";
import "./App.css";

const PRESETS = [2/60, 10, 15, 20, 30, 45, 60];

function App() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [opacity, setOpacity] = useState(100);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/chime.mp3");
    
    // Load settings from localStorage
    const savedAlwaysOnTop = localStorage.getItem('alwaysOnTop') === 'true';
    const savedOpacity = parseInt(localStorage.getItem('opacity') || '100');
    const savedSoundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    const savedNotificationsEnabled = localStorage.getItem('notificationsEnabled') !== 'false';
    setAlwaysOnTop(savedAlwaysOnTop);
    setOpacity(savedOpacity);
    setSoundEnabled(savedSoundEnabled);
    setNotificationsEnabled(savedNotificationsEnabled);
    
    // Apply window settings on load
    const applyWindowSettings = async () => {
      if (savedAlwaysOnTop) {
        getCurrentWindow().setAlwaysOnTop(true);
      }
    };
    
    applyWindowSettings();
    
    // Listen for settings changes
    const channel = new BroadcastChannel('stint-settings');
    channel.onmessage = (event) => {
      if (event.data.type === 'updateSettings') {
        setAlwaysOnTop(event.data.alwaysOnTop);
        setOpacity(event.data.opacity);
        setSoundEnabled(event.data.soundEnabled);
        setNotificationsEnabled(event.data.notificationsEnabled);
        localStorage.setItem('alwaysOnTop', event.data.alwaysOnTop.toString());
        localStorage.setItem('opacity', event.data.opacity.toString());
        localStorage.setItem('soundEnabled', event.data.soundEnabled.toString());
        localStorage.setItem('notificationsEnabled', event.data.notificationsEnabled.toString());
        console.log('Settings updated:', event.data);
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
            playChime();
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

  
  const playChime = () => {
    if (audioRef.current && soundEnabled) {
      audioRef.current.play().catch((err) => console.error("Audio play failed:", err));
    }
  };

  const applyTheme = (mode: 'light' | 'dark' | 'system') => {
    // Check system preference if mode is 'system'
    const isDark = mode === 'system' 
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : mode === 'dark';
    
    if (isDark) {
      // Dark mode
      document.documentElement.style.setProperty('--bg-color', '38, 38, 38');
      document.documentElement.style.setProperty('--text-color', '255, 255, 255');
      document.documentElement.style.setProperty('--secondary-bg', '29, 29, 31');
      document.documentElement.style.setProperty('--button-bg', '255, 255, 255');
      document.documentElement.style.setProperty('--button-text', '0, 0, 0');
      document.documentElement.style.setProperty('--border-color', '255, 255, 255');
      document.documentElement.style.setProperty('--preset-bg', '255, 255, 255');
      document.documentElement.style.setProperty('--preset-text', '0, 0, 0');
      document.documentElement.style.setProperty('--time-label-opacity', '0.7');
      document.documentElement.style.setProperty('--disabled-opacity', '0.3');
    } else {
      // Light mode
      document.documentElement.style.setProperty('--bg-color', '242, 242, 247');
      document.documentElement.style.setProperty('--text-color', '0, 0, 0');
      document.documentElement.style.setProperty('--secondary-bg', '255, 255, 255');
      document.documentElement.style.setProperty('--button-bg', '0, 0, 0');
      document.documentElement.style.setProperty('--button-text', '255, 255, 255');
      document.documentElement.style.setProperty('--border-color', '0, 0, 0');
      document.documentElement.style.setProperty('--preset-bg', '38, 38, 38');
      document.documentElement.style.setProperty('--preset-text', '255, 255, 255');
      document.documentElement.style.setProperty('--time-label-opacity', '0.6');
      document.documentElement.style.setProperty('--disabled-opacity', '0.2');
    }
  };

  const sendTimerNotification = async () => {
    if (!notificationsEnabled) return;
    
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
    <div 
      className={`dark app ${isComplete ? 'complete' : ''}`} 
      data-always-on-top={alwaysOnTop}

    >
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
        <button onClick={toggleTimer} className="control-btn primary" disabled={timeLeft === 0} title={isRunning ? "Pause" : "Start"}>
          {isRunning ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="4" width="4" height="16"/>
              <rect x="14" y="4" width="4" height="16"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          )}
        </button>
        <button onClick={resetTimer} className="control-btn secondary" title="Reset">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
        </button>

      </div>
    </div>
  );
}

export default App;
