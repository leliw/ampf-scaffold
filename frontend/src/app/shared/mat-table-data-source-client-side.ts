import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  defer,
  EMPTY,
  filter,
  finalize,
  Observable,
  startWith,
  Subject,
  Subscription,
  switchMap,
  tap,
} from 'rxjs';

import { UrlSyncedMatTableDataSource } from './url-synced-mat-table-data-source';

/**
 * Client-side table data source with HTTP loading and URL synchronization.
 *
 * Existing endpoint-based usage and getData() overrides are supported.
 *
 * For externally managed loading, including httpResource, use
 * UrlSyncedMatTableDataSource instead.
 */
export class MatTableDataSourceClientSide<ItemType>
  extends UrlSyncedMatTableDataSource<ItemType> {
  protected http = inject(HttpClient);

  private readonly refresh$ = new Subject<void>();
  private connectionSubscription?: Subscription;

  /**
   * Indicates that data is being loaded from the server.
   */
  public isLoading = false;

  /**
   * Contains the most recent loading error.
   */
  public loadError: unknown = null;

  /**
   * @param apiUrl Optional endpoint used by the default getData() method.
   * When omitted, subclasses must override getData().
   */
  constructor(private readonly apiUrl?: string) {
    super();
  }

  override connect(): BehaviorSubject<ItemType[]> {
    if (!this.connectionSubscription) {
      const connection = new Subscription();
      this.connectionSubscription = connection;

      connection.add(
        this.refresh$
          .pipe(
            startWith(void 0),
            switchMap(() =>
              defer(() => {
                this.isLoading = true;
                this.loadError = null;

                return this.getData();
              }).pipe(
                filter(response => response.ok),
                tap(response => {
                  this.data = response.body ?? [];
                  this.synchronizeQueryParams();
                }),
                catchError(error => {
                  this.loadError = error;
                  return EMPTY;
                }),
                finalize(() => {
                  this.isLoading = false;
                }),
              ),
            ),
          )
          .subscribe(),
      );
    }

    return super.connect();
  }

  override disconnect(): void {
    this.connectionSubscription?.unsubscribe();
    this.connectionSubscription = undefined;

    this.isLoading = false;

    super.disconnect();
  }

  /**
   * Fetches data from the HTTP server.
   *
   * Override this method to use an application service or another source.
   */
  public getData(): Observable<HttpResponse<ItemType[]>> {
    if (this.apiUrl) {
      return this.http.get<ItemType[]>(this.apiUrl, {
        observe: 'response',
      });
    }

    throw new Error(
      'The apiUrl is required for the default data loading behavior. ' +
        'Provide an endpoint or override getData().',
    );
  }

  /**
   * Fetches the table data again while the data source is connected.
   */
  public refresh(): void {
    this.refresh$.next();
  }

  /**
   * Preserves legacy behavior: URL parameters are restored after
   * a successful data load.
   */
  protected override shouldSynchronizeQueryParamsOnConnect(): boolean {
    return false;
  }
}
