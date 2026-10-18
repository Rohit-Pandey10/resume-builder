const colors = {
  surface: '#FFFFFF',
  app: '#FBF7F3',
  canvas: '#F3EEE8',
  ink900: '#1B2236',
  ink600: '#5A6275',
  ink500: '#5F677B',
  accent: '#CC4727',
  accentHover: '#B93F21',
  accentInk: '#B93F21',
  coral500: '#E5603C',
  accentTint: '#FFF1EB',
  success: '#2A7450',
  successBg: '#EAF6EF',
  warning: '#8C5C13',
  warningBg: '#FFF6E3',
  danger: '#B3261E',
  dangerBg: '#FDECEA',
  lavenderInk: '#5A48C3',
  lavenderBg: '#EEEAFB',
  mintInk: '#247156',
  mintBg: '#DFF2EA',
  peachInk: '#A83A20',
  peachBg: '#FDE9DF',
};

function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255);
  const linear = rgb.map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2]);
}

function ratio(foreground, background) {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

const pairs = [
  ['ink-900', 'surface', 'ink900', 'surface', 'text'],
  ['ink-600', 'surface', 'ink600', 'surface', 'text'],
  ['ink-500', 'surface', 'ink500', 'surface', 'text'],
  ['ink-900', 'bg-app', 'ink900', 'app', 'text'],
  ['ink-600', 'bg-app', 'ink600', 'app', 'text'],
  ['ink-500', 'bg-app', 'ink500', 'app', 'text'],
  ['ink-900', 'bg-canvas', 'ink900', 'canvas', 'text'],
  ['ink-600', 'bg-canvas', 'ink600', 'canvas', 'text'],
  ['ink-500', 'bg-canvas', 'ink500', 'canvas', 'text'],
  ['white', 'accent', 'surface', 'accent', 'text'],
  ['white', 'accent-hover', 'surface', 'accentHover', 'text'],
  ['white', 'ink-900', 'surface', 'ink900', 'text'],
  ['accent-ink', 'surface', 'accentInk', 'surface', 'text'],
  ['accent-ink', 'bg-app', 'accentInk', 'app', 'text'],
  ['accent-ink', 'accent-tint', 'accentInk', 'accentTint', 'text'],
  ['coral-500', 'bg-app', 'coral500', 'app', 'large'],
  ['success', 'success-bg', 'success', 'successBg', 'text'],
  ['warning', 'warning-bg', 'warning', 'warningBg', 'text'],
  ['danger', 'danger-bg', 'danger', 'dangerBg', 'text'],
  ['lavender ink', 'lavender bg', 'lavenderInk', 'lavenderBg', 'icon'],
  ['mint ink', 'mint bg', 'mintInk', 'mintBg', 'icon'],
  ['peach ink', 'peach bg', 'peachInk', 'peachBg', 'icon'],
];

let failed = 0;
console.log('Foreground           Background            Ratio   Required  Result');
console.log('---------------------------------------------------------------------');
for (const [foregroundLabel, backgroundLabel, foregroundKey, backgroundKey, kind] of pairs) {
  const value = ratio(colors[foregroundKey], colors[backgroundKey]);
  const required = kind === 'large' ? 3 : 4.5;
  const pass = value >= required;
  if (!pass) failed += 1;
  console.log(`${foregroundLabel.padEnd(20)} ${backgroundLabel.padEnd(21)} ${value.toFixed(2).padStart(5)}   ${required.toFixed(1).padStart(5)}    ${pass ? 'PASS' : 'FAIL'}`);
}

if (failed) process.exitCode = 1;
