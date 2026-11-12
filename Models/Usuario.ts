import mongoose from 'mongoose';

const UsuarioSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  nombre: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema);
