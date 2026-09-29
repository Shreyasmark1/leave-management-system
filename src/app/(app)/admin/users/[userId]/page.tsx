import { UserDetailView } from "./user-detail-view";

interface UserDetailPageProps {
  params: Promise<{ userId: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { userId } = await params;
  return <UserDetailView userId={userId} />;
}
