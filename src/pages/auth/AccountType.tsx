import { Page, PageHeader, StateView } from "@/components/ui";

export default function AccountType() {
  return (
    <Page>
      <PageHeader title="Account type" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
