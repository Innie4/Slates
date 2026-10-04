import { Page, PageHeader, StateView } from "@/components/ui";

export default function Faq() {
  return (
    <Page>
      <PageHeader title="FAQ" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
