import { Component, inject, signal, WritableSignal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from "@angular/router";
import { SurveyStatus } from "../../shared/components/survey-status/survey-status";
import { SecondaryButton } from "../../shared/components/secondary-button/secondary-button";
import { DeleteButton } from "../../shared/components/delete-button/delete-button";
import { InputField } from "../../shared/components/input-field/input-field";
import { CreateQuestion } from "../../shared/components/create-question/create-question";
import { PrimaryButton } from "../../shared/components/primary-button/primary-button";
import { DropDownMenu } from "../../shared/components/drop-down-menu/drop-down-menu";
import { GetSurveyDatabaseService } from '../../shared/services/get-survey-database/get-survey-database';
import { CreateSurveyService } from '../../shared/services/create-survey/create-survey';
import { AnswerInterface } from '../../shared/interfaces/answer';
import { noWhitespaceValidator } from '../../shared/validators/no-whitespace';
import { Footer } from '../../shared/components/footer/footer';

@Component({
  selector: 'app-create-survey',
  imports: [SurveyStatus, SecondaryButton, DeleteButton, InputField, CreateQuestion, PrimaryButton, DropDownMenu, RouterLink, ReactiveFormsModule, Footer],
  templateUrl: './create-survey.html',
  styleUrl: './create-survey.scss',
})
export class CreateSurvey {
  csService = inject(CreateSurveyService);
  gsdService = inject(GetSurveyDatabaseService);

  surveyId!:number

  questionId:number = 0;
  questionNumberList:WritableSignal<{id: number}[]> = signal([]);

  showOverlay = false;
  showOverlayBox = signal(false);

  isErrorTrue = signal(false);

  get isError(): boolean {
    return this.outputError();
  }

  constructor(){
    this.setStartValues();
    this.addQuestion();
  }

  outputError(){
    let error = false
    if(this.isErrorTrue()){
      queueMicrotask(() => this.isErrorTrue = signal(false));
      error = true
    } 
    return error
  }

  fromInputFieldsToCreateSurvey(value:boolean){
    if(value && !this.isErrorTrue()){
      this.isErrorTrue.set(true);
    }
  }

  listNumber(i:number){
    return i+1;
  }

  addQuestion(){
    this.questionId++;
    const questions = this.csService.questionform.get(`questions`) as FormArray;
    this.pushIntoFormArray(questions);
    
    this.questionNumberList.update(current => [...current, { 'id': this.questionId }]);
  }

  pushIntoFormArray(questions:FormArray){
    if(questions){
      questions.push(
        new FormGroup({
          'id': new FormControl(this.questionId),
          'question': new FormControl('', [Validators.required, noWhitespaceValidator]),
          'multipleAnswers': new FormControl(false),
          'answers': new FormArray([])
        })
      )
    }
  }

  removeQuestion(id:number){
    const question = this.csService.getNameControlFromArray('questions', id, 'question');
    const multipleAnswers =this.csService.getNameControlFromArray('questions', id, 'multipleAnswers');

    const answers = this.csService.getFromArray('questions', id, 'answers');
    const isAnyAnswers = answers.value.some((group: AnswerInterface) => !!group.answer);

    if(question.value || multipleAnswers.value || isAnyAnswers) this.resetFields(question, multipleAnswers, answers);
    else if(this.questionNumberList().length >1) this.deleteFields(id);
  }

  resetFields(question:FormControl, multipleAnswers:FormControl, answers:FormArray){
    question.setValue('');
    question.markAsUntouched();
    multipleAnswers.setValue(false);

    answers.controls.forEach(answer => {
      answer.get('answer')?.setValue('');
      answer.get('answer')?.markAsUntouched();
    });
  }

  deleteFields(id:number){
    const questionsArray = this.csService.questionform.get('questions') as FormArray;
    const index = this.csService.findOutIndex('questions',id);
    questionsArray.removeAt(index);

    this.questionNumberList.update(current => current.filter(item => item.id != id));
  }

  deleteInputField(value:string){
    if(this.csService.nameControl(value).value){
      if(value == 'endDate') this.csService.nameControl(value).setValue('No end date');
      else this.csService.nameControl(value).setValue('');
    }
  }

  async saveSurvey(){
    if (this.csService.questionform.invalid) this.cannotBeSavedYet();
    else await this.canBeSaved();
  }

  cannotBeSavedYet(){
    this.csService.questionform.markAllAsTouched();
  }

  async canBeSaved(){
    if(!this.csService.nameControl('description').value) this.csService.nameControl('description').setValue('No description');
    const newSurvey = this.csService.questionform.value

    this.surveyId = await this.gsdService.addSurvey(newSurvey)

    if(this.csService.nameControl('description').value == 'No description') this.csService.questionform.get('description')?.setValue('');

    this.showOverlay = true;
    setTimeout(() => this.showOverlayBox.set(true));
  }

  setStartValues(){
    this.csService.questionform.reset();

    this.csService.questionform.get('id')?.setValue(0);
    this.csService.questionform.get('name')?.setValue('');
    this.csService.questionform.get('endDate')?.setValue('No end date');
    this.csService.questionform.get('description')?.setValue('');
    this.csService.questionform.get('category')?.setValue('No category');

    const questionsArray = this.csService.questionform.get('questions') as FormArray;
    questionsArray.clear();
  }
}