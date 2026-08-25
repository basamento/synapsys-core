type ExecutionsHeaderProps = {
  total: number;
};

export function ExecutionsHeader({ total }: ExecutionsHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 pr-2">
      <div>
        <h1 className="text-lg font-semibold">Executions</h1>
        <p className="text-sm text-muted-foreground">{total} total</p>
      </div>
    </div>
  );
}
