import { useState, useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { sendNotification } from "@tauri-apps/plugin-notification";
import "./App.css";

const PRESETS = [10, 15, 20, 30, 45, 60];

function App() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/gong.mp3");
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playGong();
            sendTimerNotification();
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
        title: "Stint Timer Complete",
        body: "Your Pomodoro session has ended!",
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

  const formatTime = (seconds: number): { minutes: string; seconds: string } => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
      minutes: mins.toString().padStart(2, "0"),
      seconds: secs.toString().padStart(2, "0")
    };
  };

  return (
    <div className="app">
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
            {minutes}m
          </button>
        ))}
      </div>

      <div className="controls">
        <button onClick={toggleTimer} disabled={timeLeft === 0} className="control-btn">
          {isRunning ? "Pause" : "Start"}
        </button>
        <button onClick={resetTimer} className="control-btn">
          Reset
        </button>
      </div>

      <div className="settings">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={alwaysOnTop}
            onChange={toggleAlwaysOnTop}
          />
          <span>Always on Top</span>
        </label>
      </div>
    </div>
  );
}

export default App;
