Page numbers with first/last always visible and an ellipsis for the gap — the same window logic as the app's `visiblePages`. Arrows are bordered squares; the current page is a brand-soft chip.

```jsx
<Pagination page={1} totalPages={20} onChange={setPage} />
```

Pair with the row count and page-size control via `ListingPagination`.
