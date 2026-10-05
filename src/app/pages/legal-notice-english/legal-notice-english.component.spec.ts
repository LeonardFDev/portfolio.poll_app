import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LegalNoticeEnglishComponent } from './legal-notice-english.component';

describe('LegalNoticeEnglishComponent', () => {
  let component: LegalNoticeEnglishComponent;
  let fixture: ComponentFixture<LegalNoticeEnglishComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LegalNoticeEnglishComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LegalNoticeEnglishComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
