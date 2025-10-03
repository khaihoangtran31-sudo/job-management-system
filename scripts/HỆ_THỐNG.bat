@echo off
title HỆ THỐNG QUẢN LÝ CÔNG VIỆC 2.0 - TỔNG HỢP
color 0F

:MAIN_MENU
cls
echo ========================================
echo    HỆ THỐNG QUẢN LÝ CÔNG VIỆC 2.0
echo ========================================
echo.
echo 🚀 Tự động khởi động toàn bộ hệ thống...
echo.
echo 1. 🚀 Khởi động toàn bộ hệ thống
echo 2. 🔧 Khởi động chỉ Backend
echo 3. 🎨 Khởi động chỉ Frontend
echo 4. ⏹️  Dừng tất cả
echo 5. 📊 Kiểm tra trạng thái
echo 6. 🔄 Khởi động lại hệ thống
echo 7. 🌐 Mở trình duyệt
echo 8. 📋 Xem thông tin hệ thống
echo 9. 🛠️  Cài đặt Windows Service
echo A. 🔄 Chạy 24/7 (Full System)
echo B. 🎨 Chạy Frontend 24/7
echo C. 🔧 Chạy Backend 24/7
echo D. 🛑 Dừng Windows Service
echo E. 🚀 Khởi động Windows Service
echo 0. ❌ Thoát
echo.
echo ⏰ Tự động khởi động sau 3 giây... (Nhấn phím bất kỳ để vào menu)
timeout /t 3 /nobreak >nul
if %errorlevel% neq 0 goto START_ALL

set /p choice="Chọn tùy chọn (0-9, A-E): "

if "%choice%"=="1" goto START_ALL
if "%choice%"=="2" goto START_BACKEND
if "%choice%"=="3" goto START_FRONTEND
if "%choice%"=="4" goto STOP_ALL
if "%choice%"=="5" goto CHECK_STATUS
if "%choice%"=="6" goto RESTART_SYSTEM
if "%choice%"=="7" goto OPEN_BROWSER
if "%choice%"=="8" goto SYSTEM_INFO
if "%choice%"=="9" goto INSTALL_SERVICE
if /i "%choice%"=="A" goto START_24_7_FULL
if /i "%choice%"=="B" goto START_24_7_FRONTEND
if /i "%choice%"=="C" goto START_24_7_BACKEND
if /i "%choice%"=="D" goto STOP_SERVICE
if /i "%choice%"=="E" goto START_SERVICE
if "%choice%"=="0" goto EXIT
goto MAIN_MENU

:START_ALL
cls
echo ========================================
echo    KHỞI ĐỘNG TOÀN BỘ HỆ THỐNG
echo ========================================
echo.
echo [1] Quét IP máy chủ...
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%j in ("%%i") do (
        set SERVER_IP=%%j
        goto :ip_found
    )
)
:ip_found
echo ✓ IP máy chủ: %SERVER_IP%

echo [2] Khởi động Backend Server...
cd /d C:\Users\admin\Desktop\Qly_CV
start "Backend Server" cmd /k "cd /d C:\Users\admin\Desktop\Qly_CV && node server.js"
timeout /t 5

echo [3] Khởi động Frontend React...
start "Frontend React" cmd /k "cd /d C:\Users\admin\Desktop\Qly_CV && set PORT=5000 && npm start"
timeout /t 10

echo [4] Mở trình duyệt...
start http://%SERVER_IP%:5000

echo.
echo ========================================
echo           HỆ THỐNG ĐÃ KHỞI ĐỘNG!
echo ========================================
echo.
echo ✅ Backend: http://%SERVER_IP%:5001
echo ✅ Frontend: http://%SERVER_IP%:5000
echo ✅ Đăng nhập: admin / admin123
echo.
pause
goto MAIN_MENU

:START_BACKEND
cls
echo ========================================
echo    KHỞI ĐỘNG BACKEND SERVER
echo ========================================
echo.
echo Đang khởi động Backend...
cd /d C:\Users\admin\Desktop\Qly_CV
start "Backend Server" cmd /k "cd /d C:\Users\admin\Desktop\Qly_CV && node server.js"
echo ✅ Backend đã khởi động!
echo.
pause
goto MAIN_MENU

:START_FRONTEND
cls
echo ========================================
echo    KHỞI ĐỘNG FRONTEND REACT
echo ========================================
echo.
echo Đang khởi động Frontend...
cd /d C:\Users\admin\Desktop\Qly_CV
start "Frontend React" cmd /k "cd /d C:\Users\admin\Desktop\Qly_CV && set PORT=5000 && npm start"
echo ✅ Frontend đã khởi động!
echo.
pause
goto MAIN_MENU

:STOP_ALL
cls
echo ========================================
echo    DỪNG TẤT CẢ DỊCH VỤ
echo ========================================
echo.
echo Đang dừng tất cả dịch vụ...
taskkill /F /IM node.exe 2>nul
echo ✅ Đã dừng tất cả dịch vụ!
echo.
pause
goto MAIN_MENU

:CHECK_STATUS
cls
echo ========================================
echo    KIỂM TRA TRẠNG THÁI HỆ THỐNG
echo ========================================
echo.
echo 🔍 Kiểm tra cổng mạng:
netstat -an | findstr ":500"
echo.
echo 🔍 Kiểm tra tiến trình Node.js:
tasklist | findstr node
echo.
echo 🔍 Kiểm tra dịch vụ Windows:
sc query | findstr "JobManagement"
echo.
pause
goto MAIN_MENU

:RESTART_SYSTEM
cls
echo ========================================
echo    KHỞI ĐỘNG LẠI HỆ THỐNG
echo ========================================
echo.
echo Đang dừng tất cả dịch vụ...
taskkill /F /IM node.exe 2>nul
timeout /t 3
echo.
echo Đang khởi động lại hệ thống...
call :START_ALL
goto MAIN_MENU

:OPEN_BROWSER
cls
echo ========================================
echo    MỞ TRÌNH DUYỆT
echo ========================================
echo.
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%j in ("%%i") do (
        set SERVER_IP=%%j
        goto :open_browser
    )
)
:open_browser
echo Đang mở trình duyệt...
start http://%SERVER_IP%:5000
echo ✅ Đã mở trình duyệt!
echo.
pause
goto MAIN_MENU

:SYSTEM_INFO
cls
echo ========================================
echo    THÔNG TIN HỆ THỐNG
echo ========================================
echo.
echo 📁 Thư mục: C:\Users\admin\Desktop\Qly_CV
echo 🌐 Backend Port: 5001
echo 🎨 Frontend Port: 5000
echo 👤 Admin: admin / admin123
echo.
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%j in ("%%i") do (
        set SERVER_IP=%%j
        goto :show_ip
    )
)
:show_ip
echo 🌐 IP máy chủ: %SERVER_IP%
echo 📊 Dữ liệu: data/users.json, data/kpi_evaluations.json
echo.
pause
goto MAIN_MENU

:INSTALL_SERVICE
cls
echo ========================================
echo    CÀI ĐẶT WINDOWS SERVICE
echo ========================================
echo.
echo Đang cài đặt Windows Service...
echo.
echo Tạo service cho Backend...
sc create JobManagementBackend binPath= "C:\Users\admin\Desktop\Qly_CV\start_server_24_7.bat" start= auto
echo.
echo Tạo service cho Frontend...
sc create JobManagementFrontend binPath= "C:\Users\admin\Desktop\Qly_CV\start_frontend_24_7.bat" start= auto
echo.
echo ✅ Windows Service đã được cài đặt!
echo.
pause
goto MAIN_MENU

:START_24_7_FULL
cls
echo ========================================
echo    CHẠY 24/7 - TOÀN BỘ HỆ THỐNG
echo ========================================
echo.
echo Đang khởi động toàn bộ hệ thống 24/7...

REM Quét IP tự động
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%j in ("%%i") do (
        set SERVER_IP=%%j
        goto :ip_found_24_7
    )
)
:ip_found_24_7

REM Khởi động Backend trong cửa sổ mới
echo [%date% %time%] Khởi động Backend Server...
start "Backend Server" cmd /k "cd /d C:\Users\admin\Desktop\Qly_CV && node server.js"
timeout /t 5

REM Khởi động Frontend trong cửa sổ mới
echo [%date% %time%] Khởi động Frontend React...
start "Frontend React" cmd /k "cd /d C:\Users\admin\Desktop\Qly_CV && set PORT=5000 && npm start"
timeout /t 10

echo.
echo ========================================
echo           HỆ THỐNG ĐÃ KHỞI ĐỘNG 24/7!
echo ========================================
echo.
echo ✅ Backend: http://%SERVER_IP%:5001
echo ✅ Frontend: http://%SERVER_IP%:5000
echo ✅ Đăng nhập: admin / admin123
echo.
echo 🔄 Hệ thống sẽ chạy liên tục 24/7
echo    Để dừng: Đóng các cửa sổ hoặc Ctrl+C
echo.

REM Mở trình duyệt
start http://%SERVER_IP%:5000

echo Nhấn phím bất kỳ để thoát...
pause >nul
goto MAIN_MENU

:START_24_7_FRONTEND
cls
echo ========================================
echo    CHẠY 24/7 - FRONTEND REACT
echo ========================================
echo.
echo Đang khởi động Frontend 24/7...

:START_FRONTEND_24_7
echo [%date% %time%] Khởi động Frontend React...
cd /d C:\Users\admin\Desktop\Qly_CV
set PORT=5000
npm start

if %errorlevel% neq 0 (
    echo [%date% %time%] ❌ Lỗi khởi động frontend! Đang thử lại sau 10 giây...
    timeout /t 10
    goto START_FRONTEND_24_7
)

echo [%date% %time%] ❌ Frontend đã dừng! Đang khởi động lại...
timeout /t 5
goto START_FRONTEND_24_7

:START_24_7_BACKEND
cls
echo ========================================
echo    CHẠY 24/7 - BACKEND SERVER
echo ========================================
echo.
echo Đang khởi động Backend 24/7...

REM Đợi 10 giây sau khi khởi động để mở trình duyệt
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%j in ("%%i") do (
        set SERVER_IP=%%j
        goto :ip_found_backend_24_7
    )
)
:ip_found_backend_24_7
timeout /t 10 /nobreak >nul
start http://%SERVER_IP%:5000

:START_SERVER_24_7
echo [%date% %time%] Khởi động Backend Server...
cd /d C:\Users\admin\Desktop\Qly_CV
node server.js

if %errorlevel% neq 0 (
    echo [%date% %time%] ❌ Lỗi khởi động server! Đang thử lại sau 10 giây...
    timeout /t 10
    goto START_SERVER_24_7
)

echo [%date% %time%] ❌ Server đã dừng! Đang khởi động lại...
timeout /t 5
goto START_SERVER_24_7

:STOP_SERVICE
cls
echo ========================================
echo    DỪNG WINDOWS SERVICE
echo ========================================
echo.
echo Đang dừng Windows Service...
net stop JobManagementBackend
net stop JobManagementFrontend
echo ✅ Windows Service đã dừng!
echo.
pause
goto MAIN_MENU

:START_SERVICE
cls
echo ========================================
echo    KHỞI ĐỘNG WINDOWS SERVICE
echo ========================================
echo.
echo Đang khởi động Windows Service...
net start JobManagementBackend
net start JobManagementFrontend
echo ✅ Windows Service đã khởi động!
echo.
pause
goto MAIN_MENU

:EXIT
cls
echo ========================================
echo    TẠM BIỆT!
echo ========================================
echo.
echo Cảm ơn bạn đã sử dụng hệ thống!
echo.
timeout /t 2
exit
