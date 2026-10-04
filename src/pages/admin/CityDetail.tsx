import { Page, PageHeader, StateView } from "@/components/ui";

export default function CityDetail() {
  return (
    <Page>
      <PageHeader title="City" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
