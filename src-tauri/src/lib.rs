// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod storage;
mod github;
mod notification_manager;
mod types;

use notification_manager::NotificationManager;
use tauri::{Manager, State};
use tokio::sync::Mutex;
use types::*;

// Global state for the notification manager
struct AppState {
    manager: Mutex<Option<NotificationManager>>,
}

// Token management commands
#[tauri::command]
async fn save_token(token: String, state: State<'_, AppState>) -> Result<(), String> {
    storage::token::save_token(&token).map_err(|e| e.to_string())?;
    
    // Initialize the notification manager with the new token
    let manager = NotificationManager::new(token).await.map_err(|e| e.to_string())?;
    let mut state_manager = state.manager.lock().await;
    *state_manager = Some(manager);
    
    Ok(())
}

#[tauri::command]
async fn get_token() -> Result<Option<String>, String> {
    storage::token::get_token().map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_token(state: State<'_, AppState>) -> Result<(), String> {
    storage::token::delete_token().map_err(|e| e.to_string())?;
    
    // Clear the notification manager
    let mut state_manager = state.manager.lock().await;
    *state_manager = None;
    
    Ok(())
}

// GitHub notification commands
#[tauri::command]
async fn initialize_manager(token: String, state: State<'_, AppState>) -> Result<(), String> {
    let manager = NotificationManager::new(token).await.map_err(|e| e.to_string())?;
    let mut state_manager = state.manager.lock().await;
    *state_manager = Some(manager);
    Ok(())
}

#[tauri::command]
async fn sync_notifications(state: State<'_, AppState>) -> Result<(), String> {
    let mut state_manager = state.manager.lock().await;
    if let Some(ref mut manager) = *state_manager {
        manager.sync().await.map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn get_in_progress(state: State<'_, AppState>) -> Result<Vec<HuBoxNotification>, String> {
    let state_manager = state.manager.lock().await;
    if let Some(ref manager) = *state_manager {
        Ok(manager.get_in_progress())
    } else {
        Ok(vec![])
    }
}

#[tauri::command]
async fn get_all_notifications(state: State<'_, AppState>) -> Result<Vec<HuBoxNotification>, String> {
    let state_manager = state.manager.lock().await;
    if let Some(ref manager) = *state_manager {
        Ok(manager.get_all())
    } else {
        Ok(vec![])
    }
}

#[tauri::command]
async fn get_done_notifications(state: State<'_, AppState>) -> Result<Vec<HuBoxNotification>, String> {
    let state_manager = state.manager.lock().await;
    if let Some(ref manager) = *state_manager {
        Ok(manager.get_done())
    } else {
        Ok(vec![])
    }
}

#[tauri::command]
async fn get_notification_details(
    id: String,
    state: State<'_, AppState>,
) -> Result<NotificationDetails, String> {
    let mut state_manager = state.manager.lock().await;
    if let Some(ref mut manager) = *state_manager {
        manager.get_details(&id).await.map_err(|e| e.to_string())
    } else {
        Err("Manager not initialized".to_string())
    }
}

#[tauri::command]
async fn mark_as_read(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut state_manager = state.manager.lock().await;
    if let Some(ref mut manager) = *state_manager {
        manager.mark_as_read(&id).map_err(|e| e.to_string())
    } else {
        Err("Manager not initialized".to_string())
    }
}

#[tauri::command]
async fn mark_as_done(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut state_manager = state.manager.lock().await;
    if let Some(ref mut manager) = *state_manager {
        manager.mark_as_done(&id).await.map_err(|e| e.to_string())
    } else {
        Err("Manager not initialized".to_string())
    }
}

#[tauri::command]
async fn expand_inbox(state: State<'_, AppState>) -> Result<(), String> {
    let mut state_manager = state.manager.lock().await;
    if let Some(ref mut manager) = *state_manager {
        manager.expand_inbox().map_err(|e| e.to_string())
    } else {
        Err("Manager not initialized".to_string())
    }
}

#[tauri::command]
async fn get_stats(state: State<'_, AppState>) -> Result<NotificationStats, String> {
    let state_manager = state.manager.lock().await;
    if let Some(ref manager) = *state_manager {
        Ok(manager.get_stats())
    } else {
        Ok(NotificationStats {
            total: 0,
            unread: 0,
            app_unread: 0,
            done: 0,
            in_progress: 0,
            last_sync: 0,
            is_online: false,
        })
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .manage(AppState {
            manager: Mutex::new(None),
        })
        .setup(|app| {
            // Get the main window
            let window = app.get_webview_window("main").expect("Failed to get main window");
            
            // Platform-specific window configuration
            #[cfg(target_os = "macos")]
            {
                use tauri::TitleBarStyle;
                window.set_title_bar_style(TitleBarStyle::Overlay)?;
            }
            
            #[cfg(not(target_os = "macos"))]
            {
                window.set_decorations(false)?;
            }
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_token,
            get_token,
            delete_token,
            initialize_manager,
            sync_notifications,
            get_in_progress,
            get_all_notifications,
            get_done_notifications,
            get_notification_details,
            mark_as_read,
            mark_as_done,
            expand_inbox,
            get_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
