import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('Publicar3D');
  private translate = inject(TranslateService);

  ngOnInit() {
    // Set default language
    this.translate.setDefaultLang(environment.defaultLanguage);

    // Try to use saved language preference or default
    const savedLang = localStorage.getItem('preferredLanguage');
    const langToUse = savedLang && environment.supportedLanguages.includes(savedLang)
      ? savedLang
      : environment.defaultLanguage;

    this.translate.use(langToUse);
  }
}
