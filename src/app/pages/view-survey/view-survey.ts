import { Component, effect, ElementRef, HostListener, inject, signal, ViewChild} from '@angular/core';
import { PrimaryButton } from "../../shared/components/primary-button/primary-button";
import { SurveyStatus } from "../../shared/components/survey-status/survey-status";
import { Question } from "../../shared/components/question/question";
import { GetSurveyDatabaseService } from '../../shared/services/get-survey-database/get-survey-database';
import { SecondaryButton } from "../../shared/components/secondary-button/secondary-button";
import { Results } from "../../shared/components/results/results";
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { AnswerInterface } from '../../shared/interfaces/answer';
import { QuestionInterFace } from '../../shared/interfaces/question';
import { SurveyVotingService } from '../../shared/services/survey-voting/survey-voting';
import { Footer } from '../../shared/components/footer/footer';

@Component({
  selector: 'app-view-survey',
  imports: [PrimaryButton, SurveyStatus, Question, SecondaryButton, Results, RouterLink, Footer],
  templateUrl: './view-survey.html',
  styleUrl: './view-survey.scss',
})
export class ViewSurvey {
  private route = inject(ActivatedRoute);
  gsdService = inject(GetSurveyDatabaseService);
  svService = inject(SurveyVotingService);

  questionslist = this.gsdService.questionsList;
  currentQuesten = this.gsdService.placeholder;

  currentId:number | null = 0;
  isPlaceholder = signal(false);
  showOverlay = signal(false);

  isCloseResultsBox = false;
  isSurveySubmitted = false;

  isAlreadyVotes = false;
  loadingWindowHidden = false;
  shouldExamined = false;

  answersCheckList = signal(new FormArray<FormGroup>([]));

  @ViewChild('results') results!: ElementRef;

  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth >= 1412 && this.isCloseResultsBox) this.isCloseResultsBox = false;
  }
  
  constructor(){
    this.svService.isFirstChecked = false;
    this.currentId = Number(this.route.snapshot.paramMap.get('id'));
    if(localStorage.getItem(`${this.currentId}`)){
      this.isSurveySubmitted = true;
      this.svService.isSurveySubmitted = true;
    }
    
    effect(() =>{
      this.reactToChange();
    })
  }

  reactToChange(){
    this.isPlaceholder.set(!this.questionslist().some(item => item.id == this.currentId));
      
    this.questionslist().find(item => {
      if(item.id == this.currentId)this.currentQuesten.set(item);
    });
      
    this.alreadyVotes();
    this.createAnswersCheckList();
    
    this.svService.surveyQuestion = this.currentQuesten();
    this.svService.answersCheckList = this.answersCheckList();
  }
  
  ngOnInit(){
    this.loadingWindowHidden = true;
  }

  hasQuestionAnyAnswered(index:number){
    return this.answersCheckList().controls[index]?.get('hasQuestionAnyAnswered')?.value == false;
  }

  alreadyVotes(){
    this.isAlreadyVotes = this.currentQuesten().questions
    .some(question => question.answers.some(answer => answer.counter > 0));
  }

  isEndDateExceeded(){
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return new Date(this.currentQuesten().endDate) < today
  }

  createAnswersCheckList(){
    this.answersCheckList.set(new FormArray<FormGroup>([]));
    this.createAddQuesten();
  }

  createAddQuesten(){
    this.currentQuesten().questions.find(question => {
      this.answersCheckList().push(
        new FormGroup({
          'questionId': new FormControl(question.id),
          'answers': new FormArray<FormGroup>([]),
          'hasQuestionAnyAnswered': new FormControl(null),
        })
      );
      this.createAddAnswers(question);
    });
  }

  createAddAnswers(question:QuestionInterFace){
    question.answers.find(answer => {
      this.answersCheckList().controls.filter(item => item.get('questionId')?.value == question.id).find(item =>{
        const answearsFormArray = item.get('answers') as FormArray
        answearsFormArray.push(
          new FormGroup({
            'answerId': new FormControl(answer.id),
            'checked': new FormControl<boolean>(false, {nonNullable: true})
          })
        );
      });
    });
  }

  surveySubmitted(){
    this.shouldExamined = true;
    if(!this.isSurveySubmitted) this.checkHasQuestionAnyAnswered();
    const hasQuestionsAnyAnswered = (this.answersCheckList().controls.every(item => item.get('hasQuestionAnyAnswered')?.value == true));

    if(!this.isSurveySubmitted && hasQuestionsAnyAnswered) this.canSubmit();
  }

  canSubmit(){
    this.isSurveySubmitted = true;
    this.svService.isSurveySubmitted = true;
    this.shouldExamined = false;
  
    this.currentQuestenUpdate('counter');
    this.currentQuestenUpdate('percent');
  
    this.gsdService.updateSurvey(this.currentId as number, this.currentQuesten().questions);
    this.showAndHideAgain();
  
    this.results?.nativeElement.scrollIntoView({behavior: 'smooth'});

    localStorage.setItem(`${this.currentId}`, 'true');
  }

  showAndHideAgain(){
    this.showOverlay.set(true);
    setTimeout(() => this.showOverlay.set(false),3000);
  }

  checkHasQuestionAnyAnswered(){
    if(this.shouldExamined){
      this.answersCheckList()
      .controls.filter(item => item.get('hasQuestionAnyAnswered')?.setValue((item.get('answers') as FormArray)
      .controls.some(item => item.get('checked')?.value == true)));
    }
  }

  currentQuestenUpdate(valueUpdate: 'percent' | 'counter' | null = null){
    if(valueUpdate == null) return;

    this.currentQuesten.update(updateCounter => {
      const questions = [...updateCounter.questions];
      this.validateQuestions(valueUpdate, questions);

      return {
        ...updateCounter,
        'questions': questions
      };
    });
  }

  validateQuestions(valueUpdate: 'percent' | 'counter', questions: QuestionInterFace[]){
    for (let qIndex = 0; qIndex < questions.length; qIndex++) {
      const question = questions[qIndex];
      const answers = [...question.answers];

      this.validateAnswers(question, answers, qIndex, valueUpdate)
      questions[qIndex]= {
        ...question,
        'answers': answers
      };
    }
  }

  validateAnswers(question: QuestionInterFace, answers: AnswerInterface[], qIndex: number, valueUpdate: 'percent' | 'counter'){
    const answersFormArray = this.answersCheckList().controls[qIndex].get('answers') as FormArray;
    
    for (let aIndex = 0; aIndex < answers.length; aIndex++) {
      const isChecked = answersFormArray.controls[aIndex].get('checked')?.value;
  
      this.counterUpdate(isChecked, valueUpdate, answers, aIndex);
      this.percentValueUpdate(valueUpdate, answers, aIndex, question)
    }
  }

  counterUpdate(isChecked:FormArray, valueUpdate: 'percent' | 'counter', answers: AnswerInterface[], aIndex:number){
    if(isChecked && valueUpdate == 'counter'){
      answers[aIndex] = {
        ...answers[aIndex],
        'counter': answers[aIndex].counter +1,
      };
    }
  }

  percentValueUpdate(valueUpdate: 'percent' | 'counter', answers: AnswerInterface[], aIndex:number, question: QuestionInterFace){
    if(valueUpdate == 'percent'){
      answers[aIndex] = {
        ...answers[aIndex],
        'percentValue' : this.resultConditions(answers[aIndex].counter, question.answers)
      };
    }
  }

  resultConditions(counter:number, answers:AnswerInterface[]){
    if(counter == 0) return 0;
    const value = (counter / answers.reduce((sum, i) => sum + i.counter, 0) * 100);
    if(value == 0) return value;
    else return Number(value.toFixed(1));
  }

  questionAnswersView(index:number){
    return this.answersCheckList().controls[index];
  }

  openClose(){
    if(this.isCloseResultsBox) this.isCloseResultsBox = false;
    else this.isCloseResultsBox = true;
  }
}