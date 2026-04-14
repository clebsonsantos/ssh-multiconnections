use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JumpHost {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    #[serde(rename = "privateKey")]
    pub private_key: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Connection {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    #[serde(rename = "authType")]
    pub auth_type: String,
    pub password: String,
    #[serde(rename = "privateKey")]
    pub private_key: String,
    pub passphrase: String,
    #[serde(rename = "jumpHost")]
    pub jump_host: Option<JumpHost>,
    pub proxy: Option<ProxyConfig>,
    #[serde(rename = "autoReconnect")]
    pub auto_reconnect: bool,
    pub favourite: bool,
    pub description: String,
    pub tags: Vec<String>,
    #[serde(rename = "groupId")]
    pub group_id: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Group {
    pub id: String,
    pub name: String,
    #[serde(rename = "parentId")]
    pub parent_id: Option<String>,
    pub expanded: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppData {
    pub version: String,
    pub connections: Vec<Connection>,
    pub groups: Vec<Group>,
}

impl Default for AppData {
    fn default() -> Self {
        Self {
            version: "1.0".into(),
            connections: vec![],
            groups: vec![],
        }
    }
}

fn data_file_path() -> PathBuf {
    let base = dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("ssh-multiconnect");
    std::fs::create_dir_all(&base).ok();
    base.join("connections.json")
}

pub fn load() -> Result<AppData> {
    let path = data_file_path();
    if !path.exists() {
        return Ok(AppData::default());
    }
    let content = std::fs::read_to_string(&path)?;
    let data: AppData = serde_json::from_str(&content)?;
    Ok(data)
}

pub fn save_all(data: &AppData) -> Result<()> {
    let path = data_file_path();
    let json = serde_json::to_string_pretty(data)?;
    std::fs::write(path, json)?;
    Ok(())
}

pub fn get_connections() -> Result<Vec<Connection>> {
    Ok(load()?.connections)
}

pub fn save_connection(conn: Connection) -> Result<()> {
    let mut data = load()?;
    if let Some(idx) = data.connections.iter().position(|c| c.id == conn.id) {
        data.connections[idx] = conn;
    } else {
        data.connections.push(conn);
    }
    save_all(&data)
}

pub fn delete_connection(id: &str) -> Result<()> {
    let mut data = load()?;
    data.connections.retain(|c| c.id != id);
    save_all(&data)
}

pub fn export_json() -> Result<String> {
    let data = load()?;
    let export = serde_json::json!({
        "version": "1.0",
        "exportedAt": chrono_now(),
        "connections": data.connections,
        "groups": data.groups,
    });
    Ok(serde_json::to_string_pretty(&export)?)
}

pub fn import_json(content: &str) -> Result<AppData> {
    let incoming: serde_json::Value = serde_json::from_str(content)?;
    let connections: Vec<Connection> =
        serde_json::from_value(incoming["connections"].clone()).unwrap_or_default();
    let groups: Vec<Group> =
        serde_json::from_value(incoming["groups"].clone()).unwrap_or_default();

    let mut existing = load()?;
    for conn in &connections {
        if let Some(idx) = existing.connections.iter().position(|c| c.id == conn.id) {
            existing.connections[idx] = conn.clone();
        } else {
            existing.connections.push(conn.clone());
        }
    }
    for grp in &groups {
        if !existing.groups.iter().any(|g| g.id == grp.id) {
            existing.groups.push(grp.clone());
        }
    }
    save_all(&existing)?;
    Ok(existing)
}

fn chrono_now() -> String {
    // Simple ISO8601 timestamp without pulling in chrono
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    // Format as RFC3339-ish (good enough)
    format!("{}", secs)
}
