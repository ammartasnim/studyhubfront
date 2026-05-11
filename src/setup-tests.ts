// sockjs-client requires Node.js `global` — polyfill it for the browser test environment
(window as any)['global'] = window;
