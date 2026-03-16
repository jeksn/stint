import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./Settings.css";

function Settings() {
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  
  // Load settings from localStorage
  useEffect(() => {
    const savedAlwaysOnTop = localStorage.getItem('alwaysOnTop') === 'true';
    const savedSoundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    const savedNotificationsEnabled = localStorage.getItem('notificationsEnabled') !== 'false';
    const savedThemeMode = (localStorage.getItem('themeMode') as 'light' | 'dark' | 'system') || 'system';
    setAlwaysOnTop(savedAlwaysOnTop);
    setSoundEnabled(savedSoundEnabled);
    setNotificationsEnabled(savedNotificationsEnabled);
    setThemeMode(savedThemeMode);
    
    // Sync settings with main window
    const channel = new BroadcastChannel('stint-settings');
    
    channel.onmessage = (event) => {
      if (event.data.type === 'updateSettings') {
        setAlwaysOnTop(event.data.alwaysOnTop);
        localStorage.setItem('alwaysOnTop', event.data.alwaysOnTop.toString());
      }
    };
    
    // Keyboard shortcut for Cmd+, (close settings)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === ',') {
        console.log("Cmd+, pressed in settings window");
        e.preventDefault();
        closeSettings();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      channel.close();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    // Get the main window's always on top state
    const loadSettings = async () => {
      try {
        // Settings are loaded from localStorage, no need to get window state
        console.log("Settings loaded from localStorage");
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };
    
    loadSettings();
  }, []);

  const toggleAlwaysOnTop = async () => {
    const newValue = !alwaysOnTop;
    setAlwaysOnTop(newValue);
    
    try {
      // Use invoke to call the Rust command instead
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("set_always_on_top", { value: newValue });
      
      // Save to localStorage
      localStorage.setItem('alwaysOnTop', newValue.toString());
      
      // Broadcast change
      const channel = new BroadcastChannel('stint-settings');
      channel.postMessage({
        type: 'updateSettings',
        alwaysOnTop: newValue
      });
      channel.close();
    } catch (err) {
      console.error("Failed to set always on top:", err);
    }
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('soundEnabled', newValue.toString());
    
    // Broadcast change
    const channel = new BroadcastChannel('stint-settings');
    channel.postMessage({
      type: 'updateSound',
      soundEnabled: newValue
    });
    channel.close();
  };

  const toggleNotifications = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    localStorage.setItem('notificationsEnabled', newValue.toString());
    
    // Broadcast change
    const channel = new BroadcastChannel('stint-settings');
    channel.postMessage({
      type: 'updateNotifications',
      notificationsEnabled: newValue
    });
    channel.close();
  };

  const applyTheme = (mode: 'light' | 'dark' | 'system') => {
    // Broadcast change
    const channel = new BroadcastChannel('stint-settings');
    channel.postMessage({
      type: 'updateTheme',
      themeMode: mode
    });
    channel.close();
  };

  const closeSettings = async () => {
    console.log("Attempting to close settings...");
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      console.log("Calling close_settings command...");
      await invoke("close_settings");
      console.log("Settings closed successfully");
    } catch (err) {
      console.error("Failed to close settings:", err);
      // Fallback: try direct close
      try {
        const window = getCurrentWindow();
        await window.close();
      } catch (err2) {
        console.error("Fallback also failed:", err2);
      }
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Settings</h2>
        <button onClick={closeSettings} className="done-btn">
          Done
        </button>
      </div>

      <div className="settings-content">
        <div className="settings-group">
          <h3>Window</h3>
          <div className="setting-item">
            <div className="setting-info">
              <label>Always on Top</label>
              <p className="setting-description">
                Keep the timer window above all other windows
              </p>
            </div>
            <button
              onClick={toggleAlwaysOnTop}
              className={`toggle-btn ${alwaysOnTop ? 'on' : 'off'}`}
            >
              <span className="toggle-thumb"></span>
            </button>
          </div>
        </div>

        <div className="settings-group">
          <h3>Timer</h3>
          <div className="setting-item">
            <div className="setting-info">
              <label>Sound</label>
              <p className="setting-description">
                Play a sound when the timer completes
              </p>
            </div>
            <button
              onClick={toggleSound}
              className={`toggle-btn ${soundEnabled ? 'on' : 'off'}`}
              title={soundEnabled ? 'Disable sound' : 'Enable sound'}
            >
              <span className="toggle-thumb"></span>
            </button>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <label>Notifications</label>
              <p className="setting-description">
                Show system notifications when timer completes
              </p>
            </div>
            <button
              onClick={toggleNotifications}
              className={`toggle-btn ${notificationsEnabled ? 'on' : 'off'}`}
              title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
            >
              <span className="toggle-thumb"></span>
            </button>
          </div>
        </div>

        <div className="settings-group">
          <h3>Appearance</h3>
          <div className="setting-item">
            <div className="setting-info">
              <label>Theme</label>
              <p className="setting-description">
                Choose light, dark, or system preference
              </p>
            </div>
            <select
              value={themeMode}
              onChange={(e) => {
                const mode = e.target.value as 'light' | 'dark' | 'system';
                setThemeMode(mode);
                localStorage.setItem('themeMode', mode);
                applyTheme(mode);
              }}
              className="theme-select"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
