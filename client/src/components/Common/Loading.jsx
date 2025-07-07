import React from 'react';
import { motion } from 'framer-motion';

const Loading = ({ message = 'Загрузка...' }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 rounded-lg p-8 text-center"
      >
        <div className="relative w-20 h-20 mx-auto mb-4">
          <motion.div
            className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-2 border-4 border-red-500 rounded-full border-t-transparent"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <p className="text-white text-lg">{message}</p>
      </motion.div>
    </div>
  );
};

export default Loading;