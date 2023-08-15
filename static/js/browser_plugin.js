runtime = new AnnotationRuntime(window.location.href);

/* Set up color picker */
Coloris({
  el: '.coloris',
  swatches: [
    '#A3B9C9',  // powder blue
    '#EEE3AB',  // vanilla
    '#D9CFC1',  // bone
    '#FFBFB7',  // melon
    '#FFD447',  // mustard
    '#4ECDC4',  // robin egg blue
    '#59F8E8',  // fluorescent cyan
    '#90E0EF',  // non photo blue
    '#8FBC94',  // cambridge blue
    '#C3BF6D',  // citron
    '#DAFFED',  // mint green
    '#FFD4B8'   // apricot
  ]
});

Coloris.setInstance('.instance3', {
  theme: 'pill',
  themeMode: 'dark',
  formatToggle: true
});