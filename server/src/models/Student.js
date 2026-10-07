import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 80,
    },
    registerNumber: {
      type: String,
      required: [true, 'Register number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 24,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
    },
    // Only the bcrypt hash is ever stored - never a plain text password.
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      maxlength: 80,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [1, 'Year must be between 1 and 5'],
      max: [5, 'Year must be between 1 and 5'],
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
      trim: true,
      maxlength: 4,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
      maxlength: 15,
    },
    profileImage: {
      type: String,
      default: '',
    },
    informationSubmitted: {
      type: Boolean,
      default: false,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/** Hash a plain text password with bcrypt. */
studentSchema.statics.hashPassword = async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 12);
};

/** Compare a plain text password with the stored bcrypt hash. */
studentSchema.methods.comparePassword = async function comparePassword(plainPassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plainPassword, this.passwordHash);
};

/** Never expose the password hash outside of the API. */
studentSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    name: this.name,
    registerNumber: this.registerNumber,
    email: this.email,
    department: this.department,
    year: this.year,
    section: this.section,
    phone: this.phone,
    profileImage: this.profileImage,
    informationSubmitted: this.informationSubmitted,
    submittedAt: this.submittedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model('Student', studentSchema);
