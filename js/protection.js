/**
 * Content protection (front-end level deterrent).
 * Prevents: right-click, text selection, copy, Ctrl+U/S/P
 */
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('selectstart', e => {
  // Allow selection inside code blocks for usability
  if (e.target.closest('.code-block')) return;
  e.preventDefault();
});
document.addEventListener('copy', e => {
  if (e.target.closest('.code-block')) return;
  e.preventDefault();
});
document.addEventListener('keydown', e => {
  if (e.ctrlKey && ['u', 's', 'p'].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});
