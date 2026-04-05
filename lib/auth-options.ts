import type { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { readData, writeData } from '@/lib/data-store';
import type { Customer } from '@/lib/customers';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      try {
        const customers = await readData<Customer[]>('customers.json');
        const existing = customers.find((c) => c.email === user.email);

        if (!existing) {
          const newCustomer: Customer = {
            id: `cust_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            email: user.email,
            name: user.name || '',
            googleId: account?.providerAccountId,
            addresses: [],
            wishlist: [],
            createdAt: new Date().toISOString(),
          };
          customers.push(newCustomer);
          await writeData('customers.json', customers);
        } else if (account?.providerAccountId && !existing.googleId) {
          existing.googleId = account.providerAccountId;
          await writeData('customers.json', customers);
        }
      } catch (err) {
        console.error('Error syncing customer on sign-in:', err);
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        try {
          const customers = await readData<Customer[]>('customers.json');
          const customer = customers.find((c) => c.email === user.email);
          if (customer) {
            token.customerId = customer.id;
          }
        } catch {
          // Continue without customerId
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as { customerId?: string }).customerId = token.customerId as string | undefined;
      }
      return session;
    },
  },
};
