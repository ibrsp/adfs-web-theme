# adfs-web-theme
Custom web theme for ADFS 3 for IBRSP

## Installation

Clone this repository to `c:\adfs-web-theme`.  Then, run the following
cmdlets in an elevated PowerShell window:

```powershell
New-AdfsWebTheme -Name ibrsp -SourceName default
Set-AdfsWebTheme -TargetName ibrsp -StyleSheet @{path="c:\adfs-web-theme\theme\css\style.css"}
Set-AdfsWebTheme -TargetName ibrsp -AdditionalFileResource @{Uri="/adfs/portal/script/onload.js";path="c:\adfs-web-theme\theme\script\onload.js"}
Set-AdfsWebConfig -ActiveThemeName ibrsp
```
