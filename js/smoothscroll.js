// Originally by Chris Coyier
// Modified by Duncan Smith for use here

$(function() {
  $('a[href*=#]:not([href=#])').click(function() {
    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
      if (target.length) {

        // Used content instead of 'html,body' 
        // because content is the scrollable element.
        $('#content').animate({

          // Used this instead of target.offset().top
          // so that we scroll properly within #content.
          scrollTop: target[0].offsetTop

          // Sped up the animation a bit.
        }, 200);

        // return false
        // Commented out the above so that we have deep linking
      }
    }
  });
});