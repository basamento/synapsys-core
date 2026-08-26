The footer every listing ends with: range on the left, page-size segmented control and page numbers on the right, sunken background, top hairline. It computes `totalPages` from `totalItems / pageSize`.

```jsx
<ListingPagination page={1} pageSize={10} totalItems={200} onPageChange={setPage} onPageSizeChange={setSize} />
```

On mobile it wraps to two rows on its own — no separate variant needed.
