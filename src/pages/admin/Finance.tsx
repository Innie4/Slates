import { Page, PageHeader, StateView } from "@/components/ui";

export default function Finance() {
  return (
    <Page>
      <PageHeader title="Finance" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
