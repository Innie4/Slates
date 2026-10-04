import { Page, PageHeader, StateView } from "@/components/ui";

export default function TwoFactor() {
  return (
    <Page>
      <PageHeader title="Two-factor authentication" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
