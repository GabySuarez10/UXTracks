import { ComponentFixture, TestBed } from '@angular/core/testing';

import { seleccionPaginas } from './seleccion-paginas';

describe('SeleccionPaginas', () => {
  let component: seleccionPaginas;
  let fixture: ComponentFixture<seleccionPaginas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [seleccionPaginas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(seleccionPaginas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
