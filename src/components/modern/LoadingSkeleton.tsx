import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  variant?: 'video' | 'text' | 'avatar' | 'button' | 'card';
  className?: string;
  count?: number;
  width?: string;
  height?: string;
}

const shimmerVariants = {
  animate: {
    x: ['100%', '-100%'],
    transition: {
      x: {
        repeat: Infinity,
        duration: 2,
        ease: 'easeInOut',
      },
    },
  },
};

function SingleSkeleton({ 
  variant = 'text', 
  className = '', 
  width, 
  height 
}: Omit<LoadingSkeletonProps, 'count'>) {
  const baseClasses = 'relative overflow-hidden bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-lg';
  
  const variantClasses = {
    video: 'aspect-video w-full',
    text: 'h-4 w-full',
    avatar: 'w-10 h-10 rounded-full',
    button: 'h-10 w-24',
    card: 'w-full h-48'
  };

  const style = {
    width: width || undefined,
    height: height || undefined
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        variants={shimmerVariants}
        animate="animate"
        style={{ width: '50%' }}
      />
    </div>
  );
}

export default function LoadingSkeleton(props: LoadingSkeletonProps) {
  const { count = 1, ...skeletonProps } = props;

  if (count === 1) {
    return <SingleSkeleton {...skeletonProps} />;
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <SingleSkeleton {...skeletonProps} />
        </motion.div>
      ))}
    </div>
  );
}

// Pre-built common skeleton components
export function VideoCardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <LoadingSkeleton variant="video" />
          <div className="space-y-2">
            <LoadingSkeleton variant="text" height="16px" />
            <LoadingSkeleton variant="text" width="60%" height="14px" />
            <div className="flex items-center gap-2">
              <LoadingSkeleton variant="avatar" width="24px" height="24px" />
              <LoadingSkeleton variant="text" width="40%" height="12px" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function SearchResultSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className="flex gap-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <LoadingSkeleton variant="video" width="180px" height="100px" />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton variant="text" height="18px" />
            <LoadingSkeleton variant="text" width="70%" height="14px" />
            <LoadingSkeleton variant="text" width="50%" height="12px" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function CommentSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className="flex gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <LoadingSkeleton variant="avatar" />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton variant="text" width="30%" height="14px" />
            <LoadingSkeleton variant="text" height="16px" />
            <LoadingSkeleton variant="text" width="80%" height="16px" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}