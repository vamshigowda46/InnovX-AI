import DarkBackground from '../../components/landing/DarkBackground'
import PremiumNav from '../../components/landing/PremiumNav'
import HeroSection from '../../components/landing/HeroSection'
import DashboardPreview from '../../components/landing/DashboardPreview'
import FeaturesGrid from '../../components/landing/FeaturesGrid'
import ToolsSection from '../../components/landing/ToolsSection'
import WhyInnovX from '../../components/landing/WhyInnovX'
import StatsSection from '../../components/landing/StatsSection'
import TestimonialsCarousel from '../../components/landing/TestimonialsCarousel'
import PricingSection from '../../components/landing/PricingSection'
import FinalCta from '../../components/landing/FinalCta'
import LandingFooter from '../../components/landing/LandingFooter'

export default function Landing() {
  return (
    <div className="landing-page min-h-screen bg-[#050816] text-white overflow-x-hidden scroll-smooth relative">
      <DarkBackground />
      <PremiumNav />

      <main className="relative z-10">
        <HeroSection />
        <DashboardPreview />
        <FeaturesGrid />
        <ToolsSection />
        <WhyInnovX />
        <StatsSection />
        <TestimonialsCarousel />
        <PricingSection />
        <FinalCta />
        <LandingFooter />
      </main>
    </div>
  )
}
