Header / scrolling body / pinned footer — the frame all four listing views share. The body is the only scroller, so the header and pagination stay put.

```jsx
<ListingShell header={<PageHeader title="Workers" meta="1 total" />} footer={<ListingPagination …/>}>
  {workers.map(w => <WorkerCard key={w.id} worker={w} />)}
</ListingShell>
```
