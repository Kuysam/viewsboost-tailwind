import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Upload, Mic, Video, Camera, X } from 'lucide-react';

interface ActionItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions?: ActionItem[];
  mainIcon?: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  size?: 'sm' | 'md' | 'lg';
}

const defaultActions: ActionItem[] = [
  {
    icon: <Video className="w-5 h-5" />,
    label: 'Upload Video',
    onClick: () => console.log('Upload video'),
    color: 'bg-blue-500'
  },
  {
    icon: <Camera className="w-5 h-5" />,
    label: 'Create Short',
    onClick: () => console.log('Create short'),
    color: 'bg-purple-500'
  },
  {
    icon: <Mic className="w-5 h-5" />,
    label: 'Record Audio',
    onClick: () => console.log('Record audio'),
    color: 'bg-green-500'
  },
  {
    icon: <Upload className="w-5 h-5" />,
    label: 'Import',
    onClick: () => console.log('Import'),
    color: 'bg-orange-500'
  }
];

export default function FloatingActionButton({
  actions = defaultActions,
  mainIcon = <Plus className="w-6 h-6" />,
  position = 'bottom-right',
  size = 'lg'
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2'
  };

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const containerVariants = {
    closed: {
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    },
    open: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    closed: {
      y: 20,
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.2
      }
    },
    open: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  const mainButtonVariants = {
    closed: {
      rotate: 0,
      scale: 1
    },
    open: {
      rotate: 45,
      scale: 1.1
    }
  };

  const overlayVariants = {
    closed: {
      opacity: 0,
      backdropFilter: 'blur(0px)'
    },
    open: {
      opacity: 1,
      backdropFilter: 'blur(8px)'
    }
  };

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/20"
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div className={`fixed ${positionClasses[position]} z-50`}>
        <motion.div
          className="flex flex-col-reverse items-center gap-4"
          variants={containerVariants}
          initial="closed"
          animate={isOpen ? "open" : "closed"}
        >
          {/* Action Items */}
          <AnimatePresence>
            {isOpen && actions.map((action, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex items-center gap-3"
              >
                {/* Label */}
                <motion.div
                  className="bg-black/80 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {action.label}
                </motion.div>

                {/* Action Button */}
                <motion.button
                  className={`
                    ${action.color || 'bg-gradient-to-r from-purple-500 to-pink-500'}
                    ${sizeClasses.md}
                    text-white rounded-full shadow-xl
                    flex items-center justify-center
                    hover:shadow-2xl active:scale-95
                    transition-all duration-200
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                    setIsOpen(false);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {action.icon}
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Main FAB */}
          <motion.button
            className={`
              ${sizeClasses[size]}
              bg-gradient-to-r from-yellow-400 to-orange-500
              text-white rounded-full shadow-xl
              flex items-center justify-center
              hover:shadow-2xl active:scale-95
              transition-all duration-200
              relative overflow-hidden
            `}
            variants={mainButtonVariants}
            onClick={() => setIsOpen(!isOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Ripple effect */}
            <motion.div
              className="absolute inset-0 bg-white/20 rounded-full"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
            
            {/* Icon with transition */}
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className={iconSizes[size]} />
                </motion.div>
              ) : (
                <motion.div
                  key="open"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {mainIcon}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      </div>
    </>
  );
}

// Quick action variants
export function CreateContentFAB() {
  const createActions: ActionItem[] = [
    {
      icon: <Video className="w-5 h-5" />,
      label: 'Upload Video',
      onClick: () => window.location.href = '/studio',
      color: 'bg-blue-600'
    },
    {
      icon: <Camera className="w-5 h-5" />,
      label: 'Create Short',
      onClick: () => window.location.href = '/shorts/create',
      color: 'bg-purple-600'
    },
    {
      icon: <Mic className="w-5 h-5" />,
      label: 'Go Live',
      onClick: () => window.location.href = '/live/create',
      color: 'bg-red-600'
    }
  ];

  return (
    <FloatingActionButton
      actions={createActions}
      mainIcon={<Plus className="w-6 h-6" />}
    />
  );
}

export function AdminFAB() {
  const adminActions: ActionItem[] = [
    {
      icon: <Upload className="w-5 h-5" />,
      label: 'Import Templates',
      onClick: () => window.location.href = '/template-importer',
      color: 'bg-green-600'
    },
    {
      icon: <Video className="w-5 h-5" />,
      label: 'Ingest Videos',
      onClick: () => console.log('Ingest videos'),
      color: 'bg-blue-600'
    }
  ];

  return (
    <FloatingActionButton
      actions={adminActions}
      mainIcon={<Plus className="w-6 h-6" />}
      position="bottom-left"
    />
  );
}