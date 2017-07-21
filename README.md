# Pagejax

Pagejax is a tiny library to easily add pjax to your [page.js](https://github.com/visionmedia/page.js) application.

## Features

- Executes scripts from page partials after load
- Adds a "X-Requested-With":"XMLHttpRequest" header
- Fires start and end events to show loading animation

Used in production at [wesleyluyten.com](https://wesleyluyten.com).

## Usage

```js
	pagejax('.js-pjaxBody');
	pagejax.el.addEventListener('pagejax:send', function onPjaxSend() {
		// Start loading animation here
	});
	pagejax.el.addEventListener('pagejax:end', function onPjaxEnd() {
		// Stop loading animation here
	});

	function onPjaxReady(ctx, next) {
		window.scrollTo(0, 0);

		// Execute script tags in the loaded page partial
		pagejax.execute();

		if (window.pageTitle) {
			document.title = window.pageTitle;
		}

		var body = document.querySelector('body');
		body.className = '';
		var classes = window.bodyClass || '';
		if (classes) {
			body.classList.add(classes.split(' '));
		}

		next();
	}

	page('*', pagejax.load, pagejax.render, onPjaxReady);
	page('/:section?', section);
	page('/:section/*', section);
	page('/', home);
	page('*', notfound);
	page();

	function section(ctx, next) {
		var section = ctx.params.section;
		console.log(section);
		next();
	}

	function home(ctx, next) {
		next();
	}

	function notfound(ctx) {

	}
```
