import { getCurrentWindow } from '@tauri-apps/api/window';
import { platform } from '@tauri-apps/plugin-os';
import { Minus, Square, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Titlebar() {
  const appWindow = getCurrentWindow();
  const [isMacOS, setIsMacOS] = useState(false);

  useEffect(() => {
    const checkPlatform = async () => {
      const platformName = await platform();
      setIsMacOS(platformName === 'macos');
    };
    checkPlatform();
  }, []);

  const handleMinimize = () => {
    appWindow.minimize();
  };

  const handleMaximize = () => {
    appWindow.toggleMaximize();
  };

  const handleClose = () => {
    appWindow.close();
  };

  // Don't render custom controls on macOS
  if (isMacOS) {
    return (
      <div className="titlebar" data-tauri-drag-region>
      </div>
    );
  }

  return (
    <div className="titlebar" data-tauri-drag-region>
      <div className="titlebar-title">Hubox</div>
      <div className="titlebar-buttons">
        <button className="titlebar-button" onClick={handleMinimize}>
          <Minus size={14} />
        </button>
        <button className="titlebar-button" onClick={handleMaximize}>
          <Square size={12} />
        </button>
        <button className="titlebar-button titlebar-close" onClick={handleClose}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
