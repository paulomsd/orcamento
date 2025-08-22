import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewForm from "./ui";

export default async function Page(){
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) redirect("/login");
  return <NewForm/>;
}
