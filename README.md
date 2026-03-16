# Stint

A native macOS pomodoro timer built with Tauri and React. Simple, elegant, and stays out of your way.

## Features

- **Menu Bar Integration** - Access the timer directly from your menu bar
- **Native macOS Styling** - Built to look and feel like a native macOS app with a modern glassmorphic design
- **Customizable Opacity** - Adjust the window transparency to make it less intrusive
- **Always on Top** - Keep the timer visible above all other windows
- **Keyboard Shortcuts** - Press `Cmd + ,` to quickly open settings
- **Circular Time Presets** - 2s, 10m, 15m, 20m, 30m, 45m, 60m timers
- **Sound & Notifications** - Optional chime and system notifications when timer completes
- **Serif Typography** - Beautiful Apple Garamond-inspired font for the timer display

## Tech Stack

- **Tauri v2** - Rust-powered native app framework
- **React 18** - UI library with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast development and building

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev

# Build for production
pnpm tauri build
```

## Settings

Access settings via the gear icon or `Cmd + ,`:

- **Always on Top** - Keep window floating above others
- **Opacity** - Adjust window transparency (30-100%)
- **Sound** - Enable/disable completion chime
- **Notifications** - Enable/disable system notifications

## Architecture

- **Main Window** - Timer interface with circular preset buttons and glass effect
- **Settings Window** - Separate native-styled window for app preferences
- **BroadcastChannel** - Syncs settings between main and settings windows
- **localStorage** - Persists user preferences
- **Rust Commands** - Handle window management (always on top, open/close settings)
