import { SignedIn, UserButton } from "@clerk/clerk-react";
export default function UserName() {
  return (
    <SignedIn>
      <UserButton />
    </SignedIn>
  );
}
