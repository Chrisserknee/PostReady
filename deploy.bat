@echo off
echo ========================================
echo PostReady - GitHub Deployment Helper
echo ========================================
echo.

echo Step 1: Set Git Configuration
echo ==============================
set /p email="Enter your email: "
set /p name="Enter your name: "

git config user.email "%email%"
git config user.name "%name%"

echo.
echo Git configured successfully!
echo.

echo Step 2: Make Initial Commit
echo ============================
git commit -m "Initial commit: PostReady - AI-powered social media manager"

echo.
echo Commit complete!
echo.

echo Step 3: Next Steps
echo ==================
echo 1. Create a GitHub repository at: https://github.com/new
echo 2. Copy the commands GitHub shows you
echo 3. Run them in this folder
echo.
echo Example:
echo   git remote add origin https://github.com/YOUR_USERNAME/postready.git
echo   git branch -M main
echo   git push -u origin main
echo.
echo Full deployment guide: See GITHUB_DEPLOYMENT.md
echo.

pause


