/**
 * Zero-Flash Theme Script
 * Executed synchronously in <head> before DOM paint.
 */
export function ThemeScript() {
  const scriptContent = `
(function() {
  try {
    var stored = localStorage.getItem('vivre-theme');
    var isDark = stored === 'night' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches) || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    if (isDark) {
      root.classList.add('theme-night', 'dark');
      root.classList.remove('theme-atlas', 'light');
    } else {
      root.classList.add('theme-atlas');
      root.classList.remove('theme-night', 'dark');
    }
  } catch (e) {}
})();
`;

  return (
    <script
      id="theme-script"
      dangerouslySetInnerHTML={{ __html: scriptContent }}
      suppressHydrationWarning
    />
  );
}
