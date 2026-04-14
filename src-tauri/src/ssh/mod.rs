use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{Mutex, mpsc};
use anyhow::Result;
use russh::*;
use tauri::{AppHandle, Emitter};

pub struct SessionHandle {
    pub input_tx: mpsc::UnboundedSender<Vec<u8>>,
    pub resize_tx: mpsc::UnboundedSender<(u32, u32)>,
    pub disconnect_tx: mpsc::UnboundedSender<()>,
}

pub struct SshManager {
    sessions: Arc<Mutex<HashMap<String, SessionHandle>>>,
}

impl SshManager {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn connect(
        &self,
        app: AppHandle,
        session_id: String,
        host: String,
        port: u16,
        username: String,
        auth_type: String,
        password: Option<String>,
        private_key: Option<String>,
        passphrase: Option<String>,
    ) -> Result<()> {
        let config = Arc::new(client::Config {
            inactivity_timeout: None,
            keepalive_interval: Some(std::time::Duration::from_secs(30)),
            ..<client::Config as Default>::default()
        });

        let handler = ClientHandler {
            _app: app.clone(),
            _session_id: session_id.clone(),
        };

        let addr = format!("{}:{}", host, port);
        let mut handle = client::connect(config, addr, handler).await?;

        // Authenticate
        let auth_ok = match auth_type.as_str() {
            "key" => {
                let key_str = private_key.unwrap_or_default();
                let passphrase_opt = passphrase
                    .filter(|p| !p.is_empty())
                    .map(|p| p.to_string());
                let key = russh_keys::decode_secret_key(&key_str, passphrase_opt.as_deref())?;
                let key_pair = Arc::new(key);
                handle.authenticate_publickey(&username, key_pair).await?
            }
            _ => {
                let pass = password.unwrap_or_default();
                handle.authenticate_password(&username, &pass).await?
            }
        };

        if !auth_ok {
            anyhow::bail!("Authentication failed");
        }

        // Open session channel
        let mut channel = handle.channel_open_session().await?;

        // Request PTY
        channel
            .request_pty(
                false,
                "xterm-256color",
                80,
                24,
                0,
                0,
                &[] as &[(russh::Pty, u32)],
            )
            .await?;

        // Open shell
        channel.request_shell(false).await?;

        // Control channels
        let (input_tx, mut input_rx) = mpsc::unbounded_channel::<Vec<u8>>();
        let (resize_tx, mut resize_rx) = mpsc::unbounded_channel::<(u32, u32)>();
        let (disconnect_tx, mut disconnect_rx) = mpsc::unbounded_channel::<()>();

        {
            let mut sessions = self.sessions.lock().await;
            sessions.insert(
                session_id.clone(),
                SessionHandle { input_tx, resize_tx, disconnect_tx },
            );
        }

        // Emit "connected"
        let _ = app.emit(
            &format!("ssh://status/{}", session_id),
            serde_json::json!({ "status": "connected" }),
        );

        // Session task
        let app_clone = app.clone();
        let sid = session_id.clone();
        let sessions_ref = Arc::clone(&self.sessions);

        tokio::spawn(async move {
            let _handle = handle; // keep connection alive
            loop {
                tokio::select! {
                    msg = channel.wait() => {
                        match msg {
                            Some(ChannelMsg::Data { ref data }) => {
                                let text = String::from_utf8_lossy(data).into_owned();
                                let _ = app_clone.emit(&format!("ssh://data/{}", sid), text);
                            }
                            Some(ChannelMsg::ExitStatus { .. })
                            | Some(ChannelMsg::Eof)
                            | None => {
                                let _ = app_clone.emit(
                                    &format!("ssh://status/{}", sid),
                                    serde_json::json!({ "status": "disconnected" }),
                                );
                                break;
                            }
                            _ => {}
                        }
                    }
                    Some(data) = input_rx.recv() => {
                        if channel.data(data.as_ref()).await.is_err() {
                            break;
                        }
                    }
                    Some((cols, rows)) = resize_rx.recv() => {
                        // russh 0.44: window_change(col_width, row_height, pix_w, pix_h)
                        let _ = channel.window_change(cols, rows, 0, 0).await;
                    }
                    Some(_) = disconnect_rx.recv() => {
                        let _ = channel.close().await;
                        let _ = app_clone.emit(
                            &format!("ssh://status/{}", sid),
                            serde_json::json!({ "status": "disconnected" }),
                        );
                        break;
                    }
                }
            }
            sessions_ref.lock().await.remove(&sid);
        });

        Ok(())
    }

    pub async fn send_input(&self, session_id: &str, data: Vec<u8>) -> Result<()> {
        let sessions = self.sessions.lock().await;
        if let Some(sess) = sessions.get(session_id) {
            let _ = sess.input_tx.send(data);
        }
        Ok(())
    }

    pub async fn resize(&self, session_id: &str, cols: u32, rows: u32) -> Result<()> {
        let sessions = self.sessions.lock().await;
        if let Some(sess) = sessions.get(session_id) {
            let _ = sess.resize_tx.send((cols, rows));
        }
        Ok(())
    }

    pub async fn disconnect(&self, session_id: &str) {
        let mut sessions = self.sessions.lock().await;
        if let Some(sess) = sessions.remove(session_id) {
            let _ = sess.disconnect_tx.send(());
        }
    }
}

impl std::fmt::Debug for SshManager {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("SshManager").finish()
    }
}

// ─── russh Handler ───────────────────────────────────────────────────────────

struct ClientHandler {
    _app: AppHandle,
    _session_id: String,
}

#[async_trait::async_trait]
impl client::Handler for ClientHandler {
    type Error = anyhow::Error;

    async fn check_server_key(
        &mut self,
        _server_public_key: &russh_keys::key::PublicKey,
    ) -> Result<bool, Self::Error> {
        Ok(true)
    }
}
