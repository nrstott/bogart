$(function () {
  setTimeout(function () {
    $('code').each(function (i,block) {
      var $block = $(block);
      var html = $block.html();

      html = html.replace('(</span>nextApp<span class="token punctuation">)', '(</span><span class="token param">nextApp</span><span class="token punctuation">)');
      html = html.replace('(</span>req<span class="token punctuation">)', '(</span><span class="token param">req</span><span class="token punctuation">)');
      html = html.replace('<span class="token keyword">var</span> exampleMiddleware <span class="token operator">=</span> <span class="token keyword">function</span>', '<span class="token keyword">var</span> <span class="token func-var">exampleMiddleware</span> <span class="token operator">=</span> <span class="token keyword">function</span>')

      $block.html(html);

      $('.keyword:contains(return)').addClass('return');
    });
  },100);
});


$(function () {
  if ($('.visible-xs').css('display').indexOf('none') >= 0) {
    setUpNav();
  } else {
    FastClick.attach(document.body);
  }
});

function setUpNav() {
  $('#content').scrollspy({
    target: '.side-nav',
    offset: 75
  });
}