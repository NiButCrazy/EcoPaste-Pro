#[cfg(target_os = "windows")]
use super::elevation;
use std::env::args;
use tauri::{command, AppHandle, Runtime};

// 是否为自动启动
#[command]
pub async fn is_autostart() -> bool {
    let args: Vec<String> = args().collect();

    return args.contains(&"--auto-launch".to_string());
}

// 是否已获得管理员权限
#[command]
pub async fn is_elevated() -> bool {
    #[cfg(target_os = "windows")]
    {
        return elevation::is_process_elevated();
    }

    #[cfg(not(target_os = "windows"))]
    {
        return false;
    }
}

// 以管理员身份重新启动应用
#[command]
pub async fn restart_as_admin<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        if elevation::restart_as_admin()? {
            // 先返回结果让前端完成状态落盘，再退出当前进程
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(300));
                app.exit(0);
            });
        }

        return Ok(());
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = app;

        return Err("仅 Windows 支持以管理员身份启动".to_string());
    }
}
