export type Address = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export type Customer = {
  id: string;
  email: string;
  name: string;
  googleId?: string;
  addresses: Address[];
  wishlist: string[];
  createdAt: string;
};
