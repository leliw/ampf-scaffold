import { EventEmitter, inject } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
    BehaviorSubject,
    filter,
    map,
    merge,
    Observable,
    Subscription,
    tap,
} from 'rxjs';

/**
 * Client-side table data source with URL-synchronized filtering,
 * sorting, and pagination.
 *
 * Data loading is managed externally.
 */
export class UrlSyncedMatTableDataSource<ItemType>
    extends MatTableDataSource<ItemType> {
    protected readonly router = inject(Router);
    protected readonly activatedRoute = inject(ActivatedRoute);

    private readonly filterChange = new EventEmitter<void>();

    private routeParamsSubscription?: Subscription;
    private paginatorSortSubscription?: Subscription;
    private latestRouteParams?: Params;

    private defaultPageSize?: number;
    private isConnected = false;
    private isRestoringParams = false;
    private managesPaginatorAndSort = false;
    private paramsRestoreVersion = 0;

    /**
     * Explicit query parameters override parameters from the activated route.
     *
     * Call parseParams() to apply changes made after connection.
     */
    public queryParams?: Params;

    /**
     * Updates the client-side filter and notifies URL synchronization.
     */
    override set filter(value: string) {
        if (!this.isRestoringParams) {
            this.paramsRestoreVersion++;

            if (this.paginator) {
                this.paginator.pageIndex = 0;
            }
        }

        super.filter = value;
        this.filterChange.emit();
    }

    override get filter(): string {
        return super.filter;
    }

    override connect(): BehaviorSubject<ItemType[]> {
        const rows = super.connect();

        if (!this.isConnected) {
            this.isConnected = true;

            if (this.shouldSynchronizeQueryParamsOnConnect()) {
                this.synchronizeQueryParams();
            }

            this.connectManagedPaginatorAndSort();
        }

        return rows;
    }

    override disconnect(): void {
        this.paramsRestoreVersion++;
        this.isConnected = false;

        this.routeParamsSubscription?.unsubscribe();
        this.routeParamsSubscription = undefined;

        this.paginatorSortSubscription?.unsubscribe();
        this.paginatorSortSubscription = undefined;

        super.disconnect();
    }

    /**
     * Assigns controls and manages their URL synchronization subscription.
     *
     * The subscription is removed on disconnect and restored on reconnect.
     *
     * @deprecated Use setPaginatorAndSortPipe() and manage its subscription.
     */
    public setPaginatorAndSort(
        paginator: MatPaginator | undefined,
        sort: MatSort | undefined,
    ): void {
        const changes = this.setPaginatorAndSortPipe(paginator, sort);

        this.managesPaginatorAndSort = true;
        this.paginatorSortSubscription = changes.subscribe();
    }

    /**
     * Assigns controls and returns their URL synchronization stream.
     *
     * The caller owns the returned subscription and must unsubscribe from it.
     * Calling connect() does not create an additional managed subscription.
     */
    public setPaginatorAndSortPipe(
        paginator: MatPaginator | undefined,
        sort: MatSort | undefined,
    ): Observable<void> {
        this.paginatorSortSubscription?.unsubscribe();
        this.paginatorSortSubscription = undefined;
        this.managesPaginatorAndSort = false;

        if (this.paginator !== paginator) {
            this.defaultPageSize = paginator
                ? this.getDefaultPageSize(paginator)
                : undefined;
        }

        if (paginator !== undefined && this.paginator !== paginator) {
            this.defaultPageSize = this.getDefaultPageSize(paginator);
            this.paginator = paginator;
        }

        if (sort !== undefined && this.sort !== sort) {
            this.sort = sort;
        }

        this.restoreCurrentParams();

        return this.createUrlSynchronizationPipe();
    }

    /**
     * Applies a normalized filter from a text input.
     */
    public applyFilter(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.filter = value.trim().toLowerCase();
    }


    /**
     * Updates the current URL.
     *
     * Override this method to customize URL handling.
     */
    public updateUrl(params: Params): void {
        void this.router.navigate([], {
            relativeTo: this.activatedRoute,
            queryParams: params,
        });
    }

    /**
     * Restores table state without writing it back to the URL.
     */
    public parseParams(params: Params): void {
        const version = ++this.paramsRestoreVersion;
        const wasRestoringParams = this.isRestoringParams;
        this.isRestoringParams = true;

        try {
            this.filter = this.getStringParam(params['q']) ?? '';
            this.parseSortParam(params['order']);
            this.parsePaginatorParams(params);
        } finally {
            this.isRestoringParams = wasRestoringParams;
        }

        const paginator = this.paginator;

        if (!paginator) {
            return;
        }

        const requestedPageIndex = paginator.pageIndex;

        // Material schedules paginator normalization in a microtask.
        void Promise.resolve().then(() => {
            if (
                !this.isConnected ||
                version !== this.paramsRestoreVersion ||
                this.paginator !== paginator
            ) {
                return;
            }

            if (paginator.pageIndex !== requestedPageIndex) {
                this.updateUrl(this.createParams());
            }
        });
    }

    /**
     * Allows subclasses to delay URL restoration until data has been loaded.
     */
    protected shouldSynchronizeQueryParamsOnConnect(): boolean {
        return true;
    }

    /**
     * Applies explicit query parameters or subscribes to route parameters.
     *
     * Repeated calls do not create duplicate route subscriptions.
     */
    protected synchronizeQueryParams(): void {
        if (this.queryParams !== undefined) {
            this.parseParams(this.queryParams);
            return;
        }

        if (this.routeParamsSubscription) {
            return;
        }

        this.routeParamsSubscription =
            this.activatedRoute.queryParams.subscribe(params => {
                this.latestRouteParams = params;
                this.parseParams(params);
            });
    }

    private restoreCurrentParams(): void {
        const params = this.queryParams ?? this.latestRouteParams;

        if (params !== undefined) {
            this.parseParams(params);
        }
    }

    private connectManagedPaginatorAndSort(): void {
        if (
            this.managesPaginatorAndSort &&
            !this.paginatorSortSubscription
        ) {
            this.paginatorSortSubscription =
                this.createUrlSynchronizationPipe().subscribe();
        }
    }

    private createUrlSynchronizationPipe(): Observable<void> {
        const events: Observable<unknown>[] = [this.filterChange];

        if (this.paginator) {
            events.push(this.paginator.page);
        }

        if (this.sort) {
            events.push(this.sort.sortChange);
        }

        return merge(...events).pipe(
            filter(() => !this.isRestoringParams),
            tap(() => this.updateUrl(this.createParams())),
            map(() => undefined),
        );
    }

    private createParams(): Params {
        const params: Params = {};

        if (this.filter) {
            params['q'] = this.filter;
        }

        if (this.sort?.active && this.sort.direction !== '') {
            params['order'] =
                (this.sort.direction === 'desc' ? '-' : '') +
                this.sort.active;
        }

        if (this.paginator) {
            const { pageIndex, pageSize } = this.paginator;

            if (Number.isSafeInteger(pageIndex) && pageIndex > 0) {
                params['page'] = (pageIndex + 1).toString();
            }

            if (Number.isSafeInteger(pageSize) && pageSize > 0) {
                params['perPage'] = pageSize.toString();
            }
        }

        return params;
    }

    private parseSortParam(value: unknown): void {
        if (!this.sort) {
            return;
        }

        const order = this.getStringParam(value);
        const descending = order?.startsWith('-') ?? false;

        const active = order
            ? descending
                ? order.substring(1)
                : order
            : '';

        const isValid =
            !!active &&
            !active.startsWith('-') &&
            !/\s/.test(active) &&
            this.isKnownSortColumn(active);

        this.sort.active = isValid ? active : '';
        this.sort.direction = isValid
            ? descending
                ? 'desc'
                : 'asc'
            : '';

        this.sort.sortChange.emit({
            active: this.sort.active,
            direction: this.sort.direction,
        });
    }

    private parsePaginatorParams(params: Params): void {
        if (!this.paginator) {
            return;
        }

        const previousPageIndex = this.paginator.pageIndex;
        const page = this.parsePositiveInteger(params['page']);
        const requestedPageSize =
            this.parsePositiveInteger(params['perPage']);

        const defaultPageSize =
            this.defaultPageSize ??
            this.getDefaultPageSize(this.paginator);

        this.paginator.pageIndex = page === undefined ? 0 : page - 1;
        this.paginator.pageSize = this.isAllowedPageSize(requestedPageSize)
            ? requestedPageSize
            : defaultPageSize;

        this.paginator.page.emit({
            pageIndex: this.paginator.pageIndex,
            pageSize: this.paginator.pageSize,
            length: this.paginator.length,
            previousPageIndex,
        });
    }

    private getStringParam(value: unknown): string | undefined {
        return typeof value === 'string' ? value : undefined;
    }

    private parsePositiveInteger(value: unknown): number | undefined {
        const rawValue = this.getStringParam(value);

        if (!rawValue || !/^\d+$/.test(rawValue)) {
            return undefined;
        }

        const parsedValue = Number(rawValue);

        return Number.isSafeInteger(parsedValue) && parsedValue > 0
            ? parsedValue
            : undefined;
    }

    private getDefaultPageSize(paginator: MatPaginator): number {
        const options = (paginator.pageSizeOptions ?? []).filter(
            value => Number.isSafeInteger(value) && value > 0,
        );

        if (options.length > 0) {
            return options.includes(paginator.pageSize)
                ? paginator.pageSize
                : options[0];
        }

        return Number.isSafeInteger(paginator.pageSize) &&
            paginator.pageSize > 0
            ? paginator.pageSize
            : 10;
    }

    private isAllowedPageSize(
        value: number | undefined,
    ): value is number {
        if (value === undefined) {
            return false;
        }

        const options = (this.paginator?.pageSizeOptions ?? []).filter(
            option => Number.isSafeInteger(option) && option > 0,
        );

        return options.length === 0 || options.includes(value);
    }

    private isKnownSortColumn(active: string): boolean {
        const sortables = this.sort?.sortables;

        return !sortables || sortables.size === 0 || sortables.has(active);
    }
}
