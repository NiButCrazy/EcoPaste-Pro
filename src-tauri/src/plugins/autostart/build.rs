const COMMANDS: &[&str] = &["is_autostart", "is_elevated", "restart_as_admin"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
