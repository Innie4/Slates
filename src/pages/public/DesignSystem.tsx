import { Page, PageHeader, StateView } from "@/components/ui";

export default function DesignSystem() {
  return (
    <Page>
      <PageHeader title="Design system" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
