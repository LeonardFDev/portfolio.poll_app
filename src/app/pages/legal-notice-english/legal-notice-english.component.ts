import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Footer } from '../../shared/components/footer/footer';

@Component({
  selector: 'app-legal-notice-english',
  standalone: true,
  imports: [RouterLink, Footer],
  templateUrl: './legal-notice-english.component.html',
  styleUrl: './legal-notice-english.component.scss'
})
export class LegalNoticeEnglishComponent {

}
