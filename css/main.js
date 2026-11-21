// Nav scroll
const nav=document.getElementById('nav');
if(nav){window.addEventListener('scroll',()=>{nav.classList.toggle('scrolled',window.scrollY>40)})}
// Mobile menu
const hamburger=document.getElementById('hamburger'),navLinks=document.getElementById('navLinks');
if(hamburger){hamburger.addEventListener('click',()=>{const isOpen=navLinks.classList.toggle('open');if(nav){nav.classList.toggle('menu-open',isOpen)}})}
// Content is always visible. Animate only elements approaching from below.
if ('IntersectionObserver' in window) {
  const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
  if (motion.matches) {
    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length) {
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          observer.unobserve(entry.target);
          if (motion.matches && entry.boundingClientRect.top >= window.innerHeight) {
            entry.target.classList.add('reveal-entering');
          }
        }
      }, { rootMargin: '0px 0px 32px 0px' });

      reveals.forEach(element => observer.observe(element));
    }
  }
}
