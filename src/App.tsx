import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { sendNotification } from "@tauri-apps/plugin-notification";
import "./App.css";

type ThemeMode = "light" | "dark" | "system";

const PRESETS = [2 / 60, 10, 15, 20, 30, 45, 60];

function applyTheme(mode: ThemeMode) {
  const isDark =
    mode === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : mode === "dark";
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
}

function App() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Settings state
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");

  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load settings from localStorage and apply on mount
  useEffect(() => {
    audioRef.current = new Audio("/chime.mp3");

    const savedAlwaysOnTop = localStorage.getItem("alwaysOnTop") === "true";
    const savedSoundEnabled = localStorage.getItem("soundEnabled") !== "false";
    const savedNotificationsEnabled =
      localStorage.getItem("notificationsEnabled") !== "false";
    const savedThemeMode =
      (localStorage.getItem("themeMode") as ThemeMode) || "system";

    setAlwaysOnTop(savedAlwaysOnTop);
    setSoundEnabled(savedSoundEnabled);
    setNotificationsEnabled(savedNotificationsEnabled);
    setThemeMode(savedThemeMode);
    applyTheme(savedThemeMode);

    if (savedAlwaysOnTop) {
      getCurrentWindow().setAlwaysOnTop(true);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === ",") {
        e.preventDefault();
        setShowSettings((prev) => !prev);
      }
      if (e.key === "Escape" && showSettings) {
        setShowSettings(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Timer tick
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            playChime();
            sendTimerNotification();
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
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  // Update tray tooltip while running
  useEffect(() => {
    if (!isRunning) return;
    const { minutes, seconds } = formatTime(timeLeft);
    invoke("update_tray_tooltip", {
      tooltip: `Stint — ${minutes}:${seconds} left`,
    }).catch(() => {});
  }, [timeLeft, isRunning]);

  const playChime = () => {
    if (audioRef.current && soundEnabled) {
      audioRef.current.play().catch(() => {});
    }
  };

  const sendTimerNotification = async () => {
    if (!notificationsEnabled) return;
    try {
      await sendNotification({
        title: "Stint Complete",
        body: "Your session has ended! Nice work!",
      });
    } catch {
      setNotificationsEnabled(false);
      localStorage.setItem("notificationsEnabled", "false");
    }
  };

  const setTimer = (minutes: number) => {
    setTimeLeft(Math.round(minutes * 60));
    setIsRunning(false);
  };

  const toggleTimer = () => {
    if (timeLeft > 0) setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(0);
  };

  const formatTime = (seconds: number) => ({
    minutes: Math.floor(seconds / 60).toString().padStart(2, "0"),
    seconds: (seconds % 60).toString().padStart(2, "0"),
  });

  // Settings handlers
  const handleAlwaysOnTop = async (value: boolean) => {
    setAlwaysOnTop(value);
    localStorage.setItem("alwaysOnTop", value.toString());
    try {
      await invoke("set_always_on_top", { value });
    } catch {}
  };

  const handleSoundEnabled = (value: boolean) => {
    setSoundEnabled(value);
    localStorage.setItem("soundEnabled", value.toString());
  };

  const handleNotificationsEnabled = (value: boolean) => {
    setNotificationsEnabled(value);
    localStorage.setItem("notificationsEnabled", value.toString());
  };

  const handleThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem("themeMode", mode);
    applyTheme(mode);
  };

  const { minutes, seconds } = formatTime(timeLeft);

  return (
    <div className={`app ${isComplete ? "complete" : ""}`}>
      {/* Gear icon — top-right, visible on hover */}
      <button
        className="gear-btn"
        onClick={() => setShowSettings((prev) => !prev)}
        title="Settings (⌘,)"
        aria-label="Open settings"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {/* Timer — click to toggle, drag to move */}
      <div className="draggable-area" onClick={toggleTimer} title={isRunning ? "Pause" : timeLeft > 0 ? "Resume" : "Select a duration below"}>
        <div className="timer-display">
          <span className="minutes">{minutes}</span>
          <span className="time-label">M</span>
          <span className="seconds">{seconds}</span>
          <span className="time-label">S</span>
        </div>
      </div>

      {/* Hover-revealed controls */}
      <div className="hover-reveal">
        <div className="presets">
          {PRESETS.map((mins) => (
            <button
              key={mins}
              onClick={() => setTimer(mins)}
              disabled={isRunning}
              className="preset-btn"
            >
              {mins < 1 ? `${Math.round(mins * 60)}s` : `${mins}m`}
            </button>
          ))}
        </div>

        <div className="controls">
          <button
            onClick={toggleTimer}
            className="control-btn primary"
            disabled={timeLeft === 0}
            title={isRunning ? "Pause" : "Start"}
          >
            {isRunning ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 3 20 12 6 21 6 3" />
              </svg>
            )}
          </button>

          <button onClick={resetTimer} className="control-btn secondary" title="Reset">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Settings panel — slides in from the right */}
      <div className={`settings-overlay ${showSettings ? "open" : ""}`} onClick={() => setShowSettings(false)} />
      <div className={`settings-panel ${showSettings ? "open" : ""}`}>
        <div className="settings-header">
          <span className="settings-title">Settings</span>
          <button className="settings-close" onClick={() => setShowSettings(false)} aria-label="Close settings">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="settings-body">
          <section className="settings-group">
            <h3>Window</h3>
            <SettingRow label="Always on Top" description="Keep window above all others">
              <Toggle checked={alwaysOnTop} onChange={handleAlwaysOnTop} />
            </SettingRow>
          </section>

          <section className="settings-group">
            <h3>Timer</h3>
            <SettingRow label="Sound" description="Chime when timer completes">
              <Toggle checked={soundEnabled} onChange={handleSoundEnabled} />
            </SettingRow>
            <SettingRow label="Notifications" description="System notification on completion">
              <Toggle checked={notificationsEnabled} onChange={handleNotificationsEnabled} />
            </SettingRow>
          </section>

          <section className="settings-group">
            <h3>Appearance</h3>
            <SettingRow label="Theme" description="Color scheme preference">
              <select
                value={themeMode}
                onChange={(e) => handleThemeMode(e.target.value as ThemeMode)}
                className="theme-select"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </SettingRow>
          </section>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="setting-row">
      <div className="setting-info">
        <span className="setting-label">{label}</span>
        {description && <span className="setting-description">{description}</span>}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      className={`toggle ${checked ? "on" : ""}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <span className="toggle-thumb" />
    </button>
  );
}

export default App;
