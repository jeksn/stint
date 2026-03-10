import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./Settings.css";

function Settings() {
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  
  // Load settings from localStorage
  useEffect(() => {
    const savedAlwaysOnTop = localStorage.getItem('alwaysOnTop') === 'true';
    setAlwaysOnTop(savedAlwaysOnTop);
    
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
            <button className="toggle-btn on">
              <span className="toggle-thumb"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
