import { Page, PageHeader, StateView } from "@/components/ui";

export default function AuditLog() {
  return (
    <Page>
      <PageHeader title="Audit log" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
