import { Page, PageHeader, StateView } from "@/components/ui";

export default function ResetPassword() {
  return (
    <Page>
      <PageHeader title="Reset password" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
