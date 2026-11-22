use tauri::{
    generate_handler,
    plugin::{Builder, TauriPlugin},
    Runtime,
};

mod commands;

#[cfg(target_os = "windows")]
mod elevation;

#[cfg(target_os = "windows")]
pub use elevation::wait_for_elevation_restart;

#[cfg(not(target_os = "windows"))]
pub fn wait_for_elevation_restart() {}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("eco-autostart")
        .invoke_handler(generate_handler![
            commands::is_autostart,
            commands::is_elevated,
            commands::restart_as_admin
        ])
        .build()
}
