import { Page, PageHeader, StateView } from "@/components/ui";

export default function ApplicationReview() {
  return (
    <Page>
      <PageHeader title="Application review" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
