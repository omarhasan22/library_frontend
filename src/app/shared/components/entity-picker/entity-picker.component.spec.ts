import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EntityPickerComponent } from './entity-picker.component';

const PEOPLE = [
  { _id: '1', name: 'ابن تيمية', normalizedName: 'ابن تيميه' },
  { _id: '2', name: 'محمد بن عبد الوهاب' },
  { _id: '3', name: 'أحمد ابن حنبل' },
  { _id: '4', name: 'السيوطي' }
];

describe('EntityPickerComponent', () => {
  let fixture: ComponentFixture<EntityPickerComponent>;
  let picker: EntityPickerComponent;
  let emitted: any[];

  const setOptions = (options: any[]) => {
    picker.options = options;
    picker.ngOnChanges({ options: new SimpleChange(null, options, true) });
  };
  const key = (k: string) => picker.onKeydown(new KeyboardEvent('keydown', { key: k }));

  beforeEach(() => {
    TestBed.configureTestingModule({ declarations: [EntityPickerComponent] });
    fixture = TestBed.createComponent(EntityPickerComponent);
    picker = fixture.componentInstance;
    picker.multiple = true;
    emitted = [];
    picker.registerOnChange(v => emitted.push(v));
    setOptions(PEOPLE);
  });

  it('matches Arabic-normalized text, prefix matches first', () => {
    picker.onInput('ابن');
    // 'ابن تيمية' starts with it, 'أحمد ابن حنبل' has it at a word start; 'محمد بن …' has only 'بن'.
    expect(picker.filtered.map(p => p._id)).toEqual(['1', '3']);
    picker.onInput('بن');
    expect(picker.filtered.map(p => p._id)).toEqual(['2', '1', '3']); // word-start match before contains
    picker.onInput('احمد');                                           // أ typed as ا
    expect(picker.filtered.map(p => p._id)).toEqual(['3']);
  });

  it('Enter chooses the active option and emits a new array', () => {
    picker.onInput('السيو');
    key('Enter');
    expect(emitted.pop()).toEqual([{ _id: '4', name: 'السيوطي' }]);
    expect(picker.text).toBe('');
  });

  it('arrow keys move through options and wrap', () => {
    picker.onInput(''); // all 4 options, first active
    key('ArrowDown');
    key('ArrowDown');
    key('ArrowDown');
    expect(picker.activeIndex).toBe(3);
    key('ArrowDown');
    expect(picker.activeIndex).toBe(0);
    key('ArrowUp');
    expect(picker.activeIndex).toBe(3);
    key('Home');
    expect(picker.activeIndex).toBe(0);
  });

  it('hides already-selected options and removes the last chip with Backspace', () => {
    picker.writeValue([{ _id: '1', name: 'ابن تيمية' }]);
    picker.onInput('ابن');
    expect(picker.filtered.some(p => p._id === '1')).toBeFalse();
    picker.onInput('');
    key('Backspace');
    expect(emitted.pop()).toEqual([]);
  });

  it('offers "add" only without an exact (normalized) match, and only with createFn', () => {
    picker.onInput('ابن تيميه');
    expect(picker.canCreate).toBeFalse(); // no createFn
    picker.createFn = () => of({ _id: '9', name: 'x' });
    expect(picker.canCreate).toBeFalse(); // exact normalized match exists
    picker.onInput('ابن القيم');
    expect(picker.canCreate).toBeTrue();
  });

  it('creates, selects and announces a new entity', () => {
    const created: any[] = [];
    picker.created.subscribe(c => created.push(c));
    picker.createFn = name => of({ _id: '9', name, type: 'author' });
    picker.onInput('ابن القيم');
    picker.activeIndex = picker.createIndex;
    key('Enter');
    expect(created[0]._id).toBe('9');
    expect(emitted.pop()).toEqual([{ _id: '9', name: 'ابن القيم' }]);
  });

  it('shows an inline error when creating fails', () => {
    picker.createFn = () => throwError(() => new Error('x'));
    picker.onInput('جديد');
    picker.create();
    expect(picker.createError).toContain('تعذّرت إضافة');
    expect(picker.busy).toBeFalse();
  });

  it('single mode emits one object (or null) and closes after choosing', () => {
    picker.multiple = false;
    picker.onInput('السيوطي');
    key('Enter');
    expect(emitted.pop()).toEqual({ _id: '4', name: 'السيوطي' });
    expect(picker.open).toBeFalse();
    picker.remove(0);
    expect(emitted.pop()).toBeNull();
  });

  it('caps rendered results', () => {
    setOptions(Array.from({ length: 500 }, (_, i) => ({ _id: String(i), name: 'اسم ' + i })));
    picker.maxResults = 50;
    picker.onInput('اسم');
    expect(picker.filtered.length).toBe(50);
  });

  it('lists preferred ids first', () => {
    picker.preferredIds = ['4'];
    picker.onInput('');
    expect(picker.filtered[0]._id).toBe('4');
  });
});
