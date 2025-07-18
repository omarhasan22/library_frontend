/*!
* Start Bootstrap - Agency v7.0.12 (https://startbootstrap.com/theme/agency)
* Copyright 2013-2023 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-agency/blob/master/LICENSE)
*/
//
// Scripts
// 

window.addEventListener('DOMContentLoaded', event => {
  const nav = document.body.querySelector('#mainNav');
  if (!nav) return;

  // If we’re NOT on the home page, always shrink
  if (window.location.pathname !== '/') {
    nav.classList.add('navbar-shrink');
    return;   // skip attaching scroll listener entirely
  }

  // Otherwise (we are on "/"), use your scroll-threshold logic
  const navbarShrink = function () {
    if (window.scrollY < 100) {
      nav.classList.remove('navbar-shrink');
    } else {
      nav.classList.add('navbar-shrink');
    }
  };


    // Shrink the navbar 
    navbarShrink();

    // Shrink the navbar when page is scrolled
    document.addEventListener('scroll', navbarShrink);

    //  Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            rootMargin: '0px 0px -40%',
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

    const wrapper = document.querySelector('.title-wrapper');
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          wrapper.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.2   // when 20% of the wrapper is visible
    });

    observer.observe(wrapper);

});
