import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useState, useEffect } from 'react';

const StatsSection = () => {
  const stats = [
    { value: 2547, label: 'Active Volunteers', icon: '👥', color: 'bg-blue-300' },
    { value: 148, label: 'Active Projects', icon: '🚀', color: 'bg-purple-300' },
    { value: 73, label: 'Registered Agencies', icon: '🏢', color: 'bg-green-300' },
  ];

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const [hasAnimated, setHasAnimated] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  const numberVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  // Custom hook to handle counting animation
  const useCountUp = (targetValue: number, inView) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!inView || hasAnimated) return;

      let start = 0;
      const duration = 1500; // Animation duration in ms
      const increment = targetValue / (duration / 16); //ts-ignore
      let startTime = null;

      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;

        if (progress < duration) {
          setCount(Math.min(Math.floor(start + increment * (progress / 16)), targetValue));
          requestAnimationFrame(animate);
        } else {
          setCount(targetValue);
          setHasAnimated(true);
        }
      };

      if (inView) {
        requestAnimationFrame(animate);
      }

      return () => setHasAnimated(true); // Ensure animation completes
    }, [inView, targetValue, hasAnimated]);

    return count;
  };

  return (
    <section className="py-20 bg-gray-100 dark:bg-gray-700 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-4 tracking-tight">
            Our Impact in Numbers
          </h2>
          <p className="text-xl text-gray-500 dark:text-gray-200 max-w-3xl mx-auto leading-relaxed">
            Discover the scale of our community and the difference we're making together.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
        >
          {stats.map((stat, index) => {
            const count = useCountUp(stat.value, inView);

            return (
              <motion.div
                key={index}//@ts-ignore
                variants={cardVariants}
                className={`relative p-8 bg-white dark:bg-gray-600 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 group overflow-hidden border border-gray-200 dark:border-gray-500 hover:-translate-y-1 ${stat.color} bg-opacity-20`}
                role="region"
                aria-label={`Statistic: ${stat.label}`}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <motion.div
                  custom={{ targetValue: stat.value }}//@ts-ignore
                  variants={numberVariants}
                  className="text-5xl md:text-6xl font-extrabold text-gray-800 dark:text-gray-100 mb-4"
                >
                  {count.toLocaleString()}
                </motion.div>

                <div className="flex items-center gap-3">
                  <span className="text-2xl transform group-hover:scale-110 transition-transform duration-300">{stat.icon}</span>
                  <span className="text-lg font-medium text-gray-500 dark:text-gray-200">{stat.label}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;