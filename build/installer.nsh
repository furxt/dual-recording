; ===== 自定义安装逻辑（你的协议注册）=====
!macro customInstall
  DeleteRegKey HKCR "dualrecording"
  WriteRegStr HKCR "dualrecording" "" "URL:dualrecording"
  WriteRegStr HKCR "dualrecording" "URL Protocol" ""
  WriteRegStr HKCR "dualrecording\shell" "" ""
  WriteRegStr HKCR "dualrecording\shell\Open" "" ""
  WriteRegStr HKCR "dualrecording\shell\Open\command" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME} %1"
!macroend


; ===== 自定义卸载逻辑（删除协议注册）=====
!macro customUnInstall
  DeleteRegKey HKCR "dualrecording"
!macroend
