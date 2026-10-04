import { Page, PageHeader, StateView } from "@/components/ui";

export default function Reports() {
  return (
    <Page>
      <PageHeader title="Reports" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
