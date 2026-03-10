# Stint - Minimalist Pomodoro Timer for macOS

A polished Tauri v2 Pomodoro timer with native macOS integration.

## Features

- **Minimalist UI**: White countdown text on black background
- **Frameless Window**: Small (300x200px), draggable window
- **Always on Top Toggle**: Keep the timer visible while working
- **System Tray Integration**: Menubar icon with Show/Hide/Quit options
- **Native Notifications**: macOS notification when timer completes
- **Gong Sound**: Meditation-style sound when timer ends
- **Quick Presets**: 10, 15, 20, 30, 45, 60 minute options
- **Timer Controls**: Start, Pause, Reset

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Add Gong Sound File

The app expects a gong sound file at `/public/gong.mp3`. You need to:

1. Find or download a meditation gong sound (MP3 or WAV format)
2. Place it at: `public/gong.mp3`

**Recommended sources for gong sounds:**
- [Freesound.org](https://freesound.org/search/?q=gong)
- [Zapsplat](https://www.zapsplat.com/sound-effect-category/gongs/)
- Any royalty-free sound library

### 3. Run Development Server

```bash
pnpm tauri dev
```

### 4. Build for Production

```bash
pnpm tauri build
```

## Usage

### Timer Controls
- Click any preset button (10m, 15m, etc.) to set the timer
- Click **Start** to begin the countdown
- Click **Pause** to pause (you can resume later)
- Click **Reset** to clear the timer

### Window Management
- **Drag anywhere** on the timer display to move the window
- Check **Always on Top** to keep the window above other apps
- Use the **menubar icon** to show/hide the window or quit

### Notifications
The first time the timer completes, macOS will ask for notification permissions. Click "Allow" to receive timer completion alerts.

## Technical Stack

- **Backend**: Rust + Tauri v2
- **Frontend**: React + TypeScript
- **Styling**: Custom CSS with macOS design principles
- **Plugins**: 
  - `tauri-plugin-notification` for native notifications
  - `tauri-plugin-opener` for system integration

## macOS-Specific Features

- **Frameless Window**: Uses `titleBarStyle: "Overlay"` for clean look
- **Draggable Area**: `-webkit-app-region: drag` for window dragging
- **System Tray**: Native menubar integration
- **Template Icon**: Icon adapts to light/dark menubar theme

## File Structure

```
stint/
├── src/
│   ├── App.tsx          # Main React component with timer logic
│   └── App.css          # Minimalist black/white styling
├── src-tauri/
│   ├── src/
│   │   ├── main.rs      # Entry point
│   │   └── lib.rs       # Tauri app setup + tray menu
│   ├── capabilities/
│   │   └── default.json # Permissions configuration
│   └── tauri.conf.json  # Window & app configuration
└── public/
    └── gong.mp3         # Timer completion sound (you add this)
```

## Customization

### Change Timer Duration Presets
Edit the `PRESETS` array in `src/App.tsx`:
```typescript
const PRESETS = [10, 15, 20, 30, 45, 60]; // minutes
```

### Change Window Size
Edit `src-tauri/tauri.conf.json`:
```json
"width": 300,
"height": 200
```

### Change Colors
Edit `src/App.css` - currently set to black background (#000) with white text (#fff).

## Troubleshooting

**Timer sound doesn't play:**
- Ensure `public/gong.mp3` exists
- Check browser console for audio errors
- macOS may require user interaction before playing audio

**Notifications don't appear:**
- Check System Settings > Notifications > Stint
- Ensure notifications are enabled

**Window won't drag:**
- The draggable area is the timer display
- Buttons are intentionally non-draggable

**Tray icon missing:**
- The app uses `icons/32x32.png` - ensure it exists
- Rebuild the app if icons were changed

## License

MIT
