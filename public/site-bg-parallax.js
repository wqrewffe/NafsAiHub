// Parallax and fade effect for .site-bg__layer backgrounds
// This script should be included in index.html after the .site-bg markup
(function(){
  function updateBgParallax() {
    var scrollY = window.scrollY || window.pageYOffset;
    var vh = window.innerHeight;
    var layers = [
      document.querySelector('.site-bg__layer--1'),
      document.querySelector('.site-bg__layer--2'),
      document.querySelector('.site-bg__layer--3')
    ];
    if (!layers[0] || !layers[1] || !layers[2]) return;

    // Compute progress 0..1 as user scrolls the document height
    var docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - vh;
    var prog = docH > 0 ? Math.min(1, scrollY / docH) : 0;

    // For side-by-side slices, we'll subtly parallax them vertically and adjust blur/opacity
    // Sky (left): slowly move down and fade out as user scrolls
    var skyOpacity = Math.max(0.2, 1 - prog * 1.2);
    layers[0].style.opacity = skyOpacity;
    layers[0].style.transform = 'translate3d(' + (prog * -6) + 'px,' + (prog * 40) + 'px,0) scale(1.04)';
    layers[0].style.filter = 'blur(' + (10 + prog * 6) + 'px) saturate(1.05)';

    // Mountain (center): subtle center motion and peak opacity around middle scroll
    var mountainOpacity = 1 - Math.abs(prog - 0.5) * 1.8; // peaks near prog=0.5
    mountainOpacity = Math.max(0.25, Math.min(1, mountainOpacity));
    layers[1].style.opacity = mountainOpacity;
    layers[1].style.transform = 'translate3d(' + (3 + prog * 8) + '%, ' + (prog * 20 - 10) + 'px,0) scale(1.03)';
    layers[1].style.filter = 'blur(' + (14 - prog * 6) + 'px) saturate(1.02)';

    // Land (right): fade in toward end of scroll and move slightly up
    var landOpacity = Math.max(0.25, prog * 1.3);
    layers[2].style.opacity = landOpacity;
    layers[2].style.transform = 'translate3d(' + (prog * 6) + 'px,' + (prog * -30) + 'px,0) scale(1.02)';
    layers[2].style.filter = 'blur(' + (18 - prog * 8) + 'px) saturate(1.01)';
  }
  window.addEventListener('scroll', updateBgParallax, {passive:true});
  window.addEventListener('resize', updateBgParallax);
  document.addEventListener('DOMContentLoaded', updateBgParallax);
  setTimeout(updateBgParallax, 100);
})();
