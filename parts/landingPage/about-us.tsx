import { Check } from "lucide-react";

const AboutUsSection = () => {
  const features = [
    "Verified organizations and opportunities",
    "Comprehensive volunteer matching system",
    "24/7 support and community resources",
  ];

  const stats = [
    { value: "5+", label: "Years Experience" },
    { value: "50+", label: "Countries Served" },
    { value: "1M+", label: "Hours Volunteered" },
    { value: "98%", label: "Satisfaction Rate" },
  ];

  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-[#1E293B]">
              About DiasporaBase  
            </h2>
            <p className="text-lg text-slate-600">
              DiasporaBase is a volunteering and collaboration platform which
              helps African professionals based in the diaspora to remotely
              contribute their expertise to nation-building by supporting
              African public institutions such as ministries, agencies, and
              public programs.
            </p>
            <p className="text-slate-600">
              From policy and communications to data, design, and systems
              support, we match skilled volunteers to real institutional needs,
              enabling diaspora professionals to deliver impact in their home
              countries without needing to relocate.
            </p>
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-8 h-8 bg-[#1E293B] rounded-full flex items-center justify-center mr-4">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#E5F4F9] rounded-lg p-8">
            <div className="grid grid-cols-2 gap-8 text-center">
              {stats.map((stat, index) => (
                <div key={index}>
                  <div className="text-3xl font-bold text-[#1E293B] mb-2">
                    {stat.value}
                  </div>
                  <div className="text-slate-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsSection;
