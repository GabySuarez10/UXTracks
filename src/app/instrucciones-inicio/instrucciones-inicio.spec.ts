import { ComponentFixture, TestBed } from '@angular/core/testing';

import { instruccionesInicio } from './instrucciones-inicio';



describe('InstruccionesInicio', () => {
  let component: instruccionesInicio;
  let fixture: ComponentFixture< instruccionesInicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [instruccionesInicio]
    })
    .compileComponents();

    fixture = TestBed.createComponent( instruccionesInicio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
