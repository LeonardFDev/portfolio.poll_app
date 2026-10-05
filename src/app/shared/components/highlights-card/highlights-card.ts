import { Component, Input, signal } from '@angular/core';
import { SurveyStatus } from "../survey-status/survey-status";

@Component({
  selector: 'app-highlights-card',
  imports: [SurveyStatus],
  templateUrl: './highlights-card.html',
  styleUrl: './highlights-card.scss',
})
export class HighlightsCard {
  @Input() highlightsCardText:string ="";
  @Input() highlightsCardH1:string = "";
  @Input() surveyStatus:string ='';
  @Input() surveyId!:number;

  hover = signal(false);
  endingInOutput:string =''

  ngOnInit(){
    if(this.surveyStatus.toLocaleLowerCase() == 'no end date') this.endingInOutput = '360';
    else this.calculateRemainingDays();
  }

  calculateRemainingDays(){
    const date = new Date(this.surveyStatus)
    date.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let endingIn = Math.round((new Date(date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24) + 1);

    if(Number(endingIn) <= 0) endingIn = 0;
    this.endingInOutput = String(endingIn);
  }
}


//html template: <app-highlights-card [highlightsCardText]="'Team activities'" [highlightsCardH1]="'Let’s Plan the Next Team Event Together'"></app-highlights-card>