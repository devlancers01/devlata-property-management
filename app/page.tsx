import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    // If logged in, go to dashboard
    redirect("/dashboard");
  } else {
    // If not logged in, go to login
    redirect("/login");
  }
}