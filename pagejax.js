(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.pagejax = factory());
}(this, (function () { 'use strict';

var cache = {};


function pagejax$1(selector, options) {
  pagejax$1.el = document.querySelector(selector);
  return pagejax$1.load;
}

/**
 * Dom element in which the new content is added
 * @type {Element}
 */

pagejax$1.el = null;

/**
 * We save the scripts for later execution
 */

pagejax$1.scripts = null;


pagejax$1.load = function(ctx, next) {
	if (!ctx.init) {
		load(ctx.canonicalPath, function(html) {
			ctx.html = html;
			next();
		});
	} else {
    next();
  }
};

pagejax$1.render = function(ctx, next) {
  if (ctx.html) {
    var temp = document.createElement('html');
    temp.innerHTML = ctx.html;
    //extract all scripts for later execution
    pagejax$1.scripts = temp.querySelectorAll('script');
    //strip scripts from dummy element
    Array.prototype.forEach.call(pagejax$1.scripts, function(el) {
      el.parentNode.removeChild(el);
    });
    pagejax$1.el.innerHTML = temp.innerHTML;
  }
  next();
};

pagejax$1.execute = function() {
  if (!pagejax$1.scripts) return;

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
      };
      script.onload = script.onerror = done;
      script.src = this.src;
      document.head.appendChild(script);
    } else {
      script.text = this.text;
      pagejax$1.el.appendChild(script);
      next();
    }
  };

  var i = 0;
  var next = function() {
    if (i >= pagejax$1.scripts.length) {
      return;
    }
    var script = pagejax$1.scripts[i];
    i++;
    cb.call(script, next);
  };
  next();
};


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
  });
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
  pagejax$1.el.dispatchEvent(createCustomEvent(type, data));
}

return pagejax$1;

})));
