import { Page, PageHeader, StateView } from "@/components/ui";

export default function HowItWorks() {
  return (
    <Page>
      <PageHeader title="How it works" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
