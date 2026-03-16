use tauri::{Manager, menu::{MenuBuilder, MenuItemBuilder}, tray::TrayIconBuilder, AppHandle};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let show = MenuItemBuilder::with_id("show", "Show Timer").build(app)?;
            let hide = MenuItemBuilder::with_id("hide", "Hide Timer").build(app)?;
            let settings = MenuItemBuilder::with_id("settings", "Settings...")
                .accelerator("CmdOrControl+,")
                .build(app)?;
            let separator = MenuItemBuilder::with_id("separator", "-").build(app)?;
            let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
            
            let menu = MenuBuilder::new(app)
                .items(&[&show, &hide, &settings, &separator, &quit])
                .build()?;
            
            let _tray = TrayIconBuilder::with_id("main")
                .tooltip("Stint - Pomodoro Timer")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "hide" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.hide();
                            }
                        }
                        "settings" => {
                            if let Some(window) = app.get_webview_window("settings") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            } else {
                                if let Err(e) = tauri::WebviewWindowBuilder::new(
                                    app,
                                    "settings",
                                    tauri::WebviewUrl::App("/".into())
                                )
                                .title("Stint Settings")
                                .inner_size(480.0, 400.0)
                                .center()
                                .resizable(false)
                                .decorations(true)
                                .build() {
                                    eprintln!("Failed to create settings window: {}", e);
                                }
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .build(app)?;
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![update_tray_tooltip, set_always_on_top, close_settings, open_settings])
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
    if let Some(window) = app.get_webview_window("main") {
        window.set_always_on_top(value).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn close_settings(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("settings") {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn open_settings(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("settings") {
        let _ = window.show();
        let _ = window.set_focus();
    } else {
        if let Err(e) = tauri::WebviewWindowBuilder::new(
            &app,
            "settings",
            tauri::WebviewUrl::App("/".into())
        )
        .title("Stint Settings")
        .inner_size(480.0, 400.0)
        .center()
        .resizable(false)
        .decorations(true)
        .build() {
            return Err(e.to_string());
        }
    }
    Ok(())
}




