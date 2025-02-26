// Updated router.js
// router.js
function navigateTo(pageId) {
  const pages = document.querySelectorAll('.page');
  pages.forEach((page) => (page.style.display = 'none'));
  document.getElementById(pageId).style.display = 'block';
}
