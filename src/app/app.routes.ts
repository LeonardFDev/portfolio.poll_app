import { Routes } from '@angular/router';
import { Main } from './pages/main/main';
import { CreateSurvey } from './pages/create-survey/create-survey';
import { ViewSurvey } from './pages/view-survey/view-survey';
import { LegalNoticeEnglishComponent } from './pages/legal-notice-english/legal-notice-english.component';

export const routes: Routes = [
    {
        path: '',
        component: Main,
    },
    {
        path: 'create-question',
        component: CreateSurvey,
    },
    {
        path: 'view-survey/:id',
        component: ViewSurvey,
    },
    {
        path: 'legal-notice',
        component: LegalNoticeEnglishComponent,
    },
];
