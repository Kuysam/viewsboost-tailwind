// src/pages/Signup.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { auth, db } from '../lib/firebase';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Eye, EyeOff } from 'lucide-react';
import { handleFirebaseError } from '../lib/errorHandling';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  day: string;
  month: string;
  year: string;
  password: string;
  confirmPassword: string;
  region: string;
  city: string;
  country: string;
  agreeTerms: boolean;
  channelName?: string;
  channelUrl?: string;
  channelDescription?: string;
}

const countries = ['United States', 'Canada', 'United Kingdom', 'Australia', 'India', 'Other'];
const months = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [ageError, setAgeError] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormData>();

  const password = watch('password', '');

  const validateAge = () => {
    const day = watch('day');
    const month = watch('month');
    const year = watch('year');
    if (!day || !month || !year) {
      setAgeError('Please select your date of birth');
      return false;
    }
    const birthDate = new Date(parseInt(year), months.indexOf(month), parseInt(day));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    if (age < 18) {
      setAgeError('You must be at least 18 years old');
      return false;
    }
    setAgeError(null);
    return true;
  };

  const onSubmit = async (data: FormData) => {
    setFormError(null);
    if (!validateAge()) return;
    if (!data.email.endsWith('@gmail.com')) {
      setFormError('Please use a Gmail address to sign up.');
      return;
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = cred.user;
      const baseData = {
        uid: user.uid,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        dob: `${data.year}-${months.indexOf(data.month) + 1}-${data.day}`,
        region: data.region,
        city: data.city,
        country: data.country,
        createdAt: new Date().toISOString(),
      };
      if (isCreator && data.channelName && data.channelUrl) {
        await setDoc(doc(db, 'creators', user.uid), {
          ...baseData,
          channelName: data.channelName,
          channelUrl: data.channelUrl,
          channelDescription: data.channelDescription || '',
        });
      } else {
        await setDoc(doc(db, 'viewers', user.uid), baseData);
      }
      navigate('/home');
    } catch (err) {
      const error = handleFirebaseError(err);
      setFormError(error.message || 'Failed to sign up. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(db, isCreator ? 'creators' : 'viewers', user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email || '',
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          createdAt: new Date().toISOString(),
        });
      }
      navigate('/home');
    } catch (err) {
      alert((err as Error).message || 'Google sign-in failed.');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-16 bg-[url('/images/satin-phone-bg.png')] bg-cover bg-center overflow-hidden text-white">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 w-full max-w-xl bg-black/60 backdrop-blur-md p-8 rounded-lg text-white">
        <h1 className="text-3xl font-bold mb-4 text-center">Sign Up</h1>
        <div className="mb-4 text-center">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="mr-2"
              checked={isCreator}
              onChange={() => setIsCreator(!isCreator)}
            />
            Signing up as a creator?
          </label>
        </div>
        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-white text-black font-semibold py-2 rounded-lg shadow flex items-center justify-center gap-2 hover:bg-gray-100 transition mb-4"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="w-5 h-5"
          />
          Sign up with Google
        </button>
        <span className="text-center block text-gray-300 mb-4 text-sm">
          or sign up with email
        </span>
        {formError && (
          <div className="mb-4 p-2 bg-red-500/10 border border-red-500 rounded text-sm text-red-500">
            {formError}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input
            {...register('firstName', { required: true })}
            placeholder="First Name"
            className="w-full p-2 rounded bg-white/10"
          />
          <input
            {...register('lastName', { required: true })}
            placeholder="Last Name"
            className="w-full p-2 rounded bg-white/10"
          />
          <input
            {...register('email', { required: true })}
            placeholder="Email (Gmail only)"
            className="w-full p-2 rounded bg-white/10"
          />
          <div className="flex gap-2">
            <select
              {...register('day')}
              className="w-1/3 p-2 bg-white/10"
            >
              <option value="">Day</option>
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              {...register('month')}
              className="w-1/3 p-2 bg-white/10"
            >
              <option value="">Month</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              {...register('year')}
              className="w-1/3 p-2 bg-white/10"
            >
              <option value="">Year</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          {ageError && <p className="text-pink-500 text-sm">{ageError}</p>}  
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', { required: true })}
              placeholder="Password"
              className="w-full p-2 rounded bg-white/10 pr-10"
            />
            <button
              type="button"
              className="absolute right-2 top-2 text-gray-300"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>   
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              {...register('confirmPassword', { required: true, validate: val => val === password || 'Passwords do not match' })}
              placeholder="Confirm Password"
              className="w-full p-2 rounded bg-white/10 pr-10"
            />
            <button
              type="button"
              className="absolute right-2 top-2 text-gray-300"
              onClick={() => setShowConfirm((v) => !v)}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {isCreator && (
            <>
              <input
                {...register('channelName')}
                placeholder="Channel Name"
                className="w-full p-2 rounded bg-white/10"
              />
              <input
                {...register('channelUrl')}
                placeholder="YouTube Channel ID"
                className="w-full p-2 rounded bg-white/10"
              />
              <textarea
                {...register('channelDescription')}
                placeholder="Channel Description (optional)"
                className="w-full p-2 rounded bg-white/10"
                rows={3}
              />
            </>
          )}
          <input
            {...register('region')}
            placeholder="Region"
            className="w-full p-2 rounded bg-white/10"
          />
          <input
            {...register('city')}
            placeholder="City"
            className="w-full p-2 rounded bg-white/10"
          />
          <select
            {...register('country')}
            className="w-full p-2 rounded bg-white/10"
          >
            <option value="">Select country</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              {...register('agreeTerms', { required: true })}
              className="mr-2"
            />
            I agree to the{' '}
            <Link to="/disclaimer" className="underline">
              Disclaimer
            </Link>
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3 rounded-lg shadow hover:scale-105 transition"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
