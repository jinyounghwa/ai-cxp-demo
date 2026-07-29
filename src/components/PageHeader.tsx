import type { ReactNode } from 'react';

export default function PageHeader({ title, desc, icon, actions }: {
  title: string; desc?: string; icon?: ReactNode; actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div className="flex between center">
        <h1 className="page-title">
          {icon && <span className="flex center">{icon}</span>}
          {title}
        </h1>
        {actions && <div className="flex gap-8">{actions}</div>}
      </div>
      {desc && <p className="page-desc">{desc}</p>}
    </div>
  );
}

