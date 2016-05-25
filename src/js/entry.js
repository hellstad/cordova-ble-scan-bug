require('./app');
require('./lib/*.js', { mode: 'expand' });
require('./controllers/*.js', { mode: 'expand' });
require('./directives/*.js', { mode: 'expand' });
require('./services/*.js', { mode: 'expand' });
require('./factories/*.js', { mode: 'expand' });
