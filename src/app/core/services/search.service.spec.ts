import { TestBed } from '@angular/core/testing';

import { SearchService } from './search.service';

describe('SearchService', () => {
  it('starts empty and stores the latest query', () => {
    const search: SearchService = TestBed.inject(SearchService);
    expect(search.query()).toBe('');
    search.set('design');
    expect(search.query()).toBe('design');
  });
});
