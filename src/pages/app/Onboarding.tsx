import { Page, PageHeader, StateView } from "@/components/ui";

export default function Onboarding() {
  return (
    <Page>
      <PageHeader title="Get started" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
