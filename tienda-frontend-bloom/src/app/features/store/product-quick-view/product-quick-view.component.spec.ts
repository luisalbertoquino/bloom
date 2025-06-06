import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductQuickViewComponent } from './product-quick-view.component';

describe('ProductQuickViewComponent', () => {
  let component: ProductQuickViewComponent;
  let fixture: ComponentFixture<ProductQuickViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductQuickViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductQuickViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
