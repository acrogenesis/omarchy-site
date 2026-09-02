import * as workstations from './modules/workstations.js';
import * as logo from './modules/logo.js';
import * as video from './modules/video.js';
import * as home from './modules/home.js';

document.addEventListener('DOMContentLoaded', () => {

  workstations.ready();
  logo.ready();
  video.ready();
  home.ready();

});
