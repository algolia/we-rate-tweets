function onKeyPress(inputValue){
    var ul = document.querySelector('ul')

    fetch(`/query/${inputValue}`, { method: 'GET' })
      .then(body => body.json())
      .then(content => injectSearchResults(content))
    console.log(inputValue)

    if (inputValue === "")
      ul.innerHTML = "";
      document.querySelector('.footer').classList.add('pos-abt')
  }

function watchForInput(){
  var input = document.querySelector('input')
  input.addEventListener('input', event => {
    debounce(onKeyPress(event.target.value),500)
    document.querySelector('.footer').classList.remove('pos-abt')
    document.querySelector('.footer').classList.add('pos-rel')
  })
}

function debounce(func, wait, immediate) {
  var timeout;
  return function() {
      var context = this, args = arguments;
      var later = function() {
          timeout = null;
          if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
  };
};

function injectSearchResults(tweetSearchResults){
  var element  = document.getElementById('tweetSearchResults');
  var fragment = document.createDocumentFragment();

  element.classList.add('list-none', 'flex-container', 'flex-dir-row', 'p-small', 'no-p-l', 'no-p-r')

  tweetSearchResults.hits.forEach(function(hit) {

    var engagementNumber = (hit.favoriteCount + hit.retweetCount)
    var engagementEmoji = calculateEngagementEmoji(engagementNumber)

    var li = document.createElement('li');
    var content = document.createElement('div');
    var borderQuote = document.createElement('div');


    li.classList.add('flex-it-3', 'p-small');
    content.classList.add('fill-white', 'elevation1', 'p-xlarge', 'text-left', 'radius6', 'card-border'); 
    borderQuote.classList.add('card-border-line','gradient-dark');

    var p = document.createElement('p')
    p.textContent = hit.text;
    p.classList.add('color-portage')

    var span = document.createElement('span')
    span.innerHTML = `<i class="twitter-icon inline vertical-align-middle"></i>&nbsp; ${engagementEmoji}`
    span.classList.add('adulationScore', 'color-bunting')

    var link = document.createElement('a')
    link.classList.add('no-decoration')
    link.setAttribute('href', hit.url)
    link.setAttribute('target', '_blank')

    link.appendChild(p);
    content.appendChild(borderQuote);
    content.appendChild(link);
    content.appendChild(span);
    li.appendChild(content)
    fragment.appendChild(li);

  });

  element.appendChild(fragment);
}

function calculateEngagementEmoji(number){ 
  switch (true) {
    case (number <= 0):
      return '😏 0/10 keep tweeting'
    break;
    case (number >= 1 && number <= 5): 
      return `${(number + 2)}/10 🎭 Would RT`
    break;
    case (number >= 5 && number <= 9): 
      return `${(number + 3)}/10 💖 Would Like`
    break;
    case (number >= 9 && number <= 15): 
      return `${(number + 4)}/10 🤘 Would like & RT`
    break;
    case (number >= 15 && number <= 20): 
      return `${(number + 5)}/10 🐬 Would DM`
    break;
    case (number < 200): 
      return `${(number + 2)}/10 💥🎉 Would discuss IRL`
    break;
    default: 
      return '😍 bring faves back'
  }
  console.log(number);
}

watchForInput();