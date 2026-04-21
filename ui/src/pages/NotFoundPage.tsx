import type { FC } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaHome } from "react-icons/fa";
import { Trans } from '@/components/Trans';
import Logo from "../assets/logo_odoo_2.svg";

const NotFoundPage: FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-blue-100 to-white dark:from-gray-900 dark:to-gray-800 text-center px-6 transition-colors duration-300">
      
      {/* Logo */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="mb-6"
      >
        <img src={Logo} alt="Logo" className="w-45 h-60 mx-auto drop-shadow-md dark:drop-shadow-lg" />
      </motion.div>

      {/* 404 */}
      <motion.h1
        className="text-6xl font-extrabold text-blue-600 dark:text-blue-400"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        404
      </motion.h1>

      <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
        <Trans translationKey="notFound.message" text="Oops! The page you're looking for doesn't exist." />
      </p>

      {/* Road with Animation (CSS merged here via style) */}
      <motion.div
        className="mt-10 w-full max-w-md h-2 rounded relative overflow-hidden dark:bg-gray-700"
        style={{
          backgroundImage: `repeating-linear-gradient(
            to right,
            #1d4ed8 0px,
            #1d4ed8 40px,
            #93c5fd 40px,
            #93c5fd 80px
          )`,
          backgroundSize: "200% auto",
        }}
        animate={{ backgroundPosition: ["0% 0%", "-200% 0%"] }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
      >
        {/* Car Icon Driving */}
        <motion.div
          className="absolute -top-8 left-0"
          animate={{ x: ["0%", "100%"] }}
          transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
        >
          🚗
        </motion.div>
      </motion.div>

      {/* Go Home Button */}
      <Link
        to="/"
        className="mt-10 flex items-center justify-center gap-2 px-6 py-3 rounded-full shadow-md transition
                   text-black hover:bg-gray-200
                   dark:bg-white dark:hover:bg-gray-200"
        title="Go Home"
      >
        <FaHome size={23} />
      </Link>
    </div>
  );
};

export default NotFoundPage;
