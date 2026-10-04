import { Page, PageHeader, StateView } from "@/components/ui";

export default function Verification() {
  return (
    <Page>
      <PageHeader title="Verification" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
