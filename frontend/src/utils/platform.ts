export const isMac = () => {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
};

export const isWindows = () => {
  return navigator.platform.toUpperCase().indexOf('WIN') >= 0;
};

export const getPlatformClass = () => {
  if (isMac()) return 'platform-mac';
  if (isWindows()) return 'platform-windows';
  return 'platform-other';
};
