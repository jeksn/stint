use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    AppHandle, Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Make the window transparent on macOS at startup
            #[cfg(target_os = "macos")]
            if let Some(w) = app.get_webview_window("main") {
                unsafe {
                    use objc2_app_kit::{NSColor, NSWindow};
                    let ns_win = w.ns_window().unwrap() as *mut NSWindow;
                    let ns_win: &NSWindow = &*ns_win;
                    ns_win.setOpaque(false);
                    let clear = NSColor::clearColor();
                    ns_win.setBackgroundColor(Some(&clear));
                }
            }

            let show = MenuItemBuilder::with_id("show", "Show Timer").build(app)?;
            let hide = MenuItemBuilder::with_id("hide", "Hide Timer").build(app)?;
            let separator = MenuItemBuilder::with_id("sep", "-").build(app)?;
            let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

            let menu = MenuBuilder::new(app)
                .items(&[&show, &hide, &separator, &quit])
                .build()?;

            let _tray = TrayIconBuilder::with_id("main")
                .tooltip("Stint — Pomodoro Timer")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.hide();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            update_tray_tooltip,
            set_always_on_top,
            set_window_opacity
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn update_tray_tooltip(app: AppHandle, tooltip: String) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id("main") {
        tray.set_tooltip(Some(&tooltip)).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn set_always_on_top(app: AppHandle, value: bool) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("main") {
        w.set_always_on_top(value).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Set the native window alpha (0.0 = fully transparent, 1.0 = fully opaque).
/// On macOS this calls NSWindow.setAlphaValue directly.
/// On other platforms this is a no-op — CSS opacity on the root element is the
/// best cross-platform fallback and is handled in the front-end.
#[tauri::command]
async fn set_window_opacity(app: AppHandle, opacity: f64) -> Result<(), String> {
    let opacity = opacity.clamp(0.1, 1.0) as f32;

    #[cfg(target_os = "macos")]
    if let Some(w) = app.get_webview_window("main") {
        unsafe {
            use objc2_app_kit::NSWindow;
            let ns_win = w.ns_window().map_err(|e| e.to_string())? as *mut NSWindow;
            let ns_win: &NSWindow = &*ns_win;
            ns_win.setAlphaValue(opacity as f64);
        }
    }

    // Non-macOS: front-end handles it via CSS opacity on the root element
    #[cfg(not(target_os = "macos"))]
    let _ = (app, opacity);

    Ok(())
}
