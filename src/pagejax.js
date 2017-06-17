
export default pagejax;


var cache = {};


function pagejax(selector, options) {
  pagejax.el = document.querySelector(selector);
  return pagejax.load;
}

/**
 * Dom element in which the new content is added
 * @type {Element}
 */

pagejax.el = null;

/**
 * We save the scripts for later execution
 */

pagejax.scripts = null;


pagejax.load = function(ctx, next) {
	if (!ctx.init) {
		load(ctx.canonicalPath, function(html) {
			ctx.html = html;
			next();
		});
	} else {
    next();
  }
}

pagejax.render = function(ctx, next) {
  if (ctx.html) {
    var temp = document.createElement('html');
    temp.innerHTML = ctx.html;
    //extract all scripts for later execution
    pagejax.scripts = temp.querySelectorAll('script');
    //strip scripts from dummy element
    Array.prototype.forEach.call(pagejax.scripts, function(el) {
      el.parentNode.removeChild(el);
    });
    pagejax.el.innerHTML = temp.innerHTML;
  }
  next();
}

pagejax.execute = function() {
  if (!pagejax.scripts) return;

  var existingScripts = document.querySelectorAll('script[src]');

  var cb = function(next) {
    var script = document.createElement('script');
    if (this.type) script.type = this.type;

    if (this.src) {
      var src = this.src;
      var dup = Array.prototype.filter.call(existingScripts, function(s) {
        return s.src === src;
      });

      if (dup.length) {
        next();
        return;
      }

      var done = function() {
        script.onload = null;
        script.onerror = null;
        next();
      }
      script.onload = script.onerror = done;
      script.src = this.src;
      document.head.appendChild(script);
    } else {
      script.text = this.text;
      pagejax.el.appendChild(script);
      next();
    }
  }

  var i = 0;
  var next = function() {
    if (i >= pagejax.scripts.length) {
      return;
    }
    var script = pagejax.scripts[i];
    i++;
    cb.call(script, next);
  }
  next();
}


function ajax(options) {
  var request = new XMLHttpRequest();
  request.open('GET', options.url, true);
  request.setRequestHeader("X-Requested-With", "XMLHttpRequest");

  request.onload = function() {
    if (request.status >= 200 && request.status < 400) {
      // Success!
      fire('pagejax:end');
      options.success(request.responseText);
    } else {
      // We reached our target server, but it returned an error
      console.log(request.status);
    }
  };

  request.onerror = function() {
    // There was a connection error of some sort
  };

  fire('pagejax:send');
  request.send();
}

function load(url, cb) {
  if (cache[url]) return cb(cache[url]);
  ajax({
    url: url,
    success: function(data) {
      cache[url] = data;
      cb(data);
    }
  })
}

function createCustomEvent(name, data) {
  if (window.CustomEvent) {
    var event = new CustomEvent(name, {detail: data});
  } else {
    var event = document.createEvent('CustomEvent');
    event.initCustomEvent(name, true, true, data);
  }
  return event;
}

function fire(type, data) {
  pagejax.el.dispatchEvent(createCustomEvent(type, data));
}
