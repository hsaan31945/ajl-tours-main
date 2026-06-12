import React, { useState } from "react";
import { CheckCircle, ChevronDown, Clock, Compass, HeartPulse, Map, Quote, Star, Car, ShieldCheck, Users } from "lucide-react";
import { useI18n } from "../i18n";

const hero4Small = "/assets/images/optimized/hero4-900.webp";
const hero5Small = "/assets/images/optimized/hero5-900.webp";
const hero6Mobile768 = "/assets/images/optimized/hero6-768.webp";
const hero7Small = "/assets/images/optimized/hero7-900.webp";

const heroGridImages = [
  { src: hero4Small, alt: "Swiss mountain village" },
  { src: hero7Small, alt: "Swiss alpine landscape" },
  { src: hero5Small, alt: "Swiss scenic valley" },
  { src: hero6Mobile768, alt: "Switzerland Alps" },
];

const HomeDeferredContent = () => {
  const { t } = useI18n();
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <>
      <section className="py-24 px-6 sm:px-12 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-orange-700 font-bold uppercase tracking-[0.3em] mb-4">{t("home.exclusiveExperience")}</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1A2B47]">{t("home.servicesTitle")}</h2>
          </div>

          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 sm:mx-0 sm:px-0">
            <div className="min-w-[85%] md:min-w-0 snap-center">
              <ServiceCard icon={<Compass />} title={t("home.services.customItineraryTitle")} description={t("home.services.customItineraryText")} />
            </div>
            <div className="min-w-[85%] md:min-w-0 snap-center">
              <ServiceCard icon={<Users />} title={t("home.services.privateToursTitle")} description={t("home.services.privateToursText")} />
            </div>
            <div className="min-w-[85%] md:min-w-0 snap-center">
              <ServiceCard icon={<Car />} title={t("home.services.vehiclesTitle")} description={t("home.services.vehiclesText")} />
            </div>
            <div className="min-w-[85%] md:min-w-0 snap-center">
              <ServiceCard icon={<ShieldCheck />} title={t("home.services.chauffeursTitle")} description={t("home.services.chauffeursText")} />
            </div>
            <div className="min-w-[85%] md:min-w-0 snap-center">
              <ServiceCard icon={<Map />} title={t("home.services.guidesTitle")} description={t("home.services.guidesText")} />
            </div>
            <div className="min-w-[85%] md:min-w-0 snap-center">
              <ServiceCard icon={<Clock />} title={t("home.services.pickupTitle")} description={t("home.services.pickupText")} />
            </div>
            <div className="min-w-[85%] md:min-w-0 snap-center">
              <ServiceCard icon={<HeartPulse />} title={t("home.services.seasonalTitle")} description={t("home.services.seasonalText")} />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 sm:px-12 bg-[#1A2B47] text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
            <div>
              <h2 className="text-4xl font-extrabold mb-8 text-orange-300 whitespace-nowrap">{t("home.whoWeAre")}</h2>
              <p className="text-lg text-gray-300 leading-relaxed font-medium">{t("home.whoWeAreText")}</p>
            </div>
            <div>
              <h2 className="text-4xl font-extrabold mb-8 text-orange-300 whitespace-nowrap">{t("home.ourMission")}</h2>
              <p className="text-lg text-gray-300 leading-relaxed font-medium">{t("home.missionText")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 sm:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="lg:w-1/2 order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="aspect-square rounded-3xl overflow-hidden shadow-lg"><img src={heroGridImages[0].src} alt={heroGridImages[0].alt} width="900" height="600" loading="lazy" className="w-full h-full object-cover" /></div>
                  <div className="aspect-square rounded-3xl overflow-hidden shadow-lg"><img src={heroGridImages[1].src} alt={heroGridImages[1].alt} width="900" height="600" loading="lazy" className="w-full h-full object-cover" /></div>
                </div>
                <div className="space-y-6 pt-12">
                  <div className="aspect-square rounded-3xl overflow-hidden shadow-lg"><img src={heroGridImages[2].src} alt={heroGridImages[2].alt} width="900" height="600" loading="lazy" className="w-full h-full object-cover" /></div>
                  <div className="aspect-square rounded-3xl overflow-hidden shadow-lg transform scale-110"><img src={heroGridImages[3].src} alt={heroGridImages[3].alt} width="900" height="600" loading="lazy" className="w-full h-full object-cover" /></div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 order-1 lg:order-2">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1A2B47] mb-8 leading-tight">{t("home.whyChooseUs")}</h2>
              <div className="space-y-8">
                <FeatureItem title={t("home.features.authenticityTitle")} text={t("home.features.authenticityText")} />
                <FeatureItem title={t("home.features.excellenceTitle")} text={t("home.features.excellenceText")} />
                <FeatureItem title={t("home.features.personalisationTitle")} text={t("home.features.personalisationText")} />
                <FeatureItem title={t("home.features.guidesTitle")} text={t("home.features.guidesText")} />
                <FeatureItem title={t("home.features.travelTitle")} text={t("home.features.travelText")} />
                <FeatureItem title={t("home.features.memoriesTitle")} text={t("home.features.memoriesText")} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 sm:px-12 bg-gray-50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100 rounded-full blur-[100px] -mr-48 -mt-48 opacity-50" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <p className="text-orange-700 font-bold uppercase tracking-[0.3em] mb-4">{t("home.guestExperiences")}</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1A2B47]">{t("home.testimonials")}</h2>
          </div>

          <div className="flex md:grid md:grid-cols-2 gap-8 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 sm:mx-0 sm:px-0">
            <div className="min-w-[90%] md:min-w-0 snap-center">
              <TestimonialCard name="Michael C." location="United Kingdom" text="Our private Lucerne and mount titles tour booked with AJL Tours surpassed all expectations. The planning was superb and our guide was highly knowledgeable, sharing incredible local insights that one could never know about, on their own. It was truly a premium and first class experience provided by AJL Tours." />
            </div>
            <div className="min-w-[90%] md:min-w-0 snap-center">
              <TestimonialCard name="Lara J." location="United States" text="We went for a tour of Grindelwald and Interlaken using AJL Tours and it was one of our most memorable experiences so far. From a luxurious vehicle to a very passionate guide, every moment was perfectly handled by the AJL Team. This was our first time experiencing Switzerland and its beauty at our own pace." />
            </div>
            <div className="min-w-[90%] md:min-w-0 snap-center">
              <TestimonialCard name="Hala F." location="UAE" text="Our main highlight of our European trip was our visit to Zermatt and Matterhorn, which we booked using AJL Tours. The scenic views were awesome inspiring and breathtaking and it was made even more special due to the personalised service provided by AJL Tours. They combined warmth with professionalism." />
            </div>
            <div className="min-w-[90%] md:min-w-0 snap-center">
              <TestimonialCard name="Ming Yen S." location="Taiwan" text="As a frequent traveller using guide services, I have to say that my Switzerland trip was made hassle free with an amazing chauffeur who saved up so much time while also showing me around the beautiful views of Switzerland. The private service with a vast range of options and flexibility was superb and outstanding." />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 sm:px-12 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1A2B47] mb-4">{t("home.faqTitle")}</h2>
            <p className="text-lg text-gray-600">{t("home.faqSubtitle")}</p>
          </div>

          <div className="space-y-4">
            {Array.from({ length: 10 }, (_, index) => (
              <FaqItem
                key={index}
                question={t(`home.faq.q${index + 1}`)}
                answer={t(`home.faq.a${index + 1}`)}
                isOpen={openFaq === index}
                toggle={() => setOpenFaq(openFaq === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 sm:px-12 bg-[#c2410c] text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-4">{t("home.howToBook")}</h2>
            <p className="text-xl text-white/90">{t("home.howToBookText")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <BookingStep number="1" title={t("home.bookingSteps.passengersTitle")} text={t("home.bookingSteps.passengersText")} />
            <BookingStep number="2" title={t("home.bookingSteps.destinationTitle")} text={t("home.bookingSteps.destinationText")} />
            <BookingStep number="3" title={t("home.bookingSteps.requestsTitle")} text={t("home.bookingSteps.requestsText")} />
            <BookingStep number="4" title={t("home.bookingSteps.hotelsTitle")} text={t("home.bookingSteps.hotelsText")} />
          </div>
        </div>
      </section>
    </>
  );
};

const ServiceCard = ({ icon, title, description }) => (
  <div className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
    <div className="bg-orange-50 w-20 h-20 rounded-2xl flex items-center justify-center text-orange-700 mb-8 group-hover:bg-orange-700 group-hover:text-white transition-colors duration-300">
      {React.cloneElement(icon, { size: 40 })}
    </div>
    <h3 className="text-2xl font-bold text-[#1A2B47] mb-4">{title}</h3>
    <p className="text-gray-600 leading-relaxed font-medium">{description}</p>
  </div>
);

const FaqItem = ({ question, answer, isOpen, toggle }) => (
  <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm transition-all duration-300">
    <button onClick={toggle} className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors">
      <span className="text-xl font-bold text-[#1A2B47]">{question}</span>
      <div className={`p-2 rounded-xl transition-all duration-300 ${isOpen ? "bg-orange-700 text-white rotate-180" : "bg-gray-100 text-gray-500"}`}>
        <ChevronDown size={20} />
      </div>
    </button>
    <div className={`transition-all duration-500 overflow-hidden ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
      <div className="px-8 pb-8 pt-2 text-lg text-gray-600 font-medium leading-relaxed">{answer}</div>
    </div>
  </div>
);

const BookingStep = ({ number, title, text }) => (
  <div className="relative group">
    <div className="bg-white/10 backdrop-blur-sm p-8 rounded-3xl border border-white/20 h-full flex flex-col items-center text-center hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2">
      <div className="w-16 h-16 bg-white text-orange-700 rounded-2xl flex items-center justify-center text-3xl font-black mb-6 shadow-lg shadow-black/10">
        {number}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-sm text-white/90 leading-relaxed font-medium">{text}</p>
    </div>
    {number !== "5" && (
      <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 z-10">
        <div className="w-6 h-6 border-t-4 border-r-4 border-white/30 rotate-45" />
      </div>
    )}
  </div>
);

const FeatureItem = ({ title, text }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0">
      <div className="bg-orange-100 p-2 rounded-lg">
        <CheckCircle className="w-6 h-6 text-orange-700" />
      </div>
    </div>
    <div>
      <h3 className="text-xl font-bold text-[#1A2B47] mb-1">{title}</h3>
      <p className="text-gray-600 font-medium">{text}</p>
    </div>
  </div>
);

const TestimonialCard = ({ name, location, text }) => (
  <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col h-full relative group hover:shadow-xl transition-all duration-300">
    <Quote className="absolute top-10 right-10 w-12 h-12 text-gray-100 group-hover:text-orange-100 transition-colors" />
    <div className="flex gap-1 mb-6">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-5 h-5 fill-orange-600 text-orange-600" />
      ))}
    </div>
    <p className="text-xl text-[#1A2B47] font-medium leading-relaxed mb-8 flex-1 italic">"{text}"</p>
    <div className="flex items-center gap-4 border-t border-gray-50 pt-8">
      <div className="w-12 h-12 bg-orange-700 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-200">
        {name[0]}
      </div>
      <div>
        <p className="font-bold text-[#1A2B47] text-lg">{name}</p>
        <p className="text-orange-700 font-bold text-sm uppercase tracking-widest">{location}</p>
      </div>
    </div>
  </div>
);

export default HomeDeferredContent;
