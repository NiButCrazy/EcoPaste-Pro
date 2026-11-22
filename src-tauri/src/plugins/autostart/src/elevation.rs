use std::time::Duration;

use windows::core::{HSTRING, PCWSTR};
use windows::Win32::Foundation::{CloseHandle, HANDLE, HWND};
use windows::Win32::Security::{GetTokenInformation, TokenElevation, TOKEN_ELEVATION, TOKEN_QUERY};
use windows::Win32::System::Threading::{
    GetCurrentProcess, OpenProcess, OpenProcessToken, WaitForSingleObject, PROCESS_SYNCHRONIZE,
};
use windows::Win32::UI::Shell::ShellExecuteW;
use windows::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;

// 重新以管理员身份启动时，新进程等待旧进程退出，避免单实例插件拦截
const ELEVATION_WAIT_PID_ARG: &str = "--elevation-wait-pid=";

/// 当前进程是否已获得管理员权限
pub fn is_process_elevated() -> bool {
    unsafe {
        let mut token = HANDLE::default();

        if OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token).is_err() {
            return false;
        }

        let mut elevation = TOKEN_ELEVATION::default();
        let mut returned = 0u32;

        let result = GetTokenInformation(
            token,
            TokenElevation,
            Some(&mut elevation as *mut _ as *mut _),
            std::mem::size_of::<TOKEN_ELEVATION>() as u32,
            &mut returned,
        );

        let _ = CloseHandle(token);

        result.is_ok() && elevation.TokenIsElevated != 0
    }
}

/// 以管理员身份重新启动当前程序
/// 返回是否已拉起新的管理员进程；当前进程已是管理员时返回 false
pub fn restart_as_admin() -> Result<bool, String> {
    if is_process_elevated() {
        return Ok(false);
    }

    let exe = std::env::current_exe()
        .map_err(|reason| format!("无法获取程序路径：{reason}"))?
        .to_string_lossy()
        .into_owned();

    let mut parameters = String::new();

    // 保留开机自启标记，重启后仍按静默启动处理
    if std::env::args().any(|arg| arg == "--auto-launch") {
        parameters.push_str("--auto-launch ");
    }

    parameters.push_str(&format!("{ELEVATION_WAIT_PID_ARG}{}", std::process::id()));

    let operation = HSTRING::from("runas");
    let exe = HSTRING::from(exe);
    let parameters = HSTRING::from(parameters);

    let result = unsafe {
        ShellExecuteW(
            HWND::default(),
            &operation,
            &exe,
            &parameters,
            PCWSTR::null(),
            SW_SHOWNORMAL,
        )
    };

    // ShellExecuteW 返回值大于 32 才表示成功
    let code = result.0 as isize;

    if code <= 32 {
        return Err(format!("以管理员身份启动失败（错误码 {code}）"));
    }

    Ok(true)
}

/// 若当前进程是被拉起的管理员进程，等待旧进程退出后再继续初始化
pub fn wait_for_elevation_restart() {
    let Some(pid) = std::env::args().find_map(|arg| {
        arg.strip_prefix(ELEVATION_WAIT_PID_ARG)
            .and_then(|pid| pid.parse::<u32>().ok())
    }) else {
        return;
    };

    unsafe {
        let Ok(handle) = OpenProcess(PROCESS_SYNCHRONIZE, false, pid) else {
            return;
        };

        let _ = WaitForSingleObject(handle, Duration::from_secs(30).as_millis() as u32);
        let _ = CloseHandle(handle);
    }
}
