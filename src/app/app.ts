import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { UserContextService } from './services/user-context.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly userContext = inject(UserContextService);

  constructor() {
    void this.userContext.initializeFromStoredToken();
  }
}
