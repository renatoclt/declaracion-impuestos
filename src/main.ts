import { bootstrapApplication } from '@angular/platform-browser';
// Import Bootstrap JS (bundle includes Popper) to enable components like modals
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { appConfig } from './app/app.config';
import { App } from './app/app';


bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
