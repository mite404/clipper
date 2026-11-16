import * as React from 'react';
import {
  Collapsible as SdkCollapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@ui-sdk/react/collapsible';

// Adapted from the registry: the panel takes any content (the registry wrapped
// it in a <p>), and `keepMounted` holds drafts typed inside while it is shut.
function Collapsible({
  title,
  children,
  keepMounted,
}: {
  title: string;
  children: React.ReactNode;
  keepMounted?: boolean;
}) {
  return (
    <SdkCollapsible data-kit="collapsible">
      <CollapsibleTrigger data-kit="accordion-trigger">{title}</CollapsibleTrigger>
      <CollapsiblePanel data-kit="accordion-panel" keepMounted={keepMounted}>
        <div>{children}</div>
      </CollapsiblePanel>
    </SdkCollapsible>
  );
}

export { Collapsible };
