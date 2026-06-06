@echo off
title MindMap
rem Launch MindMap from the built dist folder using built-in Windows PowerShell.
rem No installation, no Node, no extra executable.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
