; NSIS Installer Customization Script for nchat
; This script customizes the Windows installer with additional features

; Custom pages and macros
!include "MUI2.nsh"
!include "FileFunc.nsh"

; Product information
!define PRODUCT_NAME "nchat"
!define PRODUCT_PUBLISHER "nself"
!define PRODUCT_WEB_SITE "https://nself.org"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"

; Protocol handler registration
!macro registerProtocol
  ; Register nchat:// protocol
  WriteRegStr HKCU "Software\Classes\nchat" "" "URL:nchat Protocol"
  WriteRegStr HKCU "Software\Classes\nchat" "URL Protocol" ""
  WriteRegStr HKCU "Software\Classes\nchat\DefaultIcon" "" "$INSTDIR\${PRODUCT_NAME}.exe,0"
  WriteRegStr HKCU "Software\Classes\nchat\shell\open\command" "" '"$INSTDIR\${PRODUCT_NAME}.exe" "%1"'

  DetailPrint "Registered nchat:// protocol handler"
!macroend

!macro unregisterProtocol
  ; Unregister nchat:// protocol
  DeleteRegKey HKCU "Software\Classes\nchat"

  DetailPrint "Unregistered nchat:// protocol handler"
!macroend

; Registry for startup (auto-launch)
!macro enableAutoLaunch
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCT_NAME}" '"$INSTDIR\${PRODUCT_NAME}.exe" --hidden'
  DetailPrint "Auto-launch enabled"
!macroend

!macro disableAutoLaunch
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCT_NAME}"
  DetailPrint "Auto-launch disabled"
!macroend

; Custom install page for options
Var Dialog
Var CreateDesktopShortcut
Var EnableAutoLaunch
Var RegisterProtocolHandler

; Create custom options page
Function CustomOptionsPage
  !insertmacro MUI_HEADER_TEXT "Installation Options" "Choose additional options for ${PRODUCT_NAME}"

  nsDialogs::Create 1018
  Pop $Dialog

  ${If} $Dialog == error
    Abort
  ${EndIf}

  ; Desktop shortcut checkbox
  ${NSD_CreateCheckBox} 0 0 100% 12u "Create &Desktop Shortcut"
  Pop $CreateDesktopShortcut
  ${NSD_SetState} $CreateDesktopShortcut ${BST_CHECKED}

  ; Auto-launch checkbox
  ${NSD_CreateCheckBox} 0 20u 100% 12u "Start ${PRODUCT_NAME} when &Windows starts"
  Pop $EnableAutoLaunch
  ${NSD_SetState} $EnableAutoLaunch ${BST_UNCHECKED}

  ; Protocol handler checkbox
  ${NSD_CreateCheckBox} 0 40u 100% 12u "Register nchat:// &protocol handler (recommended)"
  Pop $RegisterProtocolHandler
  ${NSD_SetState} $RegisterProtocolHandler ${BST_CHECKED}

  nsDialogs::Show
FunctionEnd

Function CustomOptionsPageLeave
  ; Get checkbox states
  ${NSD_GetState} $CreateDesktopShortcut $0
  ${NSD_GetState} $EnableAutoLaunch $1
  ${NSD_GetState} $RegisterProtocolHandler $2

  ; Store for later use
  ${If} $0 == ${BST_CHECKED}
    CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_NAME}.exe"
  ${EndIf}

  ${If} $1 == ${BST_CHECKED}
    !insertmacro enableAutoLaunch
  ${EndIf}

  ${If} $2 == ${BST_CHECKED}
    !insertmacro registerProtocol
  ${EndIf}
FunctionEnd

; Custom install function
Function .onInstSuccess
  ; Show completion message
  MessageBox MB_ICONINFORMATION "Installation completed successfully!$\r$\n$\r$\nThank you for installing ${PRODUCT_NAME}."
FunctionEnd

; Custom uninstall function
Function un.onUninstSuccess
  ; Clean up protocol handler
  !insertmacro unregisterProtocol

  ; Clean up auto-launch
  !insertmacro disableAutoLaunch

  ; Clean up app data option
  MessageBox MB_YESNO|MB_ICONQUESTION "Do you want to remove all ${PRODUCT_NAME} data and settings?$\r$\n$\r$\nThis will delete all your channels, messages, and preferences." IDYES removeData IDNO skipData

  removeData:
    RMDir /r "$APPDATA\${PRODUCT_NAME}"
    RMDir /r "$LOCALAPPDATA\${PRODUCT_NAME}"
    DetailPrint "Removed application data"

  skipData:
    MessageBox MB_ICONINFORMATION "Uninstallation completed."
FunctionEnd

; Add custom page to installer
!insertmacro MUI_PAGE_CUSTOM CustomOptionsPage CustomOptionsPageLeave

; Installer attributes
RequestExecutionLevel user
ShowInstDetails show
ShowUnInstDetails show

; Version information
VIProductVersion "${VERSION}"
VIAddVersionKey "ProductName" "${PRODUCT_NAME}"
VIAddVersionKey "CompanyName" "${PRODUCT_PUBLISHER}"
VIAddVersionKey "FileDescription" "${PRODUCT_NAME} Installer"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "LegalCopyright" "© 2024-2026 ${PRODUCT_PUBLISHER}"
