// Nav scroll
const nav=document.getElementById('nav');
if(nav){window.addEventListener('scroll',()=>{nav.classList.toggle('scrolled',window.scrollY>40)})}
// Mobile menu
const hamburger=document.getElementById('hamburger'),navLinks=document.getElementById('navLinks');
if(hamburger){hamburger.addEventListener('click',()=>{navLinks.classList.toggle('open')})}
// Reveal on scroll
const reveals=document.querySelectorAll('.reveal');
const observer=new IntersectionObserver((entries)=>{entries.forEach((entry,i)=>{if(entry.isIntersecting){setTimeout(()=>{entry.target.classList.add('visible')},i*80);observer.unobserve(entry.target)}})},{threshold:0.15,rootMargin:'0px 0px -40px 0px'});
reveals.forEach(el=>observer.observe(el));
