import { Page, PageHeader, StateView } from "@/components/ui";

export default function Reviews() {
  return (
    <Page>
      <PageHeader title="Reviews" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
