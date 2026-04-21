export type LoginBody = {
  email: string;
  password: string;
  remember?: boolean;
};

export type RegisterBody = {
  email: string;
  password: string;
  organization_name: string;
};

/** Login/register postavljaju httpOnly kolačić; telo može biti samo `{ ok: true }`. */
export type AuthTokenResponse = {
  ok?: boolean;
  token?: string;
};
