import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please enter a valid email address'
      ]
    },
    password: {
      type: String,
      select: false,
      // legacy: no longer used
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    }
  },
  {
    timestamps: true,
    autoIndex: true
  }
);

// Exclude password and __v from serialized output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

const User = mongoose.model('User', userSchema);
export default User;
