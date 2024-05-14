const mix = require('laravel-mix');

mix.js('./src/app.js', '.')
   .vue()
   .sass('./src/app.scss', '.');

