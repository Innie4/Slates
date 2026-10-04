import { Page, PageHeader, StateView } from "@/components/ui";

export default function ForWasteCompanies() {
  return (
    <Page>
      <PageHeader title="For waste companies" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
