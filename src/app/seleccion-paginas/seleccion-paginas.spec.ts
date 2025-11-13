import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeleccionPaginas } from './seleccion-paginas';

describe('SeleccionPaginas', () => {
  let component: SeleccionPaginas;
  let fixture: ComponentFixture<SeleccionPaginas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeleccionPaginas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeleccionPaginas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
