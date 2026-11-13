import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from './db';
import Usuario from '@/Models/Usuario';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credenciales Administrador',
      credentials: {
        email: { label: 'Correo Electrónico', type: 'email', placeholder: 'admin@saxagenda.com' },
        password: { label: 'Contraseña', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Por favor ingresa correo y contraseña');
        }

        try {
          await connectDB();
          const user = await Usuario.findOne({ email: credentials.email });

          if (!user) {
            throw new Error('Credenciales inválidas');
          }

          const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);

          if (!isValidPassword) {
            throw new Error('Credenciales inválidas');
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.nombre || 'Saxofonista Admin'
          };
        } catch (error: any) {
          throw new Error(error.message || 'Error en la autenticación');
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};
