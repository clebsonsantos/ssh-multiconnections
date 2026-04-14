mod ssh;
mod storage;

use std::sync::Arc;
use ssh::SshManager;
use tauri::{AppHandle, State};

pub struct AppState {
    pub ssh: Arc<SshManager>,
}

// ─── Storage commands ─────────────────────────────────────────────────────────

#[tauri::command]
fn get_connections() -> Result<Vec<storage::Connection>, String> {
    storage::get_connections().map_err(|e| e.to_string())
}

#[tauri::command]
fn save_connection(connection: storage::Connection) -> Result<(), String> {
    storage::save_connection(connection).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_connection(id: String) -> Result<(), String> {
    storage::delete_connection(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn export_connections() -> Result<String, String> {
    storage::export_json().map_err(|e| e.to_string())
}

#[tauri::command]
fn import_connections(content: String) -> Result<storage::AppData, String> {
    storage::import_json(&content).map_err(|e| e.to_string())
}

// ─── SSH commands ─────────────────────────────────────────────────────────────

// Tauri v2 converts camelCase (JS) → snake_case (Rust) automatically
#[tauri::command]
async fn connect_ssh(
    app: AppHandle,
    state: State<'_, AppState>,
    session_id: String,
    host: String,
    port: u16,
    username: String,
    auth_type: String,
    password: Option<String>,
    private_key: Option<String>,
    passphrase: Option<String>,
) -> Result<(), String> {
    state
        .ssh
        .connect(
            app,
            session_id,
            host,
            port,
            username,
            auth_type,
            password,
            private_key,
            passphrase,
        )
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn disconnect_ssh(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<(), String> {
    state.ssh.disconnect(&session_id).await;
    Ok(())
}

#[tauri::command]
async fn send_ssh_input(
    state: State<'_, AppState>,
    session_id: String,
    data: String,
) -> Result<(), String> {
    state
        .ssh
        .send_input(&session_id, data.into_bytes())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn resize_terminal(
    state: State<'_, AppState>,
    session_id: String,
    cols: u32,
    rows: u32,
) -> Result<(), String> {
    state
        .ssh
        .resize(&session_id, cols, rows)
        .await
        .map_err(|e| e.to_string())
}

// ─── App entry point ──────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            ssh: Arc::new(SshManager::new()),
        })
        .invoke_handler(tauri::generate_handler![
            get_connections,
            save_connection,
            delete_connection,
            export_connections,
            import_connections,
            connect_ssh,
            disconnect_ssh,
            send_ssh_input,
            resize_terminal,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
