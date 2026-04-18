const path = require('node:path');
const fs = require('node:fs');
const rcedit = require('rcedit');

module.exports = async (context) => {
  if (process.platform !== 'win32') {
    return;
  }

  const projectDir = context.packager?.projectDir || process.cwd();
  const productFilename = context.packager?.appInfo?.productFilename || 'App';
  const iconPath = path.resolve(projectDir, 'assets', 'icon.ico');
  const exePath = path.join(context.appOutDir, `${productFilename}.exe`);

  if (!fs.existsSync(iconPath)) {
    throw new Error(`Icon file not found: ${iconPath}`);
  }

  if (!fs.existsSync(exePath)) {
    throw new Error(`App executable not found: ${exePath}`);
  }

  await rcedit(exePath, {
    icon: iconPath,
  });
};
