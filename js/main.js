// ============================================================
// main.js — comportamento compartilhado por todas as páginas
// ============================================================

function initNav(){
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if(toggle && links){
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }
  // marca link ativo
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href').split('?')[0];
    if(href === path) a.classList.add('active');
  });
}

document.addEventListener('DOMContentLoaded', initNav);
