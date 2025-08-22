@echo off
echo Creating .env file for PropEase CRM Backend...
echo.

if exist .env (
    echo .env file already exists!
    echo.
    echo Current contents:
    type .env
    echo.
    echo Do you want to overwrite it? (y/n)
    set /p choice=
    if /i "%choice%"=="y" goto :create
    echo Keeping existing .env file.
    goto :end
)

:create
echo MONGO_URI=mongodb://localhost:27017/propease-crm > .env
echo JWT_SECRET=propease-crm-secret-key-2024 >> .env
echo PORT=4000 >> .env
echo ADMIN_EMAIL=admin@propeasecrm.local >> .env
echo ADMIN_PASSWORD=admin123 >> .env

echo.
echo .env file created successfully!
echo.
echo Contents:
type .env
echo.
echo Now you can start the backend server with: npm run dev

:end
pause

