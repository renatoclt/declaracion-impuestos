import { TestBed } from '@angular/core/testing';

import { ReportDeclarations } from './report-declarations';

describe('ReportDeclarations', () => {
  let service: ReportDeclarations;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReportDeclarations);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
