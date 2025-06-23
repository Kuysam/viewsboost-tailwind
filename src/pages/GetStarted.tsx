import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Eye, EyeOff } from 'lucide-react';
import { getChannelDetails, getUploadsPlaylistId, getPlaylistVideos } from '../lib/youtube';

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
  channelId?: string;
}

interface UserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  dob: string;
  region: string;
  city: string;
  country: string;
  createdAt: string;
  isCreator: boolean;
  channelId?: string;
}

const countries = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'India',
  'Other',
];

export default function GetStarted() {
  const navigate = useNavigate();
  const [isCreator, setIsCreator] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [autofillLoading, setAutofillLoading] = useState(false);
  const [ageError, setAgeError] = useState<string | null>(null);
  const [channelIdError, setChannelIdError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const password = watch('password', '');
  const channelId = watch('channelId', '');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

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
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      setAgeError('You must be at least 18 years old');
      return false;
    }

    setAgeError(null);
    return true;
  };

  const validateChannelId = async () => {
    if (!isCreator) return true;
    
    if (!channelId) {
      setChannelIdError('Channel ID is required for creators');
      return false;
    }

    try {
      // Validate channel ID and fetch initial videos
      const channelDetails = await getChannelDetails(channelId);
      if (!channelDetails) {
        setChannelIdError('Invalid channel ID');
        return false;
      }

      // Get uploads playlist ID
      const uploadsPlaylistId = await getUploadsPlaylistId(channelId);
      if (!uploadsPlaylistId) {
        setChannelIdError('Could not fetch channel uploads');
        return false;
      }

      // Fetch initial videos to verify access
      const videos = await getPlaylistVideos(uploadsPlaylistId);
      if (!videos || videos.length === 0) {
        setChannelIdError('No videos found in channel');
        return false;
      }

      setChannelIdError(null);
      return true;
    } catch (err) {
      setChannelIdError('Invalid channel ID or access denied');
      return false;
    }
  };

  const autofillLocation = async () => {
    setAutofillLoading(true);
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (!res.ok) throw new Error('Failed to fetch location');
      const data = await res.json();
      setValue('region', data.region || '');
      setValue('city', data.city || '');
      setValue('country', data.country_name || '');
    } catch (err) {
      alert('Could not determine your location.');
    } finally {
      setAutofillLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!validateAge()) return;
    if (!await validateChannelId()) return;

    try {
      let user = auth.currentUser;
      if (!user) {
        const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
        user = cred.user;
      }

      const userData: UserData = {
        uid: user.uid,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        dob: `${data.year}-${months.indexOf(data.month) + 1}-${data.day}`,
        region: data.region,
        city: data.city,
        country: data.country,
        createdAt: new Date().toISOString(),
        isCreator,
      };

      if (isCreator) {
        userData.channelId = data.channelId;
        await setDoc(doc(db, 'creators', user.uid), userData);
      } else {
        await setDoc(doc(db, 'viewers', user.uid), userData);
      }
      // Always create a user doc for rewards and global profile
      await setDoc(doc(db, 'users', user.uid), {
        email: data.email,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        displayName: data.firstName + ' ' + data.lastName,
        role: isCreator ? 'creator' : 'viewer'
      }, { merge: true });

      navigate('/dashboard');
    } catch (err: any) {
      alert(err.message || 'Failed to sign up. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in either collection
      const [creatorSnap, viewerSnap] = await Promise.all([
        getDoc(doc(db, 'creators', user.uid)),
        getDoc(doc(db, 'viewers', user.uid))
      ]);

      if (!creatorSnap.exists() && !viewerSnap.exists()) {
        // New user - create user doc for rewards
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          displayName: user.displayName,
          role: isCreator ? 'creator' : 'viewer'
        }, { merge: true });
        // Redirect to complete profile
        navigate('/complete-profile', { state: { isCreator } });
      } else {
        // Existing user - update lastLogin
        await setDoc(doc(db, 'users', user.uid), {
          lastLogin: new Date().toISOString(),
        }, { merge: true });
        navigate('/dashboard');
      }
    } catch (err: any) {
      alert(err.message || 'Google sign-in failed.');
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 py-16 overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px), url('/images/satin-phone-bg.png')",
        backgroundRepeat: 'repeat, no-repeat',
        backgroundSize: '30px 30px, cover',
        backgroundPosition: 'center center',
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 w-full max-w-xl bg-black/60 backdrop-blur-md p-8 rounded-lg text-white">
        <h1 className="text-3xl font-bold mb-6 text-center">Get Started with ViewsBoost</h1>

        {/* User Type Toggle */}
        <div className="mb-6 flex justify-center">
          <div className="bg-white/10 rounded-lg p-1 flex">
            <button
              type="button"
              onClick={() => setIsCreator(false)}
              className={`px-4 py-2 rounded-md transition ${
                !isCreator ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900' : 'text-gray-300'
              }`}
            >
              Viewer
            </button>
            <button
              type="button"
              onClick={() => setIsCreator(true)}
              className={`px-4 py-2 rounded-md transition ${
                isCreator ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900' : 'text-gray-300'
              }`}
            >
              Creator
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-col items-center">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full bg-white text-black font-semibold py-2 rounded-lg shadow flex items-center justify-center gap-2 hover:bg-gray-100 transition mb-2"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Sign up with Google
          </button>
          <span className="text-gray-400 text-xs">or sign up with email</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold">First Name</label>
              <input
                {...register('firstName', { required: 'First name is required' })}
                className="w-full mt-1 p-2 rounded bg-white/10"
              />
              {errors.firstName && <p className="text-pink-500">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block font-semibold">Last Name</label>
              <input
                {...register('lastName', { required: 'Last name is required' })}
                className="w-full mt-1 p-2 rounded bg-white/10"
              />
              {errors.lastName && <p className="text-pink-500">{errors.lastName.message}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block font-semibold">Email (Gmail only)</label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[\w.%+-]+@gmail\.com$/,
                  message: 'Must be a valid Gmail address',
                },
              })}
              className="w-full mt-1 p-2 rounded bg-white/10"
            />
            {errors.email && <p className="text-pink-500">{errors.email.message}</p>}
          </div>

          {/* Channel ID (for creators) */}
          {isCreator && (
            <div>
              <label className="block font-semibold">YouTube Channel ID</label>
              <input
                {...register('channelId', { required: isCreator ? 'Channel ID is required' : false })}
                className="w-full mt-1 p-2 rounded bg-white/10"
                placeholder="Enter your YouTube channel ID"
              />
              {channelIdError && <p className="text-pink-500">{channelIdError}</p>}
            </div>
          )}

          {/* Date of Birth */}
          <div>
            <label className="block font-semibold">Date of Birth</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <select
                {...register('day', { required: true })}
                className="p-2 rounded bg-white/10 text-white"
              >
                <option value="">Day</option>
                {days.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
              <select
                {...register('month', { required: true })}
                className="p-2 rounded bg-white/10 text-white"
              >
                <option value="">Month</option>
                {months.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
              <select
                {...register('year', { required: true })}
                className="p-2 rounded bg-white/10 text-white"
              >
                <option value="">Year</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            {ageError && <p className="text-pink-500 mt-1">{ageError}</p>}
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block font-semibold">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', {
                required: 'Password is required',
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/,
                  message: '≥8 chars, include upper, lower, number & symbol',
                },
              })}
              className="w-full mt-1 p-2 rounded bg-white/10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-9 text-gray-300"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.password && <p className="text-pink-500 mt-1">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <label className="block font-semibold">Confirm Password</label>
            <input
              type={showConfirm ? 'text' : 'password'}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (val) => val === password || 'Passwords do not match',
              })}
              className="w-full mt-1 p-2 rounded bg-white/10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-2 top-9 text-gray-300"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.confirmPassword && (
              <p className="text-pink-500 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block font-semibold">Region</label>
            <div className="flex gap-2 items-center">
              <input
                {...register('region', { required: 'Region is required' })}
                className="w-full mt-1 p-2 rounded bg-white/10"
              />
              <button
                type="button"
                onClick={autofillLocation}
                disabled={autofillLoading}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold py-2 px-4 rounded-lg shadow hover:scale-105 transition"
              >
                {autofillLoading ? '...' : 'Autofill'}
              </button>
            </div>
            {errors.region && <p className="text-pink-500">{errors.region.message}</p>}
          </div>

          <div>
            <label className="block font-semibold">City</label>
            <input
              {...register('city', { required: 'City is required' })}
              className="w-full mt-1 p-2 rounded bg-white/10"
            />
            {errors.city && <p className="text-pink-500">{errors.city.message}</p>}
          </div>

          <div>
            <label className="block font-semibold">Country</label>
            <select
              {...register('country', { required: 'Country is required' })}
              className="w-full mt-1 p-2 rounded bg-white/10"
            >
              <option value="">Select country</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.country && <p className="text-pink-500">{errors.country.message}</p>}
          </div>

          {/* Agree Terms */}
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('agreeTerms', { required: 'You must agree to terms' })}
              className="mr-2"
            />
            <label className="text-sm">
              I agree to the <Link to="/disclaimer" className="underline">Disclaimer</Link>.
            </label>
          </div>
          {errors.agreeTerms && <p className="text-pink-500">{errors.agreeTerms.message}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold py-3 rounded-lg shadow-lg hover:scale-105 transition mt-4"
          >
            {isSubmitting ? 'Submitting...' : `Sign Up as ${isCreator ? 'Creator' : 'Viewer'}`}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link to="/sign-in" className="text-yellow-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}