import { Page, PageHeader, StateView } from "@/components/ui";

export default function PartnerDetail() {
  return (
    <Page>
      <PageHeader title="Partner" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
