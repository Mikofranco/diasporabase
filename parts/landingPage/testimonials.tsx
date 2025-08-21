import Image from "next/image";
import { Star } from "lucide-react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      id: "testimonial-1",
      name: "Sarah Johnson",
      role: "Volunteer",
      avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg",
      quote:
        "DiasporaBase made it so easy to find meaningful volunteer work. I've connected with amazing organizations and made a real impact in my community.",
    },
    {
      id: "testimonial-2",
      name: "Michael Chen",
      role: "Organization Director",
      avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg",
      quote:
        "The platform has revolutionized how we recruit volunteers. We've seen a 300% increase in applications since joining DiasporaBase.",
    },
    {
      id: "testimonial-3",
      name: "Emma Rodriguez",
      role: "Community Leader",
      avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg",
      quote:
        "The quality of volunteers we've met through this platform is exceptional. Everyone is passionate and committed to making a difference.",
    },
  ];

  return (
    <div className="py-20 bg-[#E5F4F9] dark:bg-gray-900 transition-colors duration-500 p-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px- flex flex-col items-center gap-10">
        <div className="text-center mb-14">
          <h2 className="text-[38px] font-bold text-[#1E293B] mb-4">What People Are Saying</h2>
          <p className="text-xl text-slate-600">Hear from our community of volunteers and organizations</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white rounded-lg p-8 shadow-sm">
              <div className="flex items-center mb-6">
                <Image
                  src={testimonial.avatar}
                  alt={`${testimonial.name}'s avatar`}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h4 className="font-semibold text-blue-600">{testimonial.name}</h4>
                  <p className="text-sm text-slate-600">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-slate-700 mb-4">{testimonial.quote}</p>
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialsSection;