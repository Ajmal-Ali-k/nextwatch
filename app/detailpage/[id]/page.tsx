import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

/** Legacy URL: /detailpage/[id] → /movies/[id] */
export default async function LegacyDetailPageRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/movies/${id}`);
}
