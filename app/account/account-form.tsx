"use client";

import { type User } from "@supabase/supabase-js";

export default function AccountForm({ user }: { user: User | null }) {
  if (!user) return <p>Loading...</p>;

  return (
    <div className="form-widget">
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="text" value={user.email} disabled />
      </div>

      <div>
        <form action="/auth/signout" method="post">
          <button className="button block" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
