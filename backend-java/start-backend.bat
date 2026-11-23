@echo off
set "LOCAL_MAVEN=%~dp0.maven\apache-maven-3.9.9\bin\mvn.cmd"

if exist "%LOCAL_MAVEN%" (
    echo [SUCCESS] Local Maven found! Starting Spring Boot Backend...
    "%LOCAL_MAVEN%" spring-boot:run
) else (
    echo Checking for global mvn in PATH...
    where mvn >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        echo [SUCCESS] Global Maven found in PATH! Starting Spring Boot Backend...
        mvn spring-boot:run
    ) else (
        echo [ERROR] Could not find Maven.
        echo Please ensure Maven is installed or run the setup.
        pause
    )
)
