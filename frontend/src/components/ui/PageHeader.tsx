export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

/** Title row at the top of each screen: heading + one line + actions on the right. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[21px] leading-tight font-bold tracking-[-0.01em]">{title}</h1>
        {description && <p className="mt-1 text-[12.5px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
