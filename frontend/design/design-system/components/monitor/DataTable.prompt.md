The desktop listing surface: mono uppercase column heads on the sunken strip, 50px rows, hairline dividers, pagination in the footer slot. Replaces the source app's stack of one-card-per-row on wide screens.

```jsx
<DataTable sortKey="name" columns={[{key:"name",header:"Process",sortable:true},{key:"state",header:"State",width:"116px"}]}
  rows={[{id:1,cells:{name:<>…</>,state:<StateBadge state="idle" />},highlight:true}]}
  footer={<ListingPagination page={1} pageSize={10} totalItems={200} />} />
```

Below ~700px use the entity cards (ProcessCard etc.) instead — a table that scrolls sideways is not an option.
