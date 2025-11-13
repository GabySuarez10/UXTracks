import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VincularSitio } from './vincular-sitio';

describe('VincularSitio', () => {
  let component: VincularSitio;
  let fixture: ComponentFixture<VincularSitio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VincularSitio]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VincularSitio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
