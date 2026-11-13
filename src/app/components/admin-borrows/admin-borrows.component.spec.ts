import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { AdminBorrowsComponent } from './admin-borrows.component';

// Smoke test: the page builds with its real dependencies (HTTP is mocked, no requests leave the test).
describe('AdminBorrowsComponent', () => {
  let fixture: ComponentFixture<AdminBorrowsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, ReactiveFormsModule, SharedModule],
      declarations: [AdminBorrowsComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(AdminBorrowsComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
