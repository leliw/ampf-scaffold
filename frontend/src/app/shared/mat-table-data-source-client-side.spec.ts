import { HttpClient, HttpResponse } from '@angular/common/http';
import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MatTableDataSourceClientSide } from './mat-table-data-source-client-side';

interface Item {
  id: number;
  name: string;
}

describe('MatTableDataSourceClientSide', () => {
  const items: Item[] = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ];

  let routeParams: BehaviorSubject<Params>;
  let getMock: ReturnType<typeof vi.fn>;
  let navigateMock: ReturnType<typeof vi.fn>;

  function createDataSource(apiUrl = '/api/items') {
    return TestBed.runInInjectionContext(
      () => new MatTableDataSourceClientSide<Item>(apiUrl),
    );
  }

  function createPaginator(): MatPaginator {
    return {
      pageIndex: 0,
      pageSize: 10,
      length: 0,
      page: new EventEmitter<PageEvent>(),
      initialized: of(void 0),
    } as unknown as MatPaginator;
  }

  function createSort(): MatSort {
    return {
      active: 'name',
      direction: 'asc',
      sortChange: new EventEmitter<Sort>(),
      initialized: of(void 0),
    } as unknown as MatSort;
  }

  beforeEach(() => {
    routeParams = new BehaviorSubject<Params>({});
    getMock = vi.fn().mockReturnValue(
      of(new HttpResponse<Item[]>({ body: items })),
    );
    navigateMock = vi.fn().mockResolvedValue(true);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: HttpClient,
          useValue: { get: getMock },
        },
        {
          provide: Router,
          useValue: { navigate: navigateMock },
        },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: routeParams.asObservable() },
        },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('loads data and exposes it to the table', () => {
    const dataSource = createDataSource();
    const emittedRows: Item[][] = [];

    dataSource.connect().subscribe(rows => emittedRows.push(rows));

    expect(getMock).toHaveBeenCalledWith('/api/items', {
      observe: 'response',
    });
    expect(dataSource.data).toEqual(items);
    expect(emittedRows.at(-1)).toEqual(items);
    expect(dataSource.isLoading).toBe(false);
  });

  it('applies the filter to client-side data', () => {
    const dataSource = createDataSource();
    dataSource.connect();

    const input = {
      target: { value: '  ALI  ' },
    } as unknown as Event;

    dataSource.applyFilter(input);

    expect(dataSource.filter).toBe('ali');
    expect(dataSource.filteredData).toEqual([items[0]]);
  });

  it('restores filter, sorting, and pagination from query parameters', () => {
    const dataSource = createDataSource();
    const paginator = createPaginator();
    const sort = createSort();

    dataSource.setPaginatorAndSortPipe(paginator, sort).subscribe();

    dataSource.parseParams({
      q: 'alice',
      order: '-name',
      page: '3',
      perPage: '20',
    });

    expect(dataSource.filter).toBe('alice');
    expect(sort.active).toBe('name');
    expect(sort.direction).toBe('desc');
    expect(paginator.pageIndex).toBe(2);
    expect(paginator.pageSize).toBe(20);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('keeps a single managed paginator and sort subscription across setup and reconnection', () => {
    const dataSource = createDataSource();
    const paginator = createPaginator();
    const sort = createSort();

    dataSource.setPaginatorAndSort(paginator, sort);
    dataSource.connect();
    dataSource.setPaginatorAndSort(paginator, sort);

    sort.direction = 'desc';
    sort.sortChange.emit({ active: 'name', direction: 'desc' });
    expect(navigateMock).toHaveBeenCalledTimes(1);

    dataSource.disconnect();
    navigateMock.mockClear();
    sort.sortChange.emit({ active: 'name', direction: 'asc' });
    expect(navigateMock).not.toHaveBeenCalled();

    dataSource.connect();
    sort.direction = 'asc';
    sort.sortChange.emit({ active: 'name', direction: 'asc' });
    expect(navigateMock).toHaveBeenCalledTimes(1);

    dataSource.disconnect();
  });

  it('clears sorting when the requested column is not sortable', () => {
    const dataSource = createDataSource();
    const paginator = createPaginator();
    const sort = createSort();
    sort.sortables = new Map([['name', {} as any]]);
    dataSource.setPaginatorAndSortPipe(paginator, sort).subscribe();

    dataSource.parseParams({ order: '-unknown' });

    expect(sort.active).toBe('');
    expect(sort.direction).toBe('');
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('updates the URL when the filter, sorting, or page changes', () => {
    const dataSource = createDataSource();
    const paginator = createPaginator();
    const sort = createSort();

    sort.direction = '';

    const subscription = dataSource
      .setPaginatorAndSortPipe(paginator, sort)
      .subscribe();

    dataSource.filter = 'alice';

    sort.direction = 'desc';
    sort.sortChange.emit({ active: 'name', direction: 'desc' });

    paginator.pageIndex = 1;
    paginator.page.emit({
      pageIndex: 1,
      pageSize: 10,
      length: 30,
      previousPageIndex: 0,
    });

    expect(navigateMock).toHaveBeenCalledTimes(3);
    expect(navigateMock.mock.calls[0][1].queryParams).toEqual({
      q: 'alice',
      perPage: '10',
    });
    expect(navigateMock.mock.calls[1][1].queryParams).toEqual({
      q: 'alice',
      order: '-name',
      perPage: '10',
    });
    expect(navigateMock.mock.calls[2][1].queryParams).toEqual({
      q: 'alice',
      order: '-name',
      page: '2',
      perPage: '10',
    });

    subscription.unsubscribe();
  });

  it('preserves the page size in the URL when on the first page', () => {
    const dataSource = createDataSource();
    const paginator = createPaginator();
    const sort = createSort();
    sort.direction = '';

    const subscription = dataSource
      .setPaginatorAndSortPipe(paginator, sort)
      .subscribe();

    paginator.pageSize = 20;
    paginator.page.emit({
      pageIndex: 0,
      pageSize: 20,
      length: 30,
      previousPageIndex: 0,
    });

    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock.mock.calls[0][1].queryParams).toEqual({
      perPage: '20',
    });

    subscription.unsubscribe();
  });

  it('does not issue additional requests when connect is called repeatedly', () => {
    const dataSource = createDataSource();

    const firstSubscription = dataSource.connect().subscribe();
    const secondSubscription = dataSource.connect().subscribe();

    expect(getMock).toHaveBeenCalledTimes(1);

    firstSubscription.unsubscribe();
    secondSubscription.unsubscribe();
  });

  it('stops reacting to route parameters after the table disconnects', () => {
    const dataSource = createDataSource();
    dataSource.connect();

    dataSource.disconnect();
    routeParams.next({ q: 'after-disconnect' });

    expect(dataSource.filter).toBe('');
  });

  it('sets the error state and ends loading after an HTTP error', () => {
    const error = new Error('Network error');
    getMock.mockReturnValue(throwError(() => error));

    const dataSource = createDataSource();
    dataSource.connect();

    expect(dataSource.loadError).toBe(error);
    expect(dataSource.isLoading).toBe(false);
  });

  it('ignores invalid pagination and sorting query parameters safely', () => {
    const dataSource = createDataSource();
    const paginator = createPaginator();
    const sort = createSort();

    expect(() => {
      dataSource.parseParams({
        page: 'invalid',
        perPage: 'invalid',
        order: 42,
      });
    }).not.toThrow();

    dataSource.setPaginatorAndSortPipe(paginator, sort).subscribe();
    dataSource.parseParams({
      page: 'invalid',
      perPage: 'invalid',
      order: 42,
    });

    expect(paginator.pageIndex).toBe(0);
    expect(Number.isFinite(paginator.pageSize)).toBe(true);
    expect(sort.active).toBe('');
    expect(sort.direction).toBe('');
  });

  it('reloads data when refresh is called', () => {
    const dataSource = createDataSource();
    dataSource.connect();

    dataSource.refresh();

    expect(getMock).toHaveBeenCalledTimes(2);
  });

  it('manages the setPaginatorAndSort subscription and removes it on disconnect', () => {
    const dataSource = createDataSource();
    const paginator = createPaginator();
    const sort = createSort();

    dataSource.connect();
    dataSource.setPaginatorAndSort(paginator, sort);

    dataSource.filter = 'alice';

    expect(navigateMock).toHaveBeenCalledTimes(1);

    dataSource.disconnect();
    dataSource.filter = 'bob';

    expect(navigateMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    { description: 'missing', params: {} },
    { description: 'malformed', params: { order: '-' } },
    { description: 'containing whitespace', params: { order: 'name desc' } },
  ])('clears sorting when the order parameter is $description', ({ params }) => {
    const dataSource = createDataSource();
    const sort = createSort();

    sort.active = 'name';
    sort.direction = 'desc';
    dataSource.sort = sort;

    dataSource.parseParams(params);

    expect(sort.active).toBe('');
    expect(sort.direction).toBe('');
  });
  async function flushMicrotasks(): Promise<void> {
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
    }
  }

  it('normalizes an out-of-range page in both the paginator and URL', async () => {
    const dataSource = createDataSource();
    const paginator = createPaginator();
    const sort = createSort();

    dataSource.setPaginatorAndSort(paginator, sort);
    const subscription = dataSource.connect().subscribe();
    await flushMicrotasks();

    navigateMock.mockClear();

    // Only two rows exist, so page 3 is out of range.
    routeParams.next({ page: '3', perPage: '10' });
    await flushMicrotasks();

    const finalPageIndex = paginator.pageIndex;
    const lastNavigation = navigateMock.mock.calls.at(-1);

    subscription.unsubscribe();
    dataSource.disconnect();

    expect(finalPageIndex).toBe(0);
    expect(lastNavigation).toBeDefined();
    expect(lastNavigation?.[1].queryParams.page).toBeUndefined();
  });
  it('keeps the URL on the first page after filtering from a later page', async () => {
    const rows: Item[] = Array.from({ length: 30 }, (_, index) => ({
      id: index + 1,
      name: index === 0 ? 'Alice' : `Other ${index}`,
    }));

    getMock.mockReturnValue(
      of(new HttpResponse<Item[]>({ body: rows })),
    );

    const dataSource = createDataSource();
    const paginator = createPaginator();
    const sort = createSort();

    dataSource.setPaginatorAndSort(paginator, sort);
    const subscription = dataSource.connect().subscribe();
    await flushMicrotasks();

    paginator.pageIndex = 2;
    paginator.page.emit({
      pageIndex: 2,
      pageSize: 10,
      length: rows.length,
      previousPageIndex: 0,
    });

    navigateMock.mockClear();

    dataSource.applyFilter({
      target: { value: 'alice' },
    } as unknown as Event);

    await flushMicrotasks();

    const finalPageIndex = paginator.pageIndex;
    const lastNavigation = navigateMock.mock.calls.at(-1);

    subscription.unsubscribe();
    dataSource.disconnect();

    expect(finalPageIndex).toBe(0);
    expect(lastNavigation).toBeDefined();
    expect(lastNavigation?.[1].queryParams).toEqual({
      q: 'alice',
      perPage: '10',
    });
  });
  it('preserves the assigned paginator when setup receives undefined', () => {
    const dataSource = createDataSource();
    const paginator = createPaginator();
    const sort = createSort();

    dataSource.setPaginatorAndSort(paginator, sort);
    dataSource.setPaginatorAndSort(undefined, sort);

    const assignedPaginator = dataSource.paginator;
    dataSource.disconnect();

    expect(assignedPaginator).toBe(paginator);
  });
});
