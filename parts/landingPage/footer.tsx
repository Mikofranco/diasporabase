import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    Platform: [
      { label: "Find Opportunities", href: "/opportunities" },
      { label: "Post Projects", href: "/post-projects" },
      { label: "Join Community", href: "/community" },
      { label: "Success Stories", href: "/success-stories" },
    ],
    Support: [
      { label: "Help Center", href: "/help" },
      { label: "Contact Us", href: "/contact" },
      { label: "Safety Guidelines", href: "/safety" },
      { label: "Report Issue", href: "/report" },
    ],
    Legal: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  };

  const socialIcons = [
    { Icon: Facebook, href: "#", label: "Facebook" },
    { Icon: Twitter, href: "#", label: "Twitter" },
    { Icon: Linkedin, href: "#", label: "LinkedIn" },
    { Icon: Instagram, href: "#", label: "Instagram" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.footer
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="bg-[#1E293B] text-white py-16 min-h-[350px] relative overflow-hidden footer"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent)]" />
      <div className="mx-auto px-4 sm:px-6 lg:px-8 relative z-10 p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <motion.div 
            variants={itemVariants}
            className="space-y-6"
          >
            <div className="flex items-center">
              <Image
                src="https://diasporabase.com/icononly_logo.png"
                alt="DiasporaBase Logo"
                width={40}
                height={40}
                className="w-10 h-10 mr-3 filter brightness-0 invert rounded-lg"
                onError={(e) => (e.currentTarget.src = "/svg/logo.svg")}
                priority
              />
              <span className="text-2xl font-bold tracking-tight">
                DiasporaBase
              </span>
            </div>
            <p className="text-gray-200 text-base leading-relaxed max-w-xs">
              Connecting volunteers with meaningful opportunities worldwide.
            </p>
            <div className="flex space-x-4">
              {socialIcons.map(({ Icon, href, label }, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link href={href} aria-label={`Visit our ${label} page`}>
                    <Icon className="w-6 h-6 text-gray-200 hover:text-white transition-colors duration-300" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {Object.entries(footerLinks).map(
            (
              [section, links] // @ts-ignore
            ) => (
              <motion.div
                key={section}// @ts-ignore
                variants={itemVariants}
                className="space-y-6"
              >
                <h4 className="text-xl font-semibold text-white tracking-wide">
                  {section}
                </h4>
                <ul className="space-y-4 text-gray-200 text-base">
                  {links.map((link, index) => (
                    <motion.li
                      key={index}
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link
                        href={link.href}
                        className="hover:text-white transition-colors duration-300 hover:underline underline-offset-4"
                      >
                        {link.label}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )
          )}
        </div>

        <motion.div //@ts-ignore
          variants={itemVariants}
          className="border-t border-gray-600 mt-20 pt-8 text-center"
        >
          <p className="text-gray-200 text-sm">
            &copy; {new Date().getFullYear()} DiasporaBase. All rights reserved.
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;
