import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  throw new Error('Por favor define la variable MONGODB_URI en el archivo .env');
}

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return mongoose.connection;

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado exitosamente a MongoDB');
    return mongoose.connection;
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
    throw error;
  }
}

export default mongoose;
