import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  X
} from 'lucide-react';

const Notification = ({ 
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  onClose, 
  show = true 
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setIsVisible(show);
    if (show) {
      setIsExiting(false);
    }
  }, [show]);

  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  const getNotificationStyles = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          iconBg: 'bg-green-100',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700'
        };
      case 'error':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700'
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          iconBg: 'bg-yellow-100',
          titleColor: 'text-yellow-800',
          messageColor: 'text-yellow-700'
        };
      default:
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700'
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const styles = getNotificationStyles();

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div
        className={`
          ${styles.bgColor} ${styles.borderColor} border rounded-xl shadow-lg p-4
          transform transition-all duration-300 ease-in-out
          ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        `}
      >
        <div className="flex items-start space-x-3">
          <div className={`${styles.iconBg} p-2 rounded-full flex-shrink-0`}>
            <div className={styles.iconColor}>
              {getIcon()}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className={`text-sm font-semibold ${styles.titleColor} mb-1`}>
                {title}
              </h3>
            )}
            {message && (
              <p className={`text-sm ${styles.messageColor}`}>
                {message}
              </p>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;
